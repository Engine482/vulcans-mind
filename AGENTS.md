# AGENTS.md — Vulcan’s Mind

## Mission

Build a small source-aware RAG chatbot for `motornyi.com` demonstrating AI API integration, own RAG, PostgreSQL/pgvector, prompt guardrails, chatbot UX, privacy-conscious logging, and Railway deployment.

## Required reading

Before work: `README.md`, `CLAUDE.md`, `docs/00_MASTER_INDEX.md`, `docs/01_PRODUCT_BRIEF.md`, `docs/02_MVP_SCOPE.md`, `docs/18_SPRINT_PLAN.md`, `docs/19_DEFINITION_OF_DONE.md`.

## Commands

Expected after implementation:

```bash
cd api
npm install
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
npm run db:migrate
npm run validate:sources
npm run ingest
```

## Hard constraints

Never persist full chat transcripts. Never store/log full user message, full assistant answer, prompt, raw body, retrieved chunk text, secrets, medical details, or sensitive military details.

Forbidden tables/fields: `messages`, `conversations`, `chat_history`, `message_text`, `answer_text`, `full_prompt`, `raw_request_body`, `raw_response_body`.

## Public API

Only `GET /health` and `POST /api/chat` are public in P0. No public ingestion, reindex, source editing, metrics, logs, or admin endpoints.

## Release blockers

Secrets exposed, `.env` committed, full logs stored, RAG not working, fake source cards, unsafe medical/tactical answer, broken mobile widget, broken Railway deploy, or sensitive/restricted materials in public repo.
