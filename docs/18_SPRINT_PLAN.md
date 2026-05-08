# Vulcan’s Mind — Sprint Plan

## Overview

0 Repository/docs setup. 1 Backend skeleton. 2 Database schema. 3 KB scaffold. 4 Literature collection. 5 Ingestion. 6 Retrieval. 7 Chat endpoint. 8 Prompt/guardrails/fallback. 9 Widget. 10 Railway. 11 Website integration. 12 QA/release hardening.

## Recommended execution order

Sprint 0 → 1 → 2 → 3 → 5 early tiny ingestion → 6 → 7 mock answer → 8 real generation → 4 full literature → 5 full ingestion → 9 widget → 10 Railway → 11 site → 12 final QA.

## Sprint acceptance summaries

S0: repo structure, docs, `.env.example`, `.gitignore`, public-safe.
S1: TypeScript API, `/health`, config, CORS, safe errors, tests.
S2: Postgres/pgvector schema, no transcript tables.
S3: topics, source schema, validation script.
S4: 35–50 approved sources, project notes, source selection summary.
S5: ingestion creates sources/chunks/embeddings and ingestion runs.
S6: query embedding/vector retrieval/source hydration/context selection.
S7: `/api/chat` validates, routes, retrieves, returns mock answer/sources/meta, logs anonymous metrics.
S8: OpenAI prompt builder, main/fallback, guardrails, no fake sources.
S9: static widget with icon, panel, source cards, mobile/accessibility.
S10: Railway API/Postgres, migrations, production ingestion, smoke tests.
S11: `motornyi.com` project copy, GitHub link, widget config.
S12: full test checklist and blockers fixed.

## Scope control

Classify new features as P0 blocker/useful, P1, P2, or out of scope. Do not silently add P1/P2.
