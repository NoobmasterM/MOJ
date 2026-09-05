import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)) });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set in server/.env');
}

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const query = (text, values = []) => pool.query(text, values);
