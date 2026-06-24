import { pool } from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, error: "Email and password are required." });
  }

  try {
    const [users] = await pool.query(
      "SELECT user_id, user_name, user_email, user_password, user_role FROM users WHERE user_email = ?",
      [email],
    );

    if (users.length === 0) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password." });
    }

    const user = users[0];

    const passwordMatches = await bcrypt.compare(password, user.user_password);

    if (!passwordMatches) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password." });
    }

    const token = await new SignJWT({
      user_id: user.user_id,
      user_role: user.user_role,
      user_name: user.user_name,
      user_email: user.user_email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(process.env.AUTH_SECRET));

    res.setHeader(
      "Set-Cookie",
      `token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`,
    );

    return res.status(200).json({
      success: true,
      data: {
        user_name: user.user_name,
        user_email: user.user_email,
        user_role: user.user_role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  }
}
