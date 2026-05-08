# Vulcan’s Mind — Non-Functional Requirements

## Performance

Widget must be lightweight and not block site load. API should show loading quickly; complete answer target under ~20s for normal cases. Retrieval should be bounded by topK/context limits.

## Reliability

Safe degradation: OpenAI failure, DB failure, weak retrieval, and rate limit must produce safe user-facing messages. No infinite spinner.

## Security

Secrets only in env vars. `.env` ignored. No API key in frontend. Public endpoints limited to `/health` and `/api/chat`. CORS allowlist and rate limit required. Input validation and safe output rendering required.

## Privacy

No full chat logs. Store anonymous operational metrics only. No transcript in browser localStorage/sessionStorage. No user content in production logs.

## Maintainability

Boring architecture: TypeScript, Fastify/Express, Postgres/pgvector, simple modules, vanilla JS widget. Avoid unnecessary frameworks and abstractions.

## Accessibility

Keyboard focus, accessible labels, readable contrast, mobile Safari support, reduced-motion-safe animations.

## Cost control

Input/output/context limits, rate limit, cheap main model, fallback once only, no long history, no live browsing.
