-- Vulcan's Mind — initial schema
-- Reference: docs/13_DATABASE_SCHEMA.md
-- Hard rule: no transcript tables / fields. See AGENTS.md.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- sources: curated, approved KB entries (35–50 in P0)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sources (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title              TEXT NOT NULL,
  authors            TEXT,
  year               INTEGER,
  topic              TEXT NOT NULL,
  source_type        TEXT NOT NULL,
  url                TEXT,
  doi                TEXT,
  abstract           TEXT,
  publisher          TEXT,
  language           TEXT NOT NULL DEFAULT 'en',
  status             TEXT NOT NULL DEFAULT 'approved',
  relevance_score    NUMERIC(3, 2),
  quality_notes      TEXT,
  copyright_status   TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sources_status_chk CHECK (status IN ('approved', 'rejected', 'deferred')),
  CONSTRAINT sources_year_chk CHECK (year IS NULL OR (year BETWEEN 1900 AND 2100))
);

CREATE INDEX IF NOT EXISTS sources_topic_idx       ON sources (topic);
CREATE INDEX IF NOT EXISTS sources_status_idx      ON sources (status);
CREATE UNIQUE INDEX IF NOT EXISTS sources_doi_uniq ON sources (doi) WHERE doi IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS sources_url_uniq ON sources (url) WHERE url IS NOT NULL;

-- ============================================================================
-- source_documents: raw text artifacts associated with a source
-- ============================================================================
CREATE TABLE IF NOT EXISTS source_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  document_kind   TEXT NOT NULL,
  document_path   TEXT,
  content_hash    TEXT NOT NULL,
  char_count      INTEGER NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS source_documents_source_idx ON source_documents (source_id);
CREATE UNIQUE INDEX IF NOT EXISTS source_documents_hash_uniq
  ON source_documents (source_id, content_hash);

-- ============================================================================
-- chunks: text chunks + pgvector embeddings (1536-d for text-embedding-3-small)
-- ============================================================================
CREATE TABLE IF NOT EXISTS chunks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id           UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  source_document_id  UUID REFERENCES source_documents(id) ON DELETE CASCADE,
  chunk_index         INTEGER NOT NULL,
  content             TEXT NOT NULL,
  content_hash        TEXT NOT NULL,
  token_count         INTEGER,
  embedding           vector(1536),
  embedding_model     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chunks_source_idx ON chunks (source_id);
CREATE UNIQUE INDEX IF NOT EXISTS chunks_doc_index_uniq
  ON chunks (source_document_id, chunk_index)
  WHERE source_document_id IS NOT NULL;

-- IVFFlat index for cosine similarity search.
-- Use after sufficient rows exist; safe to create now (empty list scan).
CREATE INDEX IF NOT EXISTS chunks_embedding_cos_idx
  ON chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================================
-- ingestion_runs: one row per `npm run ingest` execution
-- ============================================================================
CREATE TABLE IF NOT EXISTS ingestion_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at       TIMESTAMPTZ,
  status            TEXT NOT NULL DEFAULT 'running',
  embedding_model   TEXT,
  sources_total     INTEGER NOT NULL DEFAULT 0,
  sources_ingested  INTEGER NOT NULL DEFAULT 0,
  sources_skipped   INTEGER NOT NULL DEFAULT 0,
  sources_failed    INTEGER NOT NULL DEFAULT 0,
  chunks_created    INTEGER NOT NULL DEFAULT 0,
  notes             TEXT,
  CONSTRAINT ingestion_runs_status_chk CHECK (status IN ('running', 'success', 'failed'))
);

-- ============================================================================
-- ingestion_run_items: per-source results within an ingestion run
-- ============================================================================
CREATE TABLE IF NOT EXISTS ingestion_run_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id            UUID NOT NULL REFERENCES ingestion_runs(id) ON DELETE CASCADE,
  source_id         UUID REFERENCES sources(id) ON DELETE SET NULL,
  source_external   TEXT,
  outcome           TEXT NOT NULL,
  chunks_created    INTEGER NOT NULL DEFAULT 0,
  error_code        TEXT,
  duration_ms       INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ingestion_run_items_outcome_chk
    CHECK (outcome IN ('ingested', 'updated', 'skipped', 'failed'))
);

CREATE INDEX IF NOT EXISTS ingestion_run_items_run_idx ON ingestion_run_items (run_id);

-- ============================================================================
-- request_metrics: anonymous operational metrics — NEVER full prompt/answer text
-- ============================================================================
CREATE TABLE IF NOT EXISTS request_metrics (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id            TEXT NOT NULL UNIQUE,
  session_id_hash       TEXT,
  topic                 TEXT,
  response_language     TEXT,
  model_used            TEXT,
  fallback_used         BOOLEAN NOT NULL DEFAULT FALSE,
  retrieval_count       INTEGER NOT NULL DEFAULT 0,
  retrieved_source_ids  JSONB NOT NULL DEFAULT '[]'::jsonb,
  input_length_chars    INTEGER,
  output_length_chars   INTEGER,
  input_tokens          INTEGER,
  output_tokens         INTEGER,
  latency_ms            INTEGER,
  status                TEXT,
  error_code            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS request_metrics_created_idx ON request_metrics (created_at DESC);
CREATE INDEX IF NOT EXISTS request_metrics_topic_idx   ON request_metrics (topic);

-- ============================================================================
-- updated_at touch trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sources_set_updated_at ON sources;
CREATE TRIGGER sources_set_updated_at BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS chunks_set_updated_at ON chunks;
CREATE TRIGGER chunks_set_updated_at BEFORE UPDATE ON chunks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
