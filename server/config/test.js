const client = require("./new_db.js");

async function resetDatabase() {
  try {
    await client.connect();
    console.log("Connected ✅");
    const rows = await client.query(`Select * from users;`);
    console.log("zone ", rows.rows);
  } catch (err) {
    console.error("Error resetting DB:", err);
  } finally {
    await client.end();
  }
}

resetDatabase();
