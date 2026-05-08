# Vulcan’s Mind — Railway Deployment Plan

## Target

Railway project with API service and PostgreSQL service with pgvector. Static `motornyi.com` calls Railway API. OpenAI API server-side only.

## Required env vars

`NODE_ENV=production`, `PORT`, `DATABASE_URL`, `OPENAI_API_KEY`, model vars, RAG vars, `ALLOWED_ORIGINS=https://motornyi.com`, rate limit vars, `MAX_MESSAGE_LENGTH`.

## Deployment sequence

1. Local setup and `/health`.
2. Create Railway project.
3. Add Postgres service.
4. Add API service from GitHub.
5. Configure env vars.
6. Deploy API.
7. Run migrations and enable pgvector.
8. Validate sources.
9. Run ingestion against production DB.
10. Test `/health` and `/api/chat`.
11. Integrate widget into `motornyi.com`.
12. Run QA.

## Static integration

```html
<link rel="stylesheet" href="/chat-widget.css">
<script>
window.VULCANS_MIND_CONFIG = { apiBaseUrl: "https://<railway-api-url>", language: "uk" };
</script>
<script src="/chat-widget.js" defer></script>
```

## Rollback

Use previous Railway deployment, revert commit, or temporarily remove widget script. Rotate keys if leaked. Lower rate limit/disable endpoint if abuse occurs.
