# Scripts — Vulcan’s Mind

Expected scripts: `validate-sources.ts`, `ingest.ts`, `reindex.ts`.

Scripts are maintainer-only and must not be exposed as public HTTP endpoints in P0.

`validate-sources`: validate topics, sources, required fields, duplicates, statuses, source counts, copyright status.

`ingest`: read approved sources/notes, extract text, chunk, embed, upsert sources/chunks, record ingestion runs.

`reindex`: rebuild chunks/embeddings when embedding model, chunking, sources, or schema changes.

Never print secrets. Avoid logging full raw documents. Do not store chat transcripts.
