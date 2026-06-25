// API: GET /api/admin/dashboard
// Returns:
//   stats      — total bookings, checked-in, no-shows, cancelled, active facilities, total users
//   monthly    — bookings/checkins/no-shows grouped by month for the current year (12 months)
//   recent     — the 6 most recent bookings (joined with user + facility)
// Admin only

import { pool } from '@/lib/db'
import { getUser } from '@/lib/auth'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed.' })
  }

  const admin = await getUser(req)
  if (!admin) return res.status(401).json({ success: false, error: 'Not logged in.' })
  if (admin.user_role !== 'admin') return res.status(403).json({ success: false, error: 'Admin access required.' })

  try {
    const currentYear = new Date().getFullYear()

    // ── 1. Stat cards ────────────────────────────────────────────────────────
    const [[statsRow]] = await pool.query(`
      SELECT
        COUNT(*)                                              AS totalBookings,
        SUM(booking_status = 'checked-in')                   AS checkedIn,
        SUM(booking_status = 'no-show')                      AS noShows,
        SUM(booking_status = 'cancelled')                    AS cancelled
      FROM bookings
    `)

    const [[facilityRow]] = await pool.query(`
      SELECT
        SUM(facility_status = 'open')   AS activeFacilities,
        COUNT(*)                         AS totalFacilities
      FROM facilities
    `)

    const [[userRow]] = await pool.query(`
      SELECT COUNT(*) AS totalUsers FROM users WHERE user_role = 'user'
    `)

    const stats = {
      totalBookings:     Number(statsRow.totalBookings)     || 0,
      checkedIn:         Number(statsRow.checkedIn)         || 0,
      noShows:           Number(statsRow.noShows)           || 0,
      cancelled:         Number(statsRow.cancelled)         || 0,
      activeFacilities:  Number(facilityRow.activeFacilities) || 0,
      totalFacilities:   Number(facilityRow.totalFacilities)  || 0,
      totalUsers:        Number(userRow.totalUsers)           || 0,
    }

    // ── 2. Monthly chart — current year ──────────────────────────────────────
    const [monthlyRows] = await pool.query(`
      SELECT
        MONTH(booking_date)              AS month,
        COUNT(*)                          AS bookings,
        SUM(booking_status = 'checked-in') AS checkins,
        SUM(booking_status = 'no-show')    AS noShows
      FROM bookings
      WHERE YEAR(booking_date) = ?
      GROUP BY MONTH(booking_date)
      ORDER BY month ASC
    `, [currentYear])

    // Build a full 12-month array (fill gaps with 0)
    const monthMap = {}
    for (const row of monthlyRows) {
      monthMap[Number(row.month)] = {
        bookings: Number(row.bookings) || 0,
        checkins: Number(row.checkins) || 0,
        noShows:  Number(row.noShows)  || 0,
      }
    }
    const monthly = MONTH_LABELS.map((label, i) => ({
      month:    label,
      bookings: monthMap[i + 1]?.bookings || 0,
      checkins: monthMap[i + 1]?.checkins || 0,
      noShows:  monthMap[i + 1]?.noShows  || 0,
    }))

    // ── 3. Recent bookings (last 6) ──────────────────────────────────────────
    const [recentRows] = await pool.query(`
      SELECT
        b.booking_id, b.booking_date, b.booking_time_slot, b.booking_status,
        u.user_name,
        f.facility_name
      FROM bookings b
      JOIN users u ON u.user_id = b.user_id
      JOIN facilities f ON f.facility_id = b.facility_id
      ORDER BY b.booking_created_at DESC
      LIMIT 6
    `)

    return res.status(200).json({
      success: true,
      data: { stats, monthly, recent: recentRows },
    })
  } catch (err) {
    console.error('GET /api/admin/dashboard error:', err)
    return res.status(500).json({ success: false, error: 'Failed to load dashboard data.' })
  }
}
