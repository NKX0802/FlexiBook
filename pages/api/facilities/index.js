// API: GET /api/facilities
// Supports optional query params: ?search=...&type=...&status=...
// If user is logged in, also returns is_favourited for each facility

import { pool } from '@/lib/db'
import { getUser } from '@/lib/auth'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const user = await getUser(req)
    const { search, type, status } = req.query

    // Build dynamic WHERE conditions
    const conditions = []
    const params = []

    if (search) {
      conditions.push('(LOWER(f.facility_name) LIKE LOWER(?) OR LOWER(f.facility_type) LIKE LOWER(?))')
      params.push(`%${search}%`, `%${search}%`)
    }
    if (type && type !== 'all') {
      conditions.push('f.facility_type = ?')
      params.push(type)
    }
    if (status && status !== 'all') {
      conditions.push('f.facility_status = ?')
      params.push(status)
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    // Smart sorting: if searching, rank items that START with the term higher than those that just CONTAIN it
    let orderClause = 'ORDER BY f.facility_name'
    if (search) {
      orderClause = 'ORDER BY CASE WHEN LOWER(f.facility_name) LIKE LOWER(?) THEN 1 ELSE 2 END, f.facility_name'
      params.push(`${search}%`) // This parameter matches the ? in orderClause
    }

    let rows

    if (user) {
      // If logged in, also check if each facility is favourited by this user
      const [results] = await pool.query(
        `SELECT f.*,
          CASE WHEN fav.favourite_id IS NOT NULL THEN 1 ELSE 0 END AS is_favourited
         FROM facilities f
         LEFT JOIN favourites fav ON fav.facility_id = f.facility_id AND fav.user_id = ?
         ${whereClause}
         ${orderClause}`,
        [user.user_id, ...params]
      )
      rows = results
    } else {
      // Not logged in — return facilities with is_favourited = false
      const [results] = await pool.query(
        `SELECT f.*, 0 AS is_favourited
         FROM facilities f
         ${whereClause}
         ${orderClause}`,
        params
      )
      rows = results
    }

    return res.status(200).json({ success: true, data: rows })
  } catch (err) {
    console.error('GET /api/facilities error:', err)
    return res.status(500).json({ success: false, error: 'Failed to fetch facilities.' })
  }
}
