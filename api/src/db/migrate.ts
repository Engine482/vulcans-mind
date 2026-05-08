import "dotenv/config";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { loadConfig } from "../config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(__dirname, "../../migrations");

async function ensureMigrationsTable(client: pg.PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function appliedSet(client: pg.PoolClient): Promise<Set<string>> {
  const res = await client.query<{ id: string }>("SELECT id FROM schema_migrations");
  return new Set(res.rows.map((r) => r.id));
}

async function listMigrationFiles(): Promise<string[]> {
  const files = await readdir(MIGRATIONS_DIR);
  return files.filter((f) => f.endsWith(".sql")).sort();
}

export async function runMigrations(): Promise<void> {
  const config = loadConfig();
  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }
  const pool = new pg.Pool({ connectionString: config.databaseUrl });
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const applied = await appliedSet(client);
    const files = await listMigrationFiles();

    let appliedCount = 0;
    for (const file of files) {
      const id = file.replace(/\.sql$/, "");
      if (applied.has(id)) {
        console.warn(`[migrate] skip ${id} (already applied)`);
        continue;
      }
      const sql = await readFile(join(MIGRATIONS_DIR, file), "utf8");
      console.warn(`[migrate] applying ${id}…`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", [id]);
        await client.query("COMMIT");
        appliedCount += 1;
        console.warn(`[migrate] ok ${id}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }
    console.warn(`[migrate] done. applied=${appliedCount} total=${files.length}`);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error("[migrate] failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
