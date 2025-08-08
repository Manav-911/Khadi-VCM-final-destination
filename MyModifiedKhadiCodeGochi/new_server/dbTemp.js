const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'req_meet',
  password: 'harryPotter1317',
  port: 5433, // default PostgreSQL port
});

module.exports = pool;
// 