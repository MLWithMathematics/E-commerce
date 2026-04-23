import dns from 'dns';
import pkg from 'pg';

// 👇 FIX: Force Node.js to use IPv4 to prevent ECONNRESET
dns.setDefaultResultOrder('ipv4first');

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, 
  connectionTimeoutMillis: 10000, // Fails gracefully after 10s instead of hanging
});

// Test the connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Successfully connected to the database');
    release();
  }
});

export default pool;