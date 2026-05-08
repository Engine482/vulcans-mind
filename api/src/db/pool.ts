import pg from "pg";
import type { AppConfig } from "../config.js";

let pool: pg.Pool | undefined;

export function getPool(config: AppConfig): pg.Pool {
  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }
  if (!pool) {
    pool = new pg.Pool({
      connectionString: config.databaseUrl,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
