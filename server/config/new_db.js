const { Client } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const client = new Client({
  host: process.env.host,
  port: process.env.port,
  user: process.env.user,
  password: process.env.password,
  database: process.env.database,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = client;
