// API: POST /api/book
// Creates a new booking for the logged-in user.
// Body: { facility_id, booking_date, booking_time_slot, booking_group_size }
// Validates: facility exists, facility open, capacity, no double-booking
// On success: inserts booking + notification, returns booking_id

import { pool } from '@/lib/db'
import { getUser } from '@/lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  // Must be logged in
  const user = await getUser(req)
  if (!user) {
    return res.status(401).json({ success: false, error: 'Not logged in.' })
  }

  const { facility_id, booking_date, booking_time_slot, booking_group_size } = req.body

  // ── Validate required fields ───────────────────────────────────────────────
  if (!facility_id || !booking_date || !booking_time_slot || !booking_group_size) {
    return res.status(400).json({
      success: false,
      error: 'All fields are required: facility_id, booking_date, booking_time_slot, booking_group_size.',
    })
  }

  const groupSize = parseInt(booking_group_size)
  if (isNaN(groupSize) || groupSize < 1) {
    return res.status(400).json({ success: false, error: 'Group size must be at least 1.' })
  }

  try {
    // Get a dedicated connection for the transaction
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // ── Check facility exists ──────────────────────────────────────────────
      const [facilities] = await connection.query(
        'SELECT facility_id, facility_name, facility_capacity, facility_status FROM facilities WHERE facility_id = ?',
        [facility_id]
      )
      if (facilities.length === 0) {
        await connection.rollback()
        connection.release()
        return res.status(404).json({ success: false, error: 'Facility not found.' })
      }

      const facility = facilities[0]

      // ── Check facility is open ─────────────────────────────────────────────
      if (facility.facility_status !== 'open') {
        await connection.rollback()
        connection.release()
        return res.status(400).json({
          success: false,
          error: 'This facility is currently closed and cannot be booked.',
        })
      }

      // ── Check group size does not exceed capacity ──────────────────────────
      if (groupSize > facility.facility_capacity) {
        await connection.rollback()
        connection.release()
        return res.status(400).json({
          success: false,
          error: `Group size (${groupSize}) exceeds facility capacity (${facility.facility_capacity}).`,
        })
      }

      // ── Double-booking check with ROW LOCK ───────────────────────────────
      // FOR UPDATE locks the rows (or the index if no rows exist yet) to prevent other
      // concurrent transactions from inserting a booking for the same slot at the exact same time.
      const [existing] = await connection.query(
        `SELECT booking_id FROM bookings
         WHERE facility_id = ?
           AND booking_date = ?
           AND booking_time_slot = ?
           AND booking_status IN ('booked', 'checked-in')
         FOR UPDATE`,
        [facility_id, booking_date, booking_time_slot]
      )
      if (existing.length > 0) {
        await connection.rollback()
        connection.release()
        return res.status(409).json({
          success: false,
          error: 'This time slot is already booked. Please choose a different slot.',
        })
      }

      // ── Insert the booking ─────────────────────────────────────────────────
      const [result] = await connection.query(
        `INSERT INTO bookings
           (user_id, facility_id, booking_date, booking_time_slot, booking_group_size, booking_status, booking_created_at)
         VALUES (?, ?, ?, ?, ?, 'booked', NOW())`,
        [user.user_id, facility_id, booking_date, booking_time_slot, groupSize]
      )

      const newBookingId = result.insertId

      // ── Insert a confirmation notification for the user ────────────────────
      await connection.query(
        `INSERT INTO notifications (user_id, notification_message, notification_created_at)
         VALUES (?, ?, NOW())`,
        [
          user.user_id,
          `✅ Your booking for ${facility.facility_name} on ${booking_date} (${booking_time_slot}) has been confirmed. Booking ID: #${newBookingId}`,
        ]
      )

      // Everything succeeded, commit the transaction
      await connection.commit()
      connection.release()

      return res.status(201).json({
        success: true,
        message: 'Booking confirmed!',
        data: { booking_id: newBookingId },
      })
    } catch (err) {
      // If anything fails inside the transaction, roll it back
      await connection.rollback()
      connection.release()
      throw err // pass to the outer catch block to send the 500 response
    }
  } catch (err) {
    console.error('POST /api/book error:', err)
    return res.status(500).json({ success: false, error: 'Failed to create booking.' })
  }
}
