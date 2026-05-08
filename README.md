# Vulcan’s Mind

**Vulcan’s Mind** is a lightweight source-aware RAG chatbot built for `motornyi.com`.

It demonstrates practical AI API integration, PostgreSQL/pgvector retrieval, prompt design, safety guardrails, anonymous operational metrics, and static website chat-widget integration.

The chatbot focuses on AI automation, RAG/LLM systems/chatbots, psychometrics and digital screening, wartime mental health, military medicine constraints, neuromodulation, cognitive performance and learning, and human-AI interaction.

It is **not** a medical service, diagnostic tool, therapy tool, or military decision-support system.

## Architecture

```text
motornyi.com → floating chat widget → POST /api/chat
  → input validation → rate limit → topic/safety routing
  → query embedding → pgvector retrieval → prompt assembly
  → OpenAI generation → DB-grounded source cards
  → anonymous operational metrics
```

## P0 scope

Includes: floating chat widget, custom Vulcan’s Mind icon, `/health`, `/api/chat`, own RAG, PostgreSQL + pgvector, curated knowledge base, ingestion, OpenAI generation, fallback model, source cards, guardrails, anonymous metrics, Railway deployment, and `motornyi.com` integration.

Does not include: user accounts, OAuth, long-term memory, full chat history, admin panel, live web search, fine-tuning, voice, autonomous agents, medical decision support, or military operational support.

## Privacy rule

Do not persist full chat transcripts. Do not store full user messages, full assistant answers, full prompts, raw request bodies, retrieved chunk text in runtime logs, personal medical details, or sensitive military details.

Allowed metrics only: request id, timestamp, topic, model used, fallback used, retrieval count, source ids, token counts, input/output length, latency, status/error code.

## Local setup

Expected commands after implementation:

```bash
cd api
npm install
cp ../.env.example .env
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
npm run db:migrate
npm run validate:sources
npm run ingest
```

## Documentation

Start from `docs/00_MASTER_INDEX.md`. Final release gate is `docs/19_DEFINITION_OF_DONE.md`.
