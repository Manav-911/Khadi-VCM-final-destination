const client = require("./new_db.js");
const express = require("express");
const axios = require("axios");
const pool = require("./new_db.js");
const app = express();
// const CLIENT_ID =
//   "Ce349eb7da038a7e57bf6f8b0665668e033f32f4822b23fe0268be298eba72597";
// const CLIENT_SECRET =
//   "c18568e5f0f746f2f8bceae735fc6330e5765bdc292e3f8628b45803b47e0659";
// const REDIRECT_URI = "http://localhost:5000/oauth/callback";

// // Example: Map this to a license record in DB
// const LICENSE_ID = 1;

// app.get("/oauth/callback", async (req, res) => {
//   const { code } = req.query;

//   if (!code) return res.status(400).send("No code provided in query");

//   console.log("Authorization code received:", code);

//   try {
//     // Exchange authorization code for tokens
//     const tokenRes = await axios.post(
//       "https://webexapis.com/v1/access_token",
//       new URLSearchParams({
//         grant_type: "authorization_code",
//         client_id: CLIENT_ID,
//         client_secret: CLIENT_SECRET,
//         code: code,
//         redirect_uri: REDIRECT_URI,
//       }),
//       { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
//     );

//     const { access_token, refresh_token, expires_in } = tokenRes.data;

//     console.log("Access Token:", access_token);
//     console.log("Refresh Token:", refresh_token);
//     console.log("Expires in (seconds):", expires_in);
//     const OFFICE_ID = 9; // Example office ID
//     const ACCOUNT_NAME = "admin@khadiwebex-4xnq.wbx.ai"; // Example account name

//     // Store refresh token and expiry in DB for the license
//     await pool.query(
//       `INSERT INTO licenses (office_id, account, client_id, client_secret, refresh_token, token_expiry)
//    VALUES ($1, $2, $3, $4, $5, NOW() + ($6 || ' seconds')::interval)`,
//       [
//         OFFICE_ID, // the office this license belongs to
//         ACCOUNT_NAME, // the account/email for this license
//         CLIENT_ID, // your Webex client_id
//         CLIENT_SECRET, // your Webex client_secret
//         refresh_token, // the refresh token received from Webex
//         expires_in, // token expiration in seconds
//       ]
//     );

//     res.send(
//       "Authorization successful! Tokens saved in DB. You can close this page."
//     );
//   } catch (err) {
//     console.error(
//       "Error exchanging code for tokens:",
//       err.response?.data || err.message
//     );
//     res.status(500).send("Token exchange failed");
//   }
// });

// app.listen(5000, () => {
//   console.log("OAuth callback server running at http://localhost:5000");
//   console.log("Open your Webex OAuth URL in a browser to authorize.");
// });
async function createMeetingAttendanceTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS meeting_attendance (
        id SERIAL PRIMARY KEY,
        meeting_id INTEGER UNIQUE REFERENCES meetings(id) ON DELETE CASCADE,
        webex_meeting_id VARCHAR(100),
        attendance_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_meeting_attendance_meeting 
      ON meeting_attendance(meeting_id);
    `);

    console.log("✅ Table created: meeting_attendance");
  } catch (error) {
    console.error("❌ Error creating table:", error);
  } finally {
    client.release();
  }
}

// Run the migration
createMeetingAttendanceTable();
