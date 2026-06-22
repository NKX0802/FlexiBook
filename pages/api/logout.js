// POST /api/logout — clears the auth cookie.
export default function handler(req, res) {
  res.setHeader('Set-Cookie', 'auth_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax')
  return res.status(200).json({ success: true })
}
