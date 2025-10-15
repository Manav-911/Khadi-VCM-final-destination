const client = require("./new_db.js");

async function resetDatabase() {
  try {
    await client.connect();
    console.log("Connected ✅");

    // 1️⃣ Drop the old CHECK constraint
    await client.query(`
      ALTER TABLE meetings
      DROP CONSTRAINT IF EXISTS meetings_status_check;
    `);
    console.log("Old CHECK constraint dropped ✅");

    // 2️⃣ Add a new CHECK constraint including 'completed'
    await client.query(`
      ALTER TABLE meetings
      ADD CONSTRAINT meetings_status_check
      CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed'));
    `);
    console.log("New CHECK constraint added with 'completed' ✅");
  } catch (err) {
    console.error("Error resetting DB:", err);
  } finally {
    await client.end();
    console.log("Disconnected ❌");
  }
}

resetDatabase();
