# Vulcan’s Mind — API Specification

## Public endpoints

- `GET /health`
- `POST /api/chat`

No public ingestion/admin/metrics/log endpoints.

## `GET /health`

Returns 200 with safe JSON:

```json
{"status":"ok","service":"vulcans-mind-api","timestamp":"...","version":"0.1.0"}
```

No secrets or detailed dependency internals.

## `POST /api/chat`

Request:

```json
{"message":"Що таке RAG?","sessionId":"anon_123","language":"uk"}
```

Validation: message required, string, non-empty, max 1500 chars. sessionId optional max 100. language optional `uk|en|auto`.

Success response:

```json
{
  "answer":"...",
  "sources":[{"id":"...","title":"...","authors":"...","year":2024,"url":"...","doi":null,"sourceType":"research_article","topic":"rag_llm_chatbots"}],
  "meta":{"requestId":"req_...","topic":"rag_llm_chatbots","model":"gpt-5-mini","fallbackUsed":false,"retrievalCount":5,"responseLanguage":"uk"}
}
```

Errors use `{ error, message }` with 400, 429, 500/503. No stack traces or raw provider/DB errors.

## Processing contract

Validate → rate limit → request id → topic/safety route → embed → retrieve → prompt → main model → fallback once → format response → anonymous metrics → return.
