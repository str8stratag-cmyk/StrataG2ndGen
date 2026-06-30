import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

let pool = null;

export async function initializeDatabase() {
  if (pool) return pool;
  
  const connectionString = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL or PG_CONNECTION_STRING environment variable is required');
  }
  
  pool = new Pool({
    connectionString,
    ssl: connectionString.includes('railway') || connectionString.includes('neon.tech') 
      ? { rejectUnauthorized: false } 
      : false
  });
  
  pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
  });
  
  // Test connection
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
  } finally {
    client.release();
  }
  
  return pool;
}

export function getPool() {
  if (!pool) throw new Error('Database not initialized. Call initializeDatabase() first.');
  return pool;
}

export async function query(text, params) {
  const db = await initializeDatabase();
  return db.query(text, params);
}

export default { initializeDatabase, getPool, query };
