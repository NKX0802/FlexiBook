// API: /api/bookings
// GET  — return all bookings for the logged-in user (joined with facility info)
//        Optional: ?status=booked|checked-in|cancelled|no-show
// DELETE ?id=BOOKING_ID — cancel own booking (only if status is 'booked')

import { pool } from '@/lib/db'
import { getUser } from '@/lib/auth'

export default async function handler(req, res) {
  // All methods require login
  const user = await getUser(req)
  if (!user) {
    return res.status(401).json({ success: false, error: 'Not logged in.' })
  }

  // ── GET — fetch bookings for this user ─────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { status } = req.query

      let query = `
        SELECT
          b.booking_id, b.user_id, b.facility_id,
          b.booking_date, b.booking_time_slot, b.booking_group_size,
          b.booking_status, b.booking_cancel_reason, b.booking_created_at,
          f.facility_name, f.facility_type, f.facility_image_url, f.facility_capacity
        FROM bookings b
        JOIN facilities f ON f.facility_id = b.facility_id
        WHERE b.user_id = ?
      `
      const params = [user.user_id]

      if (status) {
        query += ' AND b.booking_status = ?'
        params.push(status)
      }

      query += ' ORDER BY b.booking_date DESC, b.booking_created_at DESC'

      const [rows] = await pool.query(query, params)
      return res.status(200).json({ success: true, data: rows })
    } catch (err) {
      console.error('GET /api/bookings error:', err)
      return res.status(500).json({ success: false, error: 'Failed to fetch bookings.' })
    }
  }

  // ── DELETE — cancel a booking ──────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const bookingId = req.query.id
    if (!bookingId) {
      return res.status(400).json({ success: false, error: 'Booking ID is required.' })
    }

    try {
      // Make sure the booking belongs to this user
      const [bookings] = await pool.query(
        'SELECT booking_id, booking_status, facility_id, booking_date, booking_time_slot FROM bookings WHERE booking_id = ? AND user_id = ?',
        [bookingId, user.user_id]
      )

      if (bookings.length === 0) {
        return res.status(404).json({ success: false, error: 'Booking not found.' })
      }

      const booking = bookings[0]

      // Only allow cancellation if still in 'booked' status
      if (booking.booking_status !== 'booked') {
        return res.status(400).json({
          success: false,
          error: 'Only upcoming bookings with status "booked" can be cancelled.',
        })
      }

      // Update the booking status
      await pool.query(
        `UPDATE bookings
         SET booking_status = 'cancelled', booking_cancel_reason = 'Cancelled by user'
         WHERE booking_id = ?`,
        [bookingId]
      )

      // Get facility name for the notification message
      const [facilities] = await pool.query(
        'SELECT facility_name FROM facilities WHERE facility_id = ?',
        [booking.facility_id]
      )
      const facilityName = facilities[0]?.facility_name || 'Facility'

      // Insert a cancellation notification for the user
      await pool.query(
        `INSERT INTO notifications (user_id, notification_message, notification_created_at)
         VALUES (?, ?, NOW())`,
        [
          user.user_id,
          `🚫 Your booking for ${facilityName} on ${booking.booking_date} (${booking.booking_time_slot}) has been cancelled.`,
        ]
      )

      return res.status(200).json({ success: true, message: 'Booking cancelled.' })
    } catch (err) {
      console.error('DELETE /api/bookings error:', err)
      return res.status(500).json({ success: false, error: 'Failed to cancel booking.' })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
