-- Vulcan's Mind — add stable external_id for sources
--
-- Reason: KB sources are identified in JSON files by a slug-like `id`
-- (e.g. "vulcans_mind_project_note", "rag-foundational-2020"). We need a
-- stable upsert key that is independent of DOI/URL (project_notes have
-- neither). Without this, every ingestion run inserts duplicate sources.

ALTER TABLE sources ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Existing rows: derive from title slug to satisfy NOT NULL backfill.
UPDATE sources
   SET external_id = LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '_', 'g'))
 WHERE external_id IS NULL;

ALTER TABLE sources ALTER COLUMN external_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS sources_external_id_uniq ON sources (external_id);
