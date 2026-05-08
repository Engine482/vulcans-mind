# Vulcan’s Mind — Master Index

Start here. Vulcan’s Mind is a small source-aware RAG chatbot for `motornyi.com`.

## Mandatory reading before implementation

`README.md`, `CLAUDE.md`, `AGENTS.md`, `docs/00_MASTER_INDEX.md`, `docs/01_PRODUCT_BRIEF.md`, `docs/02_MVP_SCOPE.md`, `docs/18_SPRINT_PLAN.md`, `docs/19_DEFINITION_OF_DONE.md`.

## Document map

- `01_PRODUCT_BRIEF.md` — what the product is, why it exists, what it is not.
- `02_MVP_SCOPE.md` — P0/P1/P2 scope and anti-scope rules.
- `03_FUNCTIONAL_REQUIREMENTS.md` — functional behavior for frontend, backend, RAG, KB, safety, website.
- `04_NON_FUNCTIONAL_REQUIREMENTS.md` — performance, reliability, security, privacy, maintainability, cost.
- `05_ARCHITECTURE.md` — system architecture, runtime flow, ingestion, modules.
- `06_RAG_DESIGN.md` — chunking, embeddings, retrieval, prompt context, source behavior.
- `07_KNOWLEDGE_BASE_PLAN.md` — source counts, quality hierarchy, copyright, file structure.
- `08_LITERATURE_COLLECTION_TASK.md` — exact research task for collecting 35–50 sources.
- `09_TOPICS_AND_QUESTION_MAP.md` — topic ids, allowed/excluded questions, suggested questions.
- `10_PROMPTING_AND_GUARDRAILS.md` — system prompt, tone, safety templates.
- `11_CHAT_WIDGET_UX_SPEC.md` — button, icon, panel, mobile UX, source cards.
- `12_API_SPEC.md` — `/health`, `/api/chat`, schemas, errors.
- `13_DATABASE_SCHEMA.md` — Postgres/pgvector schema and forbidden transcript storage.
- `14_MODEL_STRATEGY.md` — main model, fallback, embeddings, cost controls.
- `15_SECURITY_PRIVACY_SAFETY.md` — threat model, no-full-logs, CORS, rate limit, safety.
- `16_RAILWAY_DEPLOYMENT.md` — Railway services, env vars, migrations, ingestion, site integration.
- `17_TESTING_QA_PLAN.md` — unit/API/RAG/safety/privacy/responsive QA.
- `18_SPRINT_PLAN.md` — ordered implementation sprints.
- `19_DEFINITION_OF_DONE.md` — final release gate.
- `20_WEBSITE_INTEGRATION_COPY.md` — ready text for site/widget/GitHub.
- `21_CLAUDE_CODE_EXECUTION_PROMPTS.md` — prompts for Claude Code.

## Absolute constraints

No accounts, OAuth, long-term memory, full chat logs, admin panel, live web search, fine-tuning, voice, agent frameworks, diagnosis, treatment, DIY neuromodulation protocols, tactical military advice.

## Release blockers

API key leak, `.env` committed, full chat logs stored, unsafe medical/tactical answer, fake sources, broken RAG, broken widget on mobile Safari, broken Railway deploy, restricted/sensitive public repo content.
