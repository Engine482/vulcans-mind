# Vulcan’s Mind — Database Schema

## DB

PostgreSQL + pgvector.

## Required tables

`sources`, `source_documents`, `chunks`, `ingestion_runs`, `ingestion_run_items`, `request_metrics`.

## Forbidden transcript storage

No `messages`, `conversations`, `chat_history`, `message_text`, `answer_text`, `full_prompt`, `raw_request_body`, `raw_response_body`.

## Sources

Fields: id, title, authors, year, topic, source_type, url, doi, abstract, publisher, language, status, relevance_score, quality_notes, copyright_status, created_at, updated_at.

## Chunks

Fields: id, source_id, source_document_id, chunk_index, content, content_hash, token_count, embedding vector, embedding_model, timestamps. Index embedding with pgvector and source_id.

## Request metrics

Allowed fields only: id, request_id, session_id_hash, topic, response_language, model_used, fallback_used, retrieval_count, retrieved_source_ids JSONB, input_length_chars, output_length_chars, input_tokens, output_tokens, latency_ms, status, error_code, created_at.

## Pseudo-DDL note

Migration must enable `CREATE EXTENSION IF NOT EXISTS vector;` and create vector column matching embedding dimension, usually 1536 for `text-embedding-3-small`.

## Retention

Metrics 30 days recommended. Sources/chunks retained until updated. No transcript retention because no transcript storage exists.
