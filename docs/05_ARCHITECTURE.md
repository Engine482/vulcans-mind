# Vulcan’s Mind — Architecture

## High-level architecture

```text
Static site → chat-widget.js/css → Railway API → PostgreSQL/pgvector + OpenAI API
```

Components:

1. Static site layer: `motornyi.com`.
2. Chat widget frontend: launcher, panel, local state, API calls.
3. Backend API: validation, CORS, rate limit, topic/safety routing, RAG orchestration.
4. Knowledge/retrieval layer: PostgreSQL + pgvector, source/chunk/metrics tables.
5. Model layer: OpenAI main generation model, fallback model, embeddings.

## Runtime flow

User question → validate → rate limit → classify topic/safety → embed query → retrieve chunks → hydrate sources → select context → build prompt → call main model → fallback once if needed → return answer/sources/meta → write anonymous metrics.

## Ingestion flow

Source registry → read documents/notes → extract text → clean → chunk → embed → upsert sources/chunks → record ingestion run.

Ingestion is CLI/script only, not a public HTTP endpoint.

## Architectural decisions

- Static site + separate API.
- Own RAG on PostgreSQL + pgvector.
- Vanilla JS widget.
- No admin panel P0.
- No full transcript storage.
- No autonomous browsing.

## Repository target

`api/`, `public/`, `knowledge/`, `scripts/`, `docs/`.
