// db.js - Database connection pool using mysql2 for async operations
const mysql = require('mysql2/promise');  // Promise-based MySQL driver for cleaner async/await code

// Create a connection pool (efficient for multiple queries, reuses connections)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',  // DB server address
  user: process.env.DB_USER || 'root',       // DB username
  password: process.env.DB_PASS || '',       // DB password (from .env)
  database: process.env.DB_NAME || 'fintracker',  // Our database name
  waitForConnections: true,    // Wait if no connections available
  connectionLimit: 10,         // Max connections in pool
  queueLimit: 0               // No queue limit
});

// Test the connection on startup (logs to console)
pool.getConnection()
  .then(() => console.log('✅ MySQL connected successfully'))
  .catch(err => console.error('❌ DB connection error:', err));

// Export the pool for use in models
module.exports = pool;