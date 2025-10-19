const pool = require("./new_db.js");

//to get all tables
const listAllTables = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name`);

    console.log("\n📚 All Tables:");
    console.log("=".repeat(30));
    result.rows.forEach((table) => {
      console.log(`   ${table.table_name}`);
    });

    return result.rows;
  } catch (error) {
    console.error("Error listing tables:", error);
  } finally {
    client.release();
  }
};

//To get complete table structure
const getCompleteTableInfo = async (tableName) => {
  const client = await pool.connect();
  try {
    // Get columns
    const columnsResult = await client.query(
      `
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position`,
      [tableName]
    );

    // Get constraints
    const constraintsResult = await client.query(
      `
      SELECT 
        constraint_name,
        constraint_type
      FROM information_schema.table_constraints 
      WHERE table_name = $1`,
      [tableName]
    );

    console.log(`\n📋 Complete Structure of: ${tableName}`);
    console.log("=".repeat(60));

    console.log("\n📝 COLUMNS:");
    columnsResult.rows.forEach((col) => {
      console.log(
        `   ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${
          col.is_nullable === "YES" ? "NULL" : "NOT NULL"
        } ${col.column_default ? `DEFAULT ${col.column_default}` : ""}`
      );
    });

    console.log("\n🔗 CONSTRAINTS:");
    if (constraintsResult.rows.length > 0) {
      constraintsResult.rows.forEach((constraint) => {
        console.log(
          `   ${constraint.constraint_name}: ${constraint.constraint_type}`
        );
      });
    } else {
      console.log("   No constraints found");
    }

    return {
      columns: columnsResult.rows,
      constraints: constraintsResult.rows,
    };
  } catch (error) {
    console.error("Error getting table info:", error);
  } finally {
    client.release();
  }
};

// Usage
getCompleteTableInfo("meeting_recording_requests");
//listAllTables();
