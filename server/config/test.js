const client = require("./new_db.js");
const express = require("express");
const axios = require("axios");
const pool = require("./new_db.js");
const app = express();

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
