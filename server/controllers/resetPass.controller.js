const crypto = require("crypto");
const bcrypt = require("bcrypt");
const pool = require("../config/new_db.js");
const nodemailer = require("nodemailer");

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Check if user exists
    const result = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2. Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(token, 10);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // 3. Save token in DB
    await pool.query(
      "INSERT INTO password_resets(user_id, token, expires_at) VALUES($1, $2, $3)",
      [user.id, hashedToken, expires]
    );

    // 4. Generate reset link
    const resetLink = `http://localhost:5173/reset-password?token=${token}&id=${user.id}`;
    console.log("Reset link:", resetLink);

    // 5. Send email
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "zap14479@gmail.com",
        pass: "rbkq vxxq xgub bpdj", // Gmail App Password
      },
    });

    await transporter.sendMail({
      from: "zap14479@gmail.com", // server email
      to: email,                  // dynamic recipient
      subject: "Password Reset",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>
             <p>This link will expire in 1 hour.</p>`,
    });

    res.json({ message: "Password reset link sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


const resetPassword = async (req, res) => {
  const { userId, token, newPassword } = req.body;

  // 1. Get token from DB
  const result = await pool.query(
    "SELECT * FROM password_resets WHERE user_id=$1 AND used=false ORDER BY expires_at DESC",
    [userId]
  );
  const record = result.rows[0];
  if (!record) return res.status(400).json({ message: "Invalid or expired token" });

  // 2. Check expiry
  if (new Date() > record.expires_at) return res.status(400).json({ message: "Token expired" });

  // 3. Compare token
  const isValid = await bcrypt.compare(token, record.token);
  if (!isValid) return res.status(400).json({ message: "Invalid token" });

  // 4. Hash new password and update
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await pool.query("UPDATE users SET password=$1 WHERE id=$2", [hashedPassword, userId]);

  // 5. Mark token as used
  await pool.query("UPDATE password_resets SET used=true WHERE id=$1", [record.id]);

  res.json({ message: "Password successfully reset" });
};

module.exports = {
  requestPasswordReset,
  resetPassword,
};