# Vulcan's Mind — Source Selection Summary

Snapshot of the curated P0 knowledge base after Sprint 4 (full literature collection). Run `npm run validate:sources` from `api/` to regenerate the canonical counts.

## Headline numbers

- Approved sources: 48 (within the P0 range of 35–50, well under the hard cap of 60).
- Approved across 9 buckets: 8 supported domains plus 3 author-owned project notes.
- Rejected: 0.
- Deferred: 0.

The P0 selection is intentionally tight. Adding more sources is straightforward later; trimming a sprawling KB is harder.

## Per-topic counts vs. targets

| Topic | Target min–max (docs/07) | Approved |
| --- | --- | --- |
| ai_automation | 4–6 | 5 |
| rag_llm_chatbots | 5–7 | 6 |
| psychometrics_screening | 5–7 | 6 |
| wartime_mental_health | 5–7 | 6 |
| military_medicine | 4–6 | 5 |
| neuromodulation | 6–8 | 7 |
| cognitive_performance_learning | 4–6 | 5 |
| human_ai_interaction | 4–6 | 5 |
| volodymyr_projects_context | 3–5 | 3 |

All bands are satisfied without exceeding any maximum.

## Selection principles applied

- **Quality hierarchy.** Strong preference for systematic reviews, meta-analyses, peer-reviewed guidelines, and foundational papers over recent empirical one-offs. Two Cochrane / WHO / IASC items anchor the wartime mental-health bucket; expert-consensus guidelines anchor the rTMS and tDCS buckets.
- **Public-safe metadata only.** No restricted full-text PDFs are stored in the repo. Each non-project-note source includes a short original summary written for this project so that S5 full ingestion can run without copying journal abstracts verbatim.
- **No fabricated sources.** Every entry has a real DOI or canonical URL pointing to a verifiable record. The model is forbidden from generating source cards (see `docs/10_PROMPTING_AND_GUARDRAILS.md`); the registry here is the only source of truth.
- **Safety boundaries.** Military-medicine entries are limited to high-level, public, doctrine-level material (TCCC CPGs landing page, public mortality epidemiology, situation-awareness theory) — no operational, tactical, or unit-level content. Neuromodulation entries are evidence-and-safety-focused; no DIY protocols.
- **Ukrainian-context awareness.** The wartime mental-health bucket leans on global references (WHO, IASC, Cochrane, WHO World Mental Health Surveys) rather than on country-specific war studies that would require careful provenance review. Country-specific Ukrainian-population studies can be added in a later sprint after individual review.

## Copyright posture

- `open_access`: open-access articles (arXiv preprints, Bommasani report, Kessler/WHO survey paper) and openly licensed guidelines.
- `abstract_only`: peer-reviewed articles where only metadata + a short original summary is stored locally; full text is not redistributed.
- `metadata_only`: vendor documentation pages (OpenAI, Anthropic) — title and URL only.
- `owned_by_author`: the three project notes by Volodymyr Motornyi.

No source carries `restricted` status in the approved set; the validator rejects that combination explicitly.

## Weak areas / known gaps

- **Country-specific Ukrainian population studies on war-related mental health.** Currently covered only via global references. Future sprint can add 1–2 vetted Ukraine-specific studies once provenance and publication metadata are double-checked.
- **HCI for voice-first / accessibility-specific contexts.** Currently represented by general human-AI interaction literature; could deepen with a dedicated voice-UI reference if "Іменуй мене" or another project moves in that direction.
- **Up-to-date 2025 RAG evaluation literature.** The survey by Gao et al. (2024) is the freshest reference; very recent evaluation benchmarks are deliberately skipped because the field is moving too fast for stable curation.

## Ingestion readiness

- Every approved source has either a `summary` field (own short text) or, for project notes, a corresponding `.md` document under `knowledge/notes/...`.
- The ingestion script (`api/scripts/ingest.ts`) reads `abstract ?? summary` for non-`project_note` rows and the matching markdown file for `project_note` rows. With this seed file, both code paths have content to chunk and embed.
- The knowledge base is therefore ready for Sprint 5-full ingestion once a real `OPENAI_API_KEY` and `DATABASE_URL` are configured.
