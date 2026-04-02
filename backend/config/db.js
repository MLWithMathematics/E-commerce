import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

});

// ── ADD THIS: Test the connection on startup ──
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Successfully connected to the database');
    release();
  }
});
export default pool;
