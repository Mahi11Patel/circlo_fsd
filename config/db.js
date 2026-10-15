/**
 * Circlo – config/db.js
 * MySQL Database Connection Pool
 * Reference: Practical-8 (Node.js + MySQL)
 *
 * We use createPool() instead of createConnection() so that multiple
 * concurrent requests can each get a connection from the pool, which
 * is safer than sharing a single connection across async callbacks.
 * The query syntax is exactly the same: pool.query(sql, [params], callback)
 *
 * EXTENSION (not from practicals): createPool() - Practical-8 used
 * createConnection() for a single sequential script. In an Express server
 * handling multiple simultaneous requests, a pool prevents "already in
 * use" errors on a shared single connection.
 */

const mysql = require('mysql');

// Load .env variables (PORT, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)
require('dotenv').config();

// Create a connection pool using credentials from .env
const pool = mysql.createPool({
  host:              process.env.DB_HOST     || 'localhost',
  user:              process.env.DB_USER     || 'root',
  password:          process.env.DB_PASSWORD || '',
  database:          process.env.DB_NAME     || 'circlo_db',
  connectionLimit:   10,        // maximum connections in the pool
  waitForConnections: true,     // queue requests if pool is full
  queueLimit:        0          // unlimited queue size
});

// Test the connection on startup - following Practical-8 connect pattern
pool.getConnection(function(err, connection) {
  if (err) {
    console.error('[DB] MySQL connection failed:', err.message);
    console.error('[DB] Make sure XAMPP MySQL is running and .env is configured.');
    process.exit(1);            // stop the server if DB is unreachable
  }
  console.log('[DB] MySQL connected successfully via pool. Thread ID:', connection.threadId);
  connection.release();         // return connection back to pool
});

module.exports = pool;
