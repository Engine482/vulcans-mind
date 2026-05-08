# Vulcan’s Mind — RAG Design

## Goal

Give source-aware answers within defined topics using curated sources, PostgreSQL + pgvector, embeddings, and OpenAI generation.

## Pipeline

User question → topic/scope check → query normalization → query embedding → vector retrieval → source hydration → context selection → prompt assembly → answer generation → source-aware response.

## Topics

AI automation; RAG/LLM/chatbots; psychometrics/screening; wartime mental health; military medicine; neuromodulation; cognitive performance; human-AI interaction; public project context.

## Chunking

Default P0: 3000–4500 characters, 500–900 overlap, or 700–1000 tokens with 100–200 overlap if token splitter exists. Store chunk id, source id, chunk index, content hash, embedding, model.

## Retrieval

Defaults: topK=8, max_context_chunks=5, max_context_chars=16000, max_chunks_per_source=2. Prefer source diversity. Use similarity threshold later if needed.

## Source rules

Context blocks must include source id/title/authors/year/type/topic/content. Source cards come from DB metadata only. Model never invents DOI/URL/title/authors/year.

## No-answer behavior

If retrieval is weak: say local KB is insufficient and offer to reframe in supported domains. Do not fake confidence.

## Definition of Done

Sources/chunks/embeddings exist, query retrieval works, context passed to prompt, source metadata returned, weak retrieval handled honestly, no full messages/answers persisted.
