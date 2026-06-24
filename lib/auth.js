// Authentication helper — use this in every API route that needs a logged-in user
// Usage:  const user = await getUser(req)
//         if (!user) return res.status(401).json({ success: false, error: 'Not logged in.' })

import { jwtVerify } from 'jose'

export async function getUser(req) {
  const token = req.cookies?.token
  if (!token) return null

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.AUTH_SECRET)
    )
    return payload // { user_id, user_role, user_name, user_email, ... }
  } catch {
    return null
  }
}
