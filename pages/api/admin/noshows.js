// API: GET /api/admin/noshows
// Returns users who have no-show bookings, grouped by user, sorted by count desc.
// Each user entry includes their individual no-show booking details.
// Also returns summary stats: total no-shows, users affected, no-shows this month.
// Admin only

import { pool } from '@/lib/db'
import { getUser } from '@/lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed.' })
  }

  const admin = await getUser(req)
  if (!admin) return res.status(401).json({ success: false, error: 'Not logged in.' })
  if (admin.user_role !== 'admin') return res.status(403).json({ success: false, error: 'Admin access required.' })

  try {
    // All no-show bookings joined with user + facility
    const [rows] = await pool.query(`
      SELECT
        b.booking_id, b.booking_date, b.booking_time_slot, b.no_show_marked_at,
        u.user_id, u.user_name, u.user_email,
        f.facility_name
      FROM bookings b
      JOIN users u ON u.user_id = b.user_id
      JOIN facilities f ON f.facility_id = b.facility_id
      WHERE b.booking_status = 'no-show'
      ORDER BY b.booking_date DESC
    `)

    // Group by user
    const userMap = {}
    for (const row of rows) {
      const key = row.user_id
      if (!userMap[key]) {
        userMap[key] = {
          user_id:    row.user_id,
          user_name:  row.user_name,
          user_email: row.user_email,
          count:      0,
          latest:     row.booking_date,
          bookings:   [],
        }
      }
      userMap[key].count++
      userMap[key].bookings.push({
        booking_id:       row.booking_id,
        booking_date:     row.booking_date,
        booking_time_slot: row.booking_time_slot,
        facility_name:    row.facility_name,
        no_show_marked_at: row.no_show_marked_at,
      })
      // Track the most recent no-show date
      if (row.booking_date > userMap[key].latest) {
        userMap[key].latest = row.booking_date
      }
    }

    const report = Object.values(userMap).sort((a, b) => b.count - a.count)

    // Stats
    const now = new Date()
    const thisYear  = now.getFullYear()
    const thisMonth = now.getMonth() + 1  // 1-based
    const thisMonthStr = `${thisYear}-${String(thisMonth).padStart(2, '0')}`

    const totalNoShows   = rows.length
    const usersAffected  = report.length
    const thisMonthCount = rows.filter(r =>
      String(r.booking_date).startsWith(thisMonthStr)
    ).length

    // ── Check who has already been warned today ───────────────────────────────
    // A "warning" = a notification of type 'no-show' sent by any admin today.
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [warnedRows] = await pool.query(`
      SELECT DISTINCT user_id
      FROM notifications
      WHERE notification_type = 'no-show'
        AND created_by IS NOT NULL
        AND created_at >= ?
    `, [todayStart])

    const warnedTodaySet = new Set(warnedRows.map(r => r.user_id))

    // Stamp warned_today on each report entry
    for (const entry of report) {
      entry.warned_today = warnedTodaySet.has(entry.user_id)
    }

    return res.status(200).json({
      success: true,
      data: {
        stats: { totalNoShows, usersAffected, thisMonthCount },
        report,
      },
    })
  } catch (err) {
    console.error('GET /api/admin/noshows error:', err)
    return res.status(500).json({ success: false, error: 'Failed to load no-show report.' })
  }
}
