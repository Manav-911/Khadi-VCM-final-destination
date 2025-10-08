const { Pool } = require("pg");

console.log("DB Config:", {
  host: "database-1.clmssiaqs3g0.ap-south-1.rds.amazonaws.com",
  port: 5432,
  user: "postgres",
  password: "*****", // hide password in logs
  database: "rohan_database",
});

const pool = new Pool({
  host: "database-1.clmssiaqs3g0.ap-south-1.rds.amazonaws.com",
  port: 5432,
  user: "postgres",
  password: "KhadiGroup",
  database: "rohan_database",
  ssl: { rejectUnauthorized: false }, // required for AWS RDS
});

module.exports = pool;
