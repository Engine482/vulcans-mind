# CLAUDE.md — Vulcan’s Mind

## Project identity

You are working on **Vulcan’s Mind**, a lightweight source-aware RAG chatbot for `motornyi.com`.

It demonstrates AI API integration, own RAG, PostgreSQL + pgvector retrieval, prompt engineering, chatbot UX, safety guardrails, anonymous operational metrics, Railway deployment, and static website integration.

It is not a generic chatbot, medical service, or military decision-support system.

## Required reading before implementation

Read: `README.md`, `AGENTS.md`, `docs/00_MASTER_INDEX.md`, `docs/01_PRODUCT_BRIEF.md`, `docs/02_MVP_SCOPE.md`, `docs/18_SPRINT_PLAN.md`, `docs/19_DEFINITION_OF_DONE.md`.

For technical work also read the relevant specific docs.

## P0 scope

Build: floating widget, custom icon, `/health`, `/api/chat`, own RAG, pgvector, curated KB, ingestion script, OpenAI generation, fallback, source cards, anonymous metrics, Railway deployment, `motornyi.com` integration.

Do not build: accounts, OAuth, long-term memory, full chat history, admin panel, live web search, fine-tuning, voice, agent frameworks, medical decision support, military operational support.

## Absolute privacy rule

Never store or log full user message, full assistant answer, full prompt, raw request/response body, retrieved chunk text, personal medical details, or sensitive military details.

Allowed metrics: request id, timestamp, topic, model, fallback used, retrieval count, retrieved source ids, token counts, input/output length, latency, status/error code.

## Safety rules

Medical: no diagnosis, treatment plan, dosage, medication changes, DIY neuromodulation protocol, or replacement of clinician.

Military: no tactical plans, operational advice, evasion, targeting, weapon optimization, active battlefield decision support, or sensitive procedures.

Source integrity: source cards come from DB metadata only. The model must not invent titles, authors, years, DOI, URLs, or guidelines.

## Implementation order

Follow `docs/18_SPRINT_PLAN.md`:
Sprint 0 → 1 → 2 → 3 → 5 early → 6 → 7 → 8 → 4 → 5 full → 9 → 10 → 11 → 12.

## Reporting format

After each sprint report: summary, files changed, commands run, tests passed, known issues, scope risks, next recommended sprint.
