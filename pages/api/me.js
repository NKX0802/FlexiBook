import { jwtVerify } from "jose";
import { pool } from "@/lib/db";

export default async function handler(req, res) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ success: false, error: "Not logged in." });
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.AUTH_SECRET),
    );

    const [users] = await pool.query(
      "SELECT user_id, user_name, user_email, user_role FROM users WHERE user_id = ?",
      [payload.user_id],
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, error: "User not found." });
    }

    return res.status(200).json({ success: true, data: users[0] });
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, error: "Invalid or expired session." });
  }
}
