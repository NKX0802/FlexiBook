// API: GET    /api/admin/facilities — return all facilities
// API: POST   /api/admin/facilities — create a new facility
//   Body: { facility_name, facility_capacity, facility_type, facility_description, facility_image_url, facility_status }
// API: PUT    /api/admin/facilities?id=ID — update a facility
// API: DELETE /api/admin/facilities?id=ID — delete a facility
// Admin only

import { pool } from '@/lib/db'
import { getUser } from '@/lib/auth'

export default async function handler(req, res) {
  const admin = await getUser(req)
  if (!admin) return res.status(401).json({ success: false, error: 'Not logged in.' })
  if (admin.user_role !== 'admin') return res.status(403).json({ success: false, error: 'Admin access required.' })

  // ── GET — all facilities ──────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM facilities ORDER BY facility_id ASC'
      )
      return res.status(200).json({ success: true, data: rows })
    } catch (err) {
      console.error('GET /api/admin/facilities error:', err)
      return res.status(500).json({ success: false, error: 'Failed to fetch facilities.' })
    }
  }

  // ── POST — create facility ────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { facility_name, facility_capacity, facility_type, facility_description, facility_image_url, facility_status } = req.body || {}

    if (!facility_name?.trim()) return res.status(400).json({ success: false, error: 'Facility name is required.' })
    if (!facility_capacity || isNaN(Number(facility_capacity)) || Number(facility_capacity) < 1) {
      return res.status(400).json({ success: false, error: 'A valid capacity is required.' })
    }

    try {
      const [result] = await pool.query(
        `INSERT INTO facilities (facility_name, facility_capacity, facility_type, facility_description, facility_image_url, facility_status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          facility_name.trim(),
          Number(facility_capacity),
          facility_type || 'room',
          facility_description?.trim() || null,
          facility_image_url?.trim() || null,
          facility_status === 'closed' ? 'closed' : 'open',
        ]
      )
      return res.status(201).json({ success: true, data: { facility_id: result.insertId } })
    } catch (err) {
      console.error('POST /api/admin/facilities error:', err)
      return res.status(500).json({ success: false, error: 'Failed to create facility.' })
    }
  }

  // ── PUT — update facility ─────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const id = req.query.id
    if (!id) return res.status(400).json({ success: false, error: 'Facility ID required.' })

    const { facility_name, facility_capacity, facility_type, facility_description, facility_image_url, facility_status } = req.body || {}

    if (!facility_name?.trim()) return res.status(400).json({ success: false, error: 'Facility name is required.' })
    if (!facility_capacity || isNaN(Number(facility_capacity)) || Number(facility_capacity) < 1) {
      return res.status(400).json({ success: false, error: 'A valid capacity is required.' })
    }

    try {
      await pool.query(
        `UPDATE facilities SET
           facility_name = ?, facility_capacity = ?, facility_type = ?,
           facility_description = ?, facility_image_url = ?, facility_status = ?
         WHERE facility_id = ?`,
        [
          facility_name.trim(),
          Number(facility_capacity),
          facility_type || 'room',
          facility_description?.trim() || null,
          facility_image_url?.trim() || null,
          facility_status === 'closed' ? 'closed' : 'open',
          id,
        ]
      )
      return res.status(200).json({ success: true })
    } catch (err) {
      console.error('PUT /api/admin/facilities error:', err)
      return res.status(500).json({ success: false, error: 'Failed to update facility.' })
    }
  }

  // ── DELETE — delete facility ──────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const id = req.query.id
    if (!id) return res.status(400).json({ success: false, error: 'Facility ID required.' })

    try {
      await pool.query('DELETE FROM facilities WHERE facility_id = ?', [id])
      return res.status(200).json({ success: true })
    } catch (err) {
      console.error('DELETE /api/admin/facilities error:', err)
      // FK violation — facility has bookings
      if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({ success: false, error: 'Cannot delete a facility that has existing bookings. Close it instead.' })
      }
      return res.status(500).json({ success: false, error: 'Failed to delete facility.' })
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed.' })
}
