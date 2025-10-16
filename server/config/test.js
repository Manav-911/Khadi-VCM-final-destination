const client = require("./new_db.js");

async function resetDatabase() {
  try {
    await client.connect();
    console.log("Connected ✅");

    // 1️⃣ Drop the old CHECK constraint
    const res = await client.query(`Delete from meetings;`);

    console.log("Meetings deleted:", res.rowCount);
  } catch (err) {
    console.error("Error resetting DB:", err);
  } finally {
    await client.end();
    console.log("Disconnected ❌");
  }
}

resetDatabase();
