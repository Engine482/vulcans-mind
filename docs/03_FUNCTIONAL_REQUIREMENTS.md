# Vulcan’s Mind — Functional Requirements

## Frontend

- Floating launcher button, bottom-right, mobile-safe.
- Chat panel opens/closes without breaking site.
- Greeting and disclaimer visible.
- 4–6 suggested questions.
- Input max 1500 characters.
- Loading state: “Шукаю в базі джерел…”.
- Answer display with safe formatting.
- Source cards from API metadata.
- Error states for validation, rate limit, backend unavailable, model/retrieval failure.
- Clear local chat; no server delete endpoint needed.
- No transcript in localStorage.

## Backend

- `GET /health` returns safe status.
- `POST /api/chat` validates input, rate-limits, routes topic/safety, retrieves context, calls model, returns answer/sources/meta, logs anonymous metrics only.
- CORS allowlist.
- Server-side OpenAI key only.
- Main/fallback model logic.

## RAG

- Source registry with metadata.
- Ingestion CLI.
- Text extraction for Markdown/TXT/PDF when stable.
- Chunking, embeddings, pgvector retrieval.
- Source-aware generation.
- No fake sources.
- No-answer behavior for weak retrieval.

## Safety

- No diagnosis/treatment/dosage/DIY protocols.
- No tactical/operational military advice.
- Out-of-scope questions redirected.

## Website

- Add Projects section description and GitHub link.
- Widget assets integrated without blocking site.
