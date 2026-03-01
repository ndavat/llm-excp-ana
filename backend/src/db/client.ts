import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create pool only when env is configured; otherwise, export a placeholder to be mocked in tests
let pool: mysql.Pool | null = null;
if (process.env.DATABASE_URL) {
  pool = mysql.createPool(process.env.DATABASE_URL as string);
}

export const db = pool ? drizzle(pool) : ({} as any);
