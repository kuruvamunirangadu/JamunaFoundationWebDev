// Run this to initialize tables in PostgreSQL
import pool from './db.js';
import { createTablesSQL } from './models.js';

async function initDB() {
  try {
    await pool.query(createTablesSQL);
    console.log('Tables created/verified successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
  }
}

initDB();
