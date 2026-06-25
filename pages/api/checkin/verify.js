// API: POST /api/checkin/verify
// Accepts a scanned QR value containing a per-booking checkin_token
// Only admins may call this — they scan a student's booking QR to check them in
// Applies the 15-minute check-in grace period

import { pool } from '@/lib/db'
import { getUser } from '@/lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'method_not_allowed', message: 'Method not allowed' })
  }

  // 1. Authenticate — must be a logged-in admin
  const user = await getUser(req)
  if (!user) {
    return res.status(401).json({ success: false, error: 'unauthorized', message: 'You must be logged in.' })
  }
  if (user.user_role !== 'admin') {
    return res.status(403).json({ success: false, error: 'forbidden', message: 'Only admins can check in bookings.' })
  }

  // 2. Read scanned QR code value from request body
  const { qrValue } = req.body
  if (!qrValue) {
    return res.status(400).json({ success: false, error: 'invalid_qr', message: 'Invalid QR code.' })
  }

  // 3. Parse checkin_token from qrValue (support checkin_token=X or plain X)
  const strVal = String(qrValue).trim()
  let token = strVal
  if (strVal.includes('checkin_token=')) {
    const match = strVal.match(/checkin_token=(.+)/)
    if (match) {
      token = match[1].trim()
    }
  }

  if (!token) {
    return res.status(400).json({ success: false, error: 'invalid_qr', message: 'Invalid QR code.' })
  }

  try {
    // 4. Look up the booking this token belongs to (not scoped to the caller)
    const [bookings] = await pool.query(
      `SELECT b.booking_id, b.booking_date, b.booking_time_slot, b.booking_status,
              b.checked_in_at, b.no_show_marked_at,
              f.facility_name, u.user_name
       FROM bookings b
       JOIN facilities f ON f.facility_id = b.facility_id
       JOIN users u ON u.user_id = b.user_id
       WHERE b.checkin_token = ?`,
      [token]
    )

    if (bookings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'no_booking',
        message: 'No booking found for this QR code.',
      })
    }

    const booking = bookings[0]

    // 5. Get current time in Malaysia timezone (UTC+8) for date/diff matching
    const now = new Date()

    let dateStr
    if (booking.booking_date instanceof Date) {
      dateStr = booking.booking_date.toISOString().split('T')[0]
    } else {
      dateStr = String(booking.booking_date).split('T')[0]
    }

    // Slot is like "10:00-11:00", split to get start time "10:00"
    const slotStart = booking.booking_time_slot.split('-')[0]
    const [hourStr, minStr] = slotStart.split(':')
    const hour = parseInt(hourStr, 10)
    const min = parseInt(minStr, 10)

    // Create UTC Date representing the local time, then adjust to actual UTC timestamp
    const bookingDateParts = dateStr.split('-')
    const bookingStartMYT = new Date(Date.UTC(
      parseInt(bookingDateParts[0], 10),
      parseInt(bookingDateParts[1], 10) - 1,
      parseInt(bookingDateParts[2], 10),
      hour,
      min,
      0
    ))
    const actualBookingStartUTC = new Date(bookingStartMYT.getTime() - (8 * 60 * 60 * 1000))

    // Diff in minutes (positive means current time is after start time, negative means before)
    const diffMins = (now.getTime() - actualBookingStartUTC.getTime()) / (60 * 1000)

    // 6. If still 'booked' but more than 15 min late, mark as no-show
    let status = booking.booking_status
    let newlyMarkedNoShow = false
    if (status === 'booked' && diffMins > 15) {
      await pool.query(
        `UPDATE bookings
         SET booking_status = 'no-show', no_show_marked_at = NOW()
         WHERE booking_id = ?`,
        [booking.booking_id]
      )
      status = 'no-show'
      newlyMarkedNoShow = true
    }

    // 7. Resolve outcome
    if (status === 'booked' && diffMins >= 0 && diffMins <= 15) {
      await pool.query(
        `UPDATE bookings
         SET booking_status = 'checked-in', checked_in_at = NOW()
         WHERE booking_id = ?`,
        [booking.booking_id]
      )
      return res.status(200).json({
        success: true,
        message: `Checked in: ${booking.user_name} — ${booking.facility_name}`,
      })
    }

    if (status === 'checked-in') {
      return res.status(400).json({
        success: false,
        error: 'already_checked_in',
        message: 'This booking has already been checked in.',
      })
    }

    if (status === 'booked' && diffMins < 0) {
      return res.status(400).json({
        success: false,
        error: 'too_early',
        message: 'Too early to check in. Please scan again when the booking time starts.',
      })
    }

    if (newlyMarkedNoShow) {
      return res.status(400).json({
        success: false,
        error: 'no_show_late',
        message: `${booking.user_name} is more than 15 minutes late. This booking has been marked as no-show.`,
      })
    }

    if (status === 'no-show') {
      return res.status(400).json({
        success: false,
        error: 'already_no_show',
        message: 'This booking has already been marked as no-show.',
      })
    }

    if (status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'cancelled',
        message: 'This booking has been cancelled.',
      })
    }

    return res.status(400).json({
      success: false,
      error: 'no_booking',
      message: 'No valid booking found for this QR code.',
    })

  } catch (err) {
    console.error('Check-in verification error:', err)
    return res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Something went wrong. Please try again.',
    })
  }
}
