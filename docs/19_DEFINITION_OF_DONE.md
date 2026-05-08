# Vulcan’s Mind — Definition of Done

## One-line DoD

P0 is done when `motornyi.com` has a working floating AI chat widget backed by own RAG on Railway, with curated sources, DB-grounded source cards, no full chat logs, safe medical/military boundaries, mobile support, and public GitHub documentation.

## Critical blockers

Not done if: direct OpenAI wrapper without RAG; no source cards; fake sources; KB not ingested; API key in frontend; `.env` in GitHub; full user messages/answers stored; diagnosis/treatment/dosage/DIY protocols; tactical military advice; mobile Safari unusable; Railway unstable; public repo contains restricted/sensitive material.

## Required done areas

Product: site integration, project copy, GitHub link, non-salesy positioning.
Architecture: static site separate from API, server-side secrets, CORS/rate limit, no public admin/ingestion.
Backend: `/health`, `/api/chat`, validation, structured errors, response shape.
Database: sources/documents/chunks/ingestion/request_metrics, pgvector, no transcript fields.
RAG: sources/chunks/embeddings, query retrieval, context, source metadata, no-answer behavior.
KB: topics, 35–50 approved sources, source metadata, project notes, no restricted full text.
Models: main/fallback/env config, embeddings, fallback once, token limits.
Prompting: source rules, medical/military/out-of-scope guardrails.
Privacy: no full logs, anonymous metrics only, browser no transcript.
Security: `.env` ignored, CORS, rate limit, validation, safe rendering.
Widget: button/icon/panel/greeting/disclaimer/suggested/source cards/responsive.
Deployment: Railway API/Postgres/migrations/ingestion/site integration.
Testing: typecheck/lint/test/build/source validation/API/RAG/safety/privacy/mobile.

## Final statement

Vulcan’s Mind P0 is complete only after all critical items in this document pass.
