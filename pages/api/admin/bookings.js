// API: GET  /api/admin/bookings — return all bookings (joined with users + facilities)
//          Query: ?search=&status=&date=
// API: PATCH /api/admin/bookings?id=BOOKING_ID — admin updates booking status
//          Body: { status: 'cancelled'|'no-show', cancel_reason?: string }
// Admin only

import { pool } from '@/lib/db'
import { getUser } from '@/lib/auth'

export default async function handler(req, res) {
  const admin = await getUser(req)
  if (!admin) return res.status(401).json({ success: false, error: 'Not logged in.' })
  if (admin.user_role !== 'admin') return res.status(403).json({ success: false, error: 'Admin access required.' })

  // ── GET — fetch all bookings ──────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { search = '', status = '', date = '' } = req.query

      let query = `
        SELECT
          b.booking_id, b.user_id, b.facility_id,
          b.booking_date, b.booking_time_slot, b.booking_group_size,
          b.booking_status, b.booking_cancel_reason, b.booking_created_at,
          b.checked_in_at, b.no_show_marked_at,
          u.user_name, u.user_email,
          f.facility_name, f.facility_type
        FROM bookings b
        JOIN users u ON u.user_id = b.user_id
        JOIN facilities f ON f.facility_id = b.facility_id
        WHERE 1=1
      `
      const params = []

      if (search) {
        query += ' AND (u.user_name LIKE ? OR f.facility_name LIKE ? OR u.user_email LIKE ?)'
        const like = `%${search}%`
        params.push(like, like, like)
      }
      if (status) {
        query += ' AND b.booking_status = ?'
        params.push(status)
      }
      if (date) {
        query += ' AND b.booking_date = ?'
        params.push(date)
      }

      query += ' ORDER BY b.booking_date DESC, b.booking_created_at DESC'

      const [rows] = await pool.query(query, params)
      return res.status(200).json({ success: true, data: rows })
    } catch (err) {
      console.error('GET /api/admin/bookings error:', err)
      return res.status(500).json({ success: false, error: 'Failed to fetch bookings.' })
    }
  }

  // ── PATCH — update booking status ─────────────────────────────────────────
  if (req.method === 'PATCH') {
    const bookingId = req.query.id
    if (!bookingId) return res.status(400).json({ success: false, error: 'Booking ID required.' })

    const { status, cancel_reason } = req.body || {}
    const allowed = ['booked', 'checked-in', 'no-show', 'cancelled']
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status.' })
    }
    if (status === 'cancelled' && !cancel_reason?.trim()) {
      return res.status(400).json({ success: false, error: 'A cancellation reason is required.' })
    }

    try {
      // Fetch the booking (need user_id + current status)
      const [rows] = await pool.query(
        'SELECT booking_id, user_id, booking_status, facility_id, booking_date, booking_time_slot FROM bookings WHERE booking_id = ?',
        [bookingId]
      )
      if (rows.length === 0) return res.status(404).json({ success: false, error: 'Booking not found.' })

      const booking = rows[0]

      // Build the update based on new status
      if (status === 'cancelled') {
        await pool.query(
          `UPDATE bookings SET booking_status = 'cancelled', booking_cancel_reason = ? WHERE booking_id = ?`,
          [cancel_reason.trim(), bookingId]
        )
        // Only notify if not already cancelled
        if (booking.booking_status !== 'cancelled') {
          await pool.query(
            `INSERT INTO notifications (user_id, title, message, notification_type, is_read, created_by, created_at)
             VALUES (?, 'Booking Cancelled by Admin',
               CONCAT('Your booking on ', ?, ' (', ?, ') has been cancelled. Reason: ', ?),
               'cancelled', 0, ?, NOW())`,
            [booking.user_id, booking.booking_date, booking.booking_time_slot, cancel_reason.trim(), admin.user_id]
          )
        }
      } else if (status === 'no-show') {
        await pool.query(
          `UPDATE bookings SET booking_status = 'no-show', booking_cancel_reason = NULL, no_show_marked_at = NOW() WHERE booking_id = ?`,
          [bookingId]
        )
        if (booking.booking_status !== 'no-show') {
          await pool.query(
            `INSERT INTO notifications (user_id, title, message, notification_type, is_read, created_by, created_at)
             VALUES (?, 'No-Show Recorded',
               CONCAT('You were marked as no-show for your booking on ', ?, ' (', ?, '). Repeated no-shows may affect your booking privileges.'),
               'no-show', 0, NULL, NOW())`,
            [booking.user_id, booking.booking_date, booking.booking_time_slot]
          )
        }
      } else if (status === 'checked-in') {
        await pool.query(
          `UPDATE bookings SET booking_status = 'checked-in', booking_cancel_reason = NULL, checked_in_at = NOW(), no_show_marked_at = NULL WHERE booking_id = ?`,
          [bookingId]
        )
      } else {
        // booked — reset to booked
        await pool.query(
          `UPDATE bookings SET booking_status = 'booked', booking_cancel_reason = NULL, checked_in_at = NULL, no_show_marked_at = NULL WHERE booking_id = ?`,
          [bookingId]
        )
      }

      return res.status(200).json({ success: true, message: 'Booking updated.' })
    } catch (err) {
      console.error('PATCH /api/admin/bookings error:', err)
      return res.status(500).json({ success: false, error: 'Failed to update booking.' })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed.' })
}
