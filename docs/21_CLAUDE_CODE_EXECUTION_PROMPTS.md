# Vulcan’s Mind — Claude Code Execution Prompts

## Bootstrap prompt

You are working in the Vulcan’s Mind repo. First read README.md, CLAUDE.md, AGENTS.md, docs/00_MASTER_INDEX.md, docs/01_PRODUCT_BRIEF.md, docs/02_MVP_SCOPE.md, docs/18_SPRINT_PLAN.md, docs/19_DEFINITION_OF_DONE.md. Start with Sprint 0. Do not overbuild. No auth, long memory, admin panel, live search, voice, fine-tuning, agent frameworks. Preserve no-full-chat-log policy. Report files changed, commands run, tests, blockers, next sprint.

## Sprint prompts summary

S1 Backend skeleton: TypeScript Fastify/Express, `/health`, env validation, CORS, request id, safe errors, no request body logging.

S2 DB schema: Postgres/pgvector tables sources, source_documents, chunks, ingestion_runs, ingestion_run_items, request_metrics. Forbidden transcript fields.

S3 KB scaffold: topics.yaml, sources files, source validator, raw ignored.

S5 early tiny ingestion: process 1–2 safe notes, chunk, embed, store, audit.

S6 retrieval: embed query, pgvector search, source hydration, context selection, no chunk text logging.

S7 chat endpoint mock: validation, rate limit, topic routing, unsafe/out-of-scope handling, retrieval, mock answer, anonymous metrics.

S8 OpenAI: client, prompt builder, system prompt, main model, fallback once, DB-grounded sources, safety QA.

S4 full literature: collect 35–50 sources, project notes, selection summary, validate.

S5 full ingestion: ingest approved sources, smoke test retrieval per topic.

S9 widget: vanilla JS/CSS, custom icon, panel, greeting/disclaimer/suggested, API integration, source cards, mobile/accessibility, no transcript storage.

S10 Railway: env vars, deploy, migrations, production ingestion, health/chat tests, safe logs.

S11 website: add Projects copy, GitHub link, widget assets/config, production site QA.

S12 final QA: run all checks, regression prompts, privacy/log inspection, mobile Safari.

## Emergency prompts

Privacy violation: remove any logging/storage of full messages, answers, prompts, chunks, raw bodies. Verify DB/logs/browser.

Unsafe medical: patch classifier/prompt/templates/tests to refuse diagnosis/treatment/dosage/DIY protocols.

Unsafe military: patch classifier/prompt/templates/tests to refuse tactical/operational/weapon/evasion guidance.

Source hallucination: ensure source cards only from DB; model cannot invent DOI/title/URL/year; add weak/no-source behavior.

Mobile breakage: fix viewport, safe area, keyboard/input, panel height, scroll, close button, source cards.

## Final handoff

Report implemented/not implemented, local run, deployment, ingestion, site integration, model config, KB status, privacy/logging, safety boundaries, QA results, known issues, P1 backlog. Do not claim done unless DoD passes.
