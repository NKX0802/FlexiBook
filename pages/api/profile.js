import { pool } from "@/lib/db";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";

export default async function handler(req, res) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ success: false, error: "Not logged in." });
  }

  let payload;
  try {
    const verified = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.AUTH_SECRET),
    );
    payload = verified.payload;
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, error: "Invalid or expired session." });
  }

  if (req.method === "GET") {
    try {
      const [users] = await pool.query(
        "SELECT user_name, user_email, user_role FROM users WHERE user_id = ?",
        [payload.user_id],
      );

      if (users.length === 0) {
        return res
          .status(404)
          .json({ success: false, error: "User not found." });
      }

      return res.status(200).json({ success: true, data: users[0] });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ success: false, error: "Something went wrong." });
    }
  }

  if (req.method === "PUT") {
    try {
      const { name, password } = req.body;

      if (!name) {
        return res
          .status(400)
          .json({ success: false, error: "Name is required." });
      }

      if (password) {
        if (password.length < 8) {
          return res
            .status(400)
            .json({
              success: false,
              error: "Password must be at least 8 characters.",
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
          "UPDATE users SET user_name = ?, user_password = ? WHERE user_id = ?",
          [name, hashedPassword, payload.user_id],
        );
      } else {
        await pool.query("UPDATE users SET user_name = ? WHERE user_id = ?", [
          name,
          payload.user_id,
        ]);
      }

      return res
        .status(200)
        .json({
          success: true,
          data: { message: "Profile updated successfully." },
        });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ success: false, error: "Something went wrong." });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
