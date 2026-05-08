# API — Vulcan’s Mind

Backend API for health checks, chat, validation, CORS, rate limit, topic/safety routing, RAG retrieval, OpenAI generation, fallback, source formatting, and anonymous metrics.

Public endpoints: `GET /health`, `POST /api/chat`.

No public ingestion, reindex, source editing, prompt editing, metrics, logs, or admin actions.

Recommended stack: TypeScript, Node.js, Fastify, Zod, PostgreSQL, pgvector, Prisma or Drizzle, OpenAI API, Vitest, ESLint, Prettier.

Critical privacy rule: do not store/log full messages, answers, prompts, raw bodies, retrieved chunk text, or secrets.

Safety: no diagnosis/treatment/dosage/DIY neuromodulation protocols; no tactical/operational military advice.
