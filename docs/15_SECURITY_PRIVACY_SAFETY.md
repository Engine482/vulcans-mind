# Vulcan’s Mind — Security, Privacy, and Safety

## Principles

Data minimization, no full transcript persistence, server-side secrets only, safety over helpfulness, public repo safety.

## Threats

API key leak, DB credential leak, sensitive logs, unsafe medical/tactical answers, prompt injection, fake sources, cost abuse, restricted PDFs in repo, XSS.

## Privacy

Never store/log full user messages, assistant answers, prompts, raw bodies, retrieved chunk text. Store only anonymous metrics.

Browser: messages in memory only; no transcript in localStorage/sessionStorage. sessionStorage may hold anonymous session id.

## Security

`.env` ignored. Secrets in env/Railway only. CORS allowlist, no wildcard in production. Rate limit before model calls. Input validation. Safe output rendering. Parameterized DB queries/ORM. No public admin/ingestion endpoints.

## Medical safety

No diagnosis, treatment, dosage, medication changes, DIY neuromodulation protocols, self-treatment instructions, replacement of clinician. Allowed: general concepts/evidence, screening vs diagnosis, professional assessment boundary.

## Military safety

No tactical/operational advice, evasion, targeting, weapon optimization, active battlefield decision support, sensitive procedures. Allowed: high-level field constraints, human factors, military medicine UX/product context.

## Source safety

No fake sources. Source cards from DB only. Weak retrieval means cautious/no-answer behavior. No restricted copyrighted full text in public repo.

## Incident response

If secret leaks: revoke, rotate, purge history if needed, redeploy. If unsafe answer: patch guardrails/tests, redeploy. If privacy violation: remove storage/logging, verify DB/logs/browser.
