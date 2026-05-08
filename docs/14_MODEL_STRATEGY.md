# Vulcan’s Mind — Model Strategy

## Roles

Answer generation, embeddings, optional topic/safety classification.

## Defaults

Main model: `gpt-5-mini` or current cost-efficient OpenAI model. Fallback: `gpt-5.4-mini` or stronger configured model. Embeddings: `text-embedding-3-small`, expected dimension 1536.

## Env vars

`OPENAI_MAIN_MODEL`, `OPENAI_FALLBACK_MODEL`, `OPENAI_EMBEDDING_MODEL`, `OPENAI_MAX_OUTPUT_TOKENS=900`, `OPENAI_TEMPERATURE=0.3`, `OPENAI_TIMEOUT_MS=30000`.

## Fallback

Main model → if technical failure/empty/invalid answer → fallback once → if fallback fails safe error. Max generation attempts per request: 2.

## Cost controls

Max input length, max output tokens, topK, max context chars/chunks, rate limit, no full conversation history, no browsing, fallback once only.

## Output format

Model returns answer text. Backend attaches sources from DB metadata. Do not ask model to generate source cards.
