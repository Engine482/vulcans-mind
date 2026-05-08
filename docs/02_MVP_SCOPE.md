# Vulcan’s Mind — MVP Scope

## P0 includes

- Floating chat button on `motornyi.com`.
- Custom flat icon: brain cross-section outline morphing into volcano crater with small eruption/sparks.
- Chat panel with greeting, disclaimer, suggested questions, input, loading/error states, source cards, clear local chat.
- Backend API: `GET /health`, `POST /api/chat`.
- Own RAG: PostgreSQL + pgvector, sources/chunks/embeddings, vector retrieval, prompt context, DB-grounded source metadata.
- Curated knowledge base: 35–50 approved sources, maximum 60.
- Ingestion scripts: validate, ingest, reindex.
- OpenAI main model + fallback model + embeddings.
- Safety guardrails for medical, military, out-of-scope, source hallucination.
- Anonymous operational metrics only, no full chat logs.
- Railway deploy and static website integration.
- Public-safe GitHub repo.

## P1 later

Streaming, better source cards, hybrid search, reranking, usage dashboard, custom API subdomain, `/projects/vulcans-mind` page, expanded KB, richer analytics.

## Explicitly out of P0

User accounts, OAuth, long-term memory, full chat history, admin panel, live web search, fine-tuning, voice, agent frameworks, uploads, medical decision support, tactical military advice, invasive analytics.

## Acceptance criteria

P0 is done when widget works on site, backend/RAG works on Railway, KB is ingested, answers show real sources, unsafe prompts are refused, no full logs exist, mobile Safari works, repo is public-safe.
