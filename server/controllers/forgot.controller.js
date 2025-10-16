const pool = require("../config/new_db.js");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const crypto = require("crypto");

dotenv.config();

// --- Configuration (Adjust as necessary) ---
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const TOKEN_EXPIRY_MINUTES = 60; 

// Helper function to mock email sending
const sendResetEmail = (email, resetLink) => {
  console.log(`\n--- MOCK EMAIL SENT ---`);
  console.log(`To: ${email}`);
  console.log(`Subject: Password Reset Request`);
  console.log(`Link: ${resetLink}`);
  console.log(`-------------------------\n`);
  // NOTE: If your actual email logic is here and it fails (e.g., connection issue), 
  // it WILL cause the 500 error.
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  const defaultSuccessResponse = {
    success: true,
    message: "If an account with that email exists, a password reset link has been sent.",
  };

  if (!email || email.trim() === "") {
    return res.status(200).json(defaultSuccessResponse);
  }

  try {
    let userId = null;
    let role = null;
    
    // 1. Combined User/Admin Lookup
    const userCheckQuery = `
      SELECT id, 'user' AS role FROM users WHERE email = $1
      UNION ALL
      SELECT id, 'admin' AS role FROM admin WHERE email = $1
    `.trim();
    
    // TEMPORARY DEBUGGING LOG: Print the SQL query string
    // console.log("Executing User Check Query:", userCheckQuery);
    
    const result = await pool.query(userCheckQuery, [email]);
    
    if (result.rows.length > 0) {
      userId = result.rows[0].id;
      role = result.rows[0].role;
    } else {
      // User not found, return safe message
      return res.status(200).json(defaultSuccessResponse);
    }

    // 2. Create token and expiry
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60000); 

    // 3. Insert/Update token
    const resetQuery = `
      INSERT INTO password_resets (user_id, user_role, token, expires_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, user_role) DO UPDATE
      SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at, created_at = NOW()
      RETURNING token;
    `.trim();
    
    // TEMPORARY DEBUGGING LOG: Print the SQL query string
    // console.log("Executing Reset Query:", resetQuery);
    
    await pool.query(resetQuery, [userId, role, token, expiresAt]);

    // 4. Send email (Wrap in try/catch to isolate errors)
    try {
        const resetLink = `${FRONTEND_URL}/reset-password/${token}`;
        sendResetEmail(email, resetLink);
    } catch (emailError) {
        // Log email error, but still return success message for security
        console.error("Critical: Email sending failed:", emailError);
        // You might consider logging this event to a file/service instead of throwing 500
    }
    
    // 5. Success (return default success message)
    return res.status(200).json(defaultSuccessResponse);

  } catch (error) {
    console.error("Error in forgotPassword:", error);
    
    // If the error is still a database constraint violation (Code 23505), 
    // the server returns 500, but the fix is in the database schema.
    if (error.code === '23505') {
        console.error("ACTION REQUIRED: Missing UNIQUE constraint on password_resets(user_id, user_role).");
    }
    
    return res.status(500).json({ 
      success: false, 
      message: "Server error during password reset request" 
    });
  }
};  


/**
 * Handles the actual password update using the unique token.
 *  * FIXES:
 * 1. Uses the password length validation from your user.controller (min 8 chars).
 */
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: "Token and new password are required." });
  }

  // Ensure minimum password length matches frontend validation (from user.controller)
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
  }

  try {
    // 1. Find the active, non-expired token
    const tokenResult = await pool.query(
      `SELECT user_id, user_role FROM password_resets 
       WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset link." });
    }

    const { user_id, user_role } = tokenResult.rows[0];
    // Safety check to prevent SQL injection if tableName was from user input, 
    // but here it's safe as it's derived from the trusted DB result.
    const tableName = user_role === 'admin' ? 'admin' : 'users';

    // 2. Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Update the user's password in the respective table
    const updateQuery = `
      UPDATE ${tableName} 
      SET password = $1 
      WHERE id = $2 
      RETURNING id;
    `;
    const updateResult = await pool.query(updateQuery, [hashedPassword, user_id]);

    if (updateResult.rowCount === 0) {
      // This should ideally never happen if the token lookup worked
      throw new Error(`Password update failed for ${user_role} ID: ${user_id}`);
    }

    // 4. Invalidate (delete) the used token
    await pool.query("DELETE FROM password_resets WHERE token = $1", [token]);

    return res.status(200).json({ success: true, message: "Password updated successfully!" });

  } catch (error) {
    console.error("Error in resetPassword:", error);
    return res.status(500).json({ success: false, message: "A server error occurred during password reset." });
  }
};

module.exports = { forgotPassword, resetPassword };