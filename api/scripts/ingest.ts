import "dotenv/config";
import { readFile, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { loadConfig, type AppConfig } from "../src/config.js";
import { SourcesFileSchema, type Source } from "../src/kb/schema.js";
import { chunkText, type Chunk } from "../src/rag/chunk.js";
import {
  OpenAIEmbedder,
  toPgVector,
  type Embedder,
  EMBEDDING_DIMENSION,
} from "../src/rag/embed.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KB_DIR = resolve(__dirname, "../../knowledge");
const NOTES_DIR = resolve(KB_DIR, "notes");

type IngestArgs = {
  onlyId?: string;
  dryRun: boolean;
};

function parseArgs(argv: string[]): IngestArgs {
  const args: IngestArgs = { dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--id" && argv[i + 1]) {
      args.onlyId = argv[i + 1];
      i += 1;
    } else if (a === "--dry-run") {
      args.dryRun = true;
    }
  }
  return args;
}

async function loadApprovedSources(onlyId?: string): Promise<Source[]> {
  const path = resolve(KB_DIR, "sources.seed.json");
  const raw = await readFile(path, "utf8");
  const all = SourcesFileSchema.parse(JSON.parse(raw));
  const approved = all.filter((s) => s.status === "approved");
  return onlyId ? approved.filter((s) => s.id === onlyId) : approved;
}

async function readDocumentText(source: Source): Promise<string> {
  if (source.sourceType === "project_note") {
    const path = resolve(NOTES_DIR, source.topic, `${source.id}.md`);
    try {
      await access(path);
    } catch {
      throw new Error(`project_note file not found at expected path: ${path}`);
    }
    return readFile(path, "utf8");
  }
  // For non-project_note sources we ingest abstract or summary metadata only.
  // Full text ingestion of external sources is governed by docs/07 copyright rules.
  const text = source.abstract ?? source.summary;
  if (!text || text.length === 0) {
    throw new Error(`source ${source.id}: no abstract/summary text to ingest`);
  }
  return text;
}

async function startRun(
  client: pg.PoolClient,
  embedder: Embedder,
  total: number,
): Promise<string> {
  const res = await client.query<{ id: string }>(
    `INSERT INTO ingestion_runs (embedding_model, sources_total, status)
     VALUES ($1, $2, 'running')
     RETURNING id`,
    [embedder.model, total],
  );
  return res.rows[0]!.id;
}

async function finishRun(
  client: pg.PoolClient,
  runId: string,
  status: "success" | "failed",
  counters: { ingested: number; skipped: number; failed: number; chunks: number },
  notes?: string,
): Promise<void> {
  await client.query(
    `UPDATE ingestion_runs
        SET finished_at = now(),
            status = $2,
            sources_ingested = $3,
            sources_skipped  = $4,
            sources_failed   = $5,
            chunks_created   = $6,
            notes            = $7
      WHERE id = $1`,
    [runId, status, counters.ingested, counters.skipped, counters.failed, counters.chunks, notes ?? null],
  );
}

async function recordItem(
  client: pg.PoolClient,
  runId: string,
  sourceId: string | null,
  externalId: string,
  outcome: "ingested" | "updated" | "skipped" | "failed",
  chunksCreated: number,
  durationMs: number,
  errorCode?: string,
): Promise<void> {
  await client.query(
    `INSERT INTO ingestion_run_items
       (run_id, source_id, source_external, outcome, chunks_created, duration_ms, error_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [runId, sourceId, externalId, outcome, chunksCreated, durationMs, errorCode ?? null],
  );
}

async function upsertSource(client: pg.PoolClient, s: Source): Promise<string> {
  const res = await client.query<{ id: string }>(
    `INSERT INTO sources
       (external_id, title, authors, year, topic, source_type, url, doi, abstract,
        publisher, language, status, relevance_score, quality_notes, copyright_status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     ON CONFLICT (external_id) DO UPDATE SET
       title            = EXCLUDED.title,
       authors          = EXCLUDED.authors,
       year             = EXCLUDED.year,
       topic            = EXCLUDED.topic,
       source_type      = EXCLUDED.source_type,
       url              = EXCLUDED.url,
       doi              = EXCLUDED.doi,
       abstract         = EXCLUDED.abstract,
       publisher        = EXCLUDED.publisher,
       language         = EXCLUDED.language,
       status           = EXCLUDED.status,
       relevance_score  = EXCLUDED.relevance_score,
       quality_notes    = EXCLUDED.quality_notes,
       copyright_status = EXCLUDED.copyright_status
     RETURNING id`,
    [
      s.id,
      s.title,
      s.authors ?? null,
      s.year ?? null,
      s.topic,
      s.sourceType,
      s.url ?? null,
      s.doi ?? null,
      s.abstract ?? s.summary ?? null,
      s.publisher ?? null,
      s.language,
      s.status,
      s.relevanceScore ?? null,
      s.qualityNotes ?? null,
      s.copyrightStatus,
    ],
  );
  return res.rows[0]!.id;
}

async function upsertSourceDocument(
  client: pg.PoolClient,
  sourceDbId: string,
  documentKind: string,
  documentPath: string | null,
  contentHash: string,
  charCount: number,
): Promise<string> {
  const res = await client.query<{ id: string }>(
    `INSERT INTO source_documents (source_id, document_kind, document_path, content_hash, char_count)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (source_id, content_hash) DO UPDATE SET
       document_kind = EXCLUDED.document_kind,
       document_path = EXCLUDED.document_path,
       char_count    = EXCLUDED.char_count
     RETURNING id`,
    [sourceDbId, documentKind, documentPath, contentHash, charCount],
  );
  return res.rows[0]!.id;
}

async function replaceChunks(
  client: pg.PoolClient,
  sourceDbId: string,
  documentDbId: string,
  chunks: Chunk[],
  embeddings: number[][],
  embeddingModel: string,
): Promise<void> {
  await client.query("DELETE FROM chunks WHERE source_document_id = $1", [documentDbId]);
  for (let i = 0; i < chunks.length; i += 1) {
    const c = chunks[i]!;
    const e = embeddings[i]!;
    await client.query(
      `INSERT INTO chunks
         (source_id, source_document_id, chunk_index, content, content_hash,
          token_count, embedding, embedding_model)
       VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8)`,
      [
        sourceDbId,
        documentDbId,
        c.index,
        c.content,
        c.contentHash,
        Math.ceil(c.content.length / 4),
        toPgVector(e),
        embeddingModel,
      ],
    );
  }
}

async function ingestOne(
  client: pg.PoolClient,
  embedder: Embedder,
  source: Source,
): Promise<{ chunksCreated: number }> {
  const text = await readDocumentText(source);
  const chunks = chunkText(text);
  if (chunks.length === 0) {
    throw new Error(`source ${source.id}: chunker produced 0 chunks`);
  }

  const embeddings: number[][] = [];
  for (const c of chunks) {
    const r = await embedder.embed(c.content);
    if (r.embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(`embedding dim mismatch for chunk ${c.index} of ${source.id}`);
    }
    embeddings.push(r.embedding);
  }

  await client.query("BEGIN");
  try {
    const sourceDbId = await upsertSource(client, source);
    const documentKind = source.sourceType === "project_note" ? "project_note_md" : "abstract";
    const documentPath =
      source.sourceType === "project_note"
        ? `notes/${source.topic}/${source.id}.md`
        : null;
    const contentHash = chunks.map((c) => c.contentHash).join("|").slice(0, 64);
    const documentDbId = await upsertSourceDocument(
      client,
      sourceDbId,
      documentKind,
      documentPath,
      contentHash,
      text.length,
    );
    await replaceChunks(client, sourceDbId, documentDbId, chunks, embeddings, embedder.model);
    await client.query("COMMIT");
    return { chunksCreated: chunks.length };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
}

export async function runIngest(
  args: IngestArgs,
  config: AppConfig,
  embedderOverride?: Embedder,
): Promise<void> {
  if (!config.databaseUrl) throw new Error("DATABASE_URL is required");
  const sources = await loadApprovedSources(args.onlyId);
  console.warn(`[ingest] approved sources to ingest: ${sources.length}`);
  if (sources.length === 0) {
    console.warn("[ingest] nothing to do");
    return;
  }

  if (args.dryRun) {
    for (const s of sources) {
      const text = await readDocumentText(s);
      const chunks = chunkText(text);
      console.warn(`[dry-run] ${s.id}: ${chunks.length} chunks (${text.length} chars)`);
    }
    return;
  }

  const embedder = embedderOverride ?? new OpenAIEmbedder(config);
  const pool = new pg.Pool({ connectionString: config.databaseUrl });
  const client = await pool.connect();
  let runId: string | undefined;
  const counters = { ingested: 0, skipped: 0, failed: 0, chunks: 0 };

  try {
    runId = await startRun(client, embedder, sources.length);
    for (const s of sources) {
      const t0 = Date.now();
      try {
        const { chunksCreated } = await ingestOne(client, embedder, s);
        counters.ingested += 1;
        counters.chunks += chunksCreated;
        await recordItem(client, runId, null, s.id, "ingested", chunksCreated, Date.now() - t0);
        console.warn(`[ingest] ok ${s.id} (${chunksCreated} chunks)`);
      } catch (err) {
        counters.failed += 1;
        const msg = err instanceof Error ? err.message : String(err);
        await recordItem(client, runId, null, s.id, "failed", 0, Date.now() - t0, msg.slice(0, 200));
        console.error(`[ingest] FAIL ${s.id}: ${msg}`);
      }
    }
    await finishRun(client, runId, counters.failed === 0 ? "success" : "failed", counters);
    console.warn(
      `[ingest] done: ingested=${counters.ingested} failed=${counters.failed} chunks=${counters.chunks}`,
    );
  } finally {
    client.release();
    await pool.end();
  }

  if (counters.failed > 0) process.exit(1);
}

const isDirectInvocation = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectInvocation) {
  const args = parseArgs(process.argv.slice(2));
  const config = loadConfig();
  runIngest(args, config).catch((err) => {
    console.error("[ingest] fatal:", err instanceof Error ? err.message : err);
    process.exit(2);
  });
}
