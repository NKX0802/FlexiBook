// API: GET /api/admin/facilities — return all facilities (open + closed)
// API: POST /api/admin/facilities — create a new facility
//   Body: { facility_name, facility_capacity, facility_type, facility_description, facility_image_url }
//   Inserts into "facilities" table with facility_status = "open"
// API: PUT /api/admin/facilities — update a facility (query: ?id=...)
// API: DELETE /api/admin/facilities — delete a facility (query: ?id=...)
// Admin only — return 403 if not admin

export default async function handler(req, res) {}
