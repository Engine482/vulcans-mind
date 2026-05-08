# Knowledge Base — Vulcan’s Mind

This folder contains the curated KB config and source registry.

P0 target: 35–50 approved sources, maximum 60, minimum coverage across 8 main topics.

Do not commit restricted copyrighted PDFs, private docs, sensitive military information, personal medical data, or private chat logs. `knowledge/raw/*` is ignored except `.gitkeep`.

Expected files: `topics.yaml`, `sources.seed.json`, `sources.rejected.json`, `sources.deferred.json`, `notes/`, `raw/.gitkeep`.

Source schema: id, title, authors, year, topic, sourceType, url, doi, abstract/summary, publisher, language, status, relevanceScore, qualityNotes, copyrightStatus.

Required project notes: Vulcan’s Mind, Люстерко, Іменуй мене. They must be factual, modest, public/sanitized, and no exaggerated claims.

Expected commands: `npm run validate:sources`, `npm run ingest`, `npm run reindex`.
