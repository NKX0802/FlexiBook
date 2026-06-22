// API: /api/favourites
// GET  — return all favourited facilities for the logged-in user
// POST — add a facility to favourites (body: { facility_id })
// DELETE — remove a facility from favourites (body or query: facility_id)

import { pool } from '@/lib/db'
import { getUser } from '@/lib/auth'

export default async function handler(req, res) {
  // All methods require login
  const user = await getUser(req)
  if (!user) {
    return res.status(401).json({ success: false, error: 'Not logged in.' })
  }

  // ── GET — return all favourites for this user ──────────────────────────────
  if (req.method === 'GET') {
    try {
      const [rows] = await pool.query(
        `SELECT f.facility_id, f.facility_name, f.facility_capacity,
                f.facility_type, f.facility_description,
                f.facility_image_url, f.facility_status,
                fav.favourite_id
         FROM favourites fav
         JOIN facilities f ON f.facility_id = fav.facility_id
         WHERE fav.user_id = ?
         ORDER BY f.facility_name`,
        [user.user_id]
      )
      return res.status(200).json({ success: true, data: rows })
    } catch (err) {
      console.error('GET /api/favourites error:', err)
      return res.status(500).json({ success: false, error: 'Failed to fetch favourites.' })
    }
  }

  // ── POST — add a favourite ─────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { facility_id } = req.body
    if (!facility_id) {
      return res.status(400).json({ success: false, error: 'facility_id is required.' })
    }

    try {
      // Check facility exists
      const [facilities] = await pool.query(
        'SELECT facility_id FROM facilities WHERE facility_id = ?',
        [facility_id]
      )
      if (facilities.length === 0) {
        return res.status(404).json({ success: false, error: 'Facility not found.' })
      }

      // INSERT IGNORE prevents duplicate errors (schema has UNIQUE KEY uq_favourite)
      await pool.query(
        'INSERT IGNORE INTO favourites (user_id, facility_id) VALUES (?, ?)',
        [user.user_id, facility_id]
      )

      return res.status(200).json({ success: true, message: 'Added to favourites.' })
    } catch (err) {
      console.error('POST /api/favourites error:', err)
      return res.status(500).json({ success: false, error: 'Failed to add favourite.' })
    }
  }

  // ── DELETE — remove a favourite ───────────────────────────────────────────
  if (req.method === 'DELETE') {
    // Accept facility_id from query string (?facility_id=...) or body
    const facility_id = req.query.facility_id || req.body?.facility_id
    if (!facility_id) {
      return res.status(400).json({ success: false, error: 'facility_id is required.' })
    }

    try {
      await pool.query(
        'DELETE FROM favourites WHERE user_id = ? AND facility_id = ?',
        [user.user_id, facility_id]
      )
      return res.status(200).json({ success: true, message: 'Removed from favourites.' })
    } catch (err) {
      console.error('DELETE /api/favourites error:', err)
      return res.status(500).json({ success: false, error: 'Failed to remove favourite.' })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' })
}
