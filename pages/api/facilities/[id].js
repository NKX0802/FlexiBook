// API: GET /api/facilities/[id]
// Returns one facility by facility_id.
// Optional: ?booking_date=YYYY-MM-DD  → also returns booked_slots for that date
// If user is logged in, also returns is_favourited

import { pool } from '@/lib/db'
import { getUser } from '@/lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { id, booking_date } = req.query

  try {
    const user = await getUser(req)

    let facilityRows

    if (user) {
      // Include is_favourited for logged-in users
      const [rows] = await pool.query(
        `SELECT f.*,
          CASE WHEN fav.favourite_id IS NOT NULL THEN 1 ELSE 0 END AS is_favourited
         FROM facilities f
         LEFT JOIN favourites fav ON fav.facility_id = f.facility_id AND fav.user_id = ?
         WHERE f.facility_id = ?`,
        [user.user_id, id]
      )
      facilityRows = rows
    } else {
      const [rows] = await pool.query(
        'SELECT *, 0 AS is_favourited FROM facilities WHERE facility_id = ?',
        [id]
      )
      facilityRows = rows
    }

    if (facilityRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Facility not found.' })
    }

    const facility = facilityRows[0]

    // If a date is provided, return already-booked time slots for that date
    let booked_slots = []
    if (booking_date) {
      const [bookings] = await pool.query(
        `SELECT booking_time_slot FROM bookings
         WHERE facility_id = ?
           AND booking_date = ?
           AND booking_status NOT IN ('cancelled', 'no-show')`,
        [id, booking_date]
      )
      booked_slots = bookings.map(b => b.booking_time_slot)
    }

    return res.status(200).json({
      success: true,
      data: { ...facility, booked_slots },
    })
  } catch (err) {
    console.error('GET /api/facilities/[id] error:', err)
    return res.status(500).json({ success: false, error: 'Failed to fetch facility.' })
  }
}
