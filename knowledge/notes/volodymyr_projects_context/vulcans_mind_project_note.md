# Vulcan's Mind — public project note

Vulcan's Mind is a small source-aware retrieval-augmented generation (RAG) chatbot embedded into `motornyi.com`. It demonstrates practical AI API integration, own RAG over a curated knowledge base, PostgreSQL with pgvector retrieval, prompt engineering, anonymous operational metrics, safety guardrails, and Railway deployment.

## Scope

The chatbot focuses on a fixed set of public themes: AI automation; retrieval-augmented generation, large language models, and chatbots; psychometrics and digital screening; wartime mental health; military medicine and field constraints; neuromodulation and device-based interventions; cognitive performance and learning; human-AI interaction.

It is not a medical service, diagnostic tool, therapy tool, or military decision-support system. It does not provide diagnosis, treatment plans, dosage advice, do-it-yourself neuromodulation protocols, or tactical military advice.

## Architecture

A static page on `motornyi.com` renders a small floating chat widget. The widget calls a separate backend API hosted on Railway. The API validates input, applies CORS and rate limits, classifies the topic and safety route, embeds the query, retrieves chunks from PostgreSQL with the pgvector extension, builds a prompt grounded in retrieved sources, calls the OpenAI generation model with one fallback, and returns an answer together with source cards built from database metadata.

## Privacy

The system intentionally does not store full chat transcripts. There is no `messages`, `conversations`, `chat_history`, `message_text`, `answer_text`, `full_prompt`, `raw_request_body`, or `raw_response_body` table or field anywhere in the design. Only anonymous operational metrics are recorded: request id, timestamp, coarse topic, model used, fallback flag, retrieval count, retrieved source ids, token counts, input and output length in characters, latency, and status or error code. The browser does not persist transcripts to local or session storage.

## Knowledge base

The knowledge base is a small, curated set of approved public sources covering the eight themes above, plus a few public project notes. Sources are tracked as structured metadata (id, title, authors, year, topic, source type, URL or DOI, abstract, language, status, copyright status). Restricted full text is never committed to the public repository. Source cards in answers come only from database metadata; the model is not asked to invent titles, authors, years, DOIs, or URLs.
