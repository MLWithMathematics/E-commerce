import dns from 'dns';
import pkg from 'pg';
import * as dotenv from 'dotenv';

// Ensure env variables are loaded here just in case
dotenv.config();

dns.setDefaultResultOrder('ipv4first');

const { Pool } = pkg;

// Check if the URL contains 'neon.tech' to automatically apply SSL
const isNeonDb = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech');

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
};

// Only add the SSL object if we are connecting to Neon or are in production
if (isNeonDb || process.env.NODE_ENV === 'production') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Successfully connected to the database');
    release();
  }
});

export default pool;