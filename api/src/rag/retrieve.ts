import type pg from "pg";
import type { AppConfig } from "../config.js";
import type { Embedder } from "./embed.js";
import { toPgVector } from "./embed.js";

export type SourceMeta = {
  sourceId: string;
  externalId: string;
  title: string;
  authors: string | null;
  year: number | null;
  topic: string;
  sourceType: string;
  url: string | null;
  doi: string | null;
};

export type RetrievedChunk = {
  chunkId: string;
  sourceId: string;
  sourceExternalId: string;
  sourceDocumentId: string | null;
  chunkIndex: number;
  content: string;
  similarity: number;
};

export type ContextChunk = RetrievedChunk;

export type RetrievalResult = {
  chunks: ContextChunk[];
  sources: SourceMeta[];
  candidateCount: number;
  topSimilarity: number | null;
  embeddingModel: string;
  inputTokens: number;
};

export type RetrieveOptions = {
  topK?: number;
  maxContextChunks?: number;
  maxContextChars?: number;
  maxChunksPerSource?: number;
  minSimilarity?: number;
};

type SearchRow = {
  chunk_id: string;
  source_id: string;
  source_external_id: string;
  source_document_id: string | null;
  chunk_index: number;
  content: string;
  similarity: string;
  title: string;
  authors: string | null;
  year: number | null;
  topic: string;
  source_type: string;
  url: string | null;
  doi: string | null;
};

type Candidate = RetrievedChunk & { source: SourceMeta };

export type SelectionConfig = Required<
  Omit<RetrieveOptions, "minSimilarity">
> & { minSimilarity: number | undefined };

export function resolveSelectionConfig(
  config: AppConfig,
  overrides: RetrieveOptions = {},
): SelectionConfig {
  return {
    topK: overrides.topK ?? config.rag.topK,
    maxContextChunks: overrides.maxContextChunks ?? config.rag.maxContextChunks,
    maxContextChars: overrides.maxContextChars ?? config.rag.maxContextChars,
    maxChunksPerSource:
      overrides.maxChunksPerSource ?? config.rag.maxChunksPerSource,
    minSimilarity:
      overrides.minSimilarity !== undefined
        ? overrides.minSimilarity
        : config.rag.minSimilarity,
  };
}

/**
 * Pure selection: given candidates already sorted by descending similarity,
 * pick chunks honoring per-source diversity, total chunk cap, and char budget.
 * Optionally filters by minimum similarity.
 */
export function selectContext(
  candidates: Candidate[],
  selection: SelectionConfig,
): { chunks: ContextChunk[]; sources: SourceMeta[] } {
  const filtered =
    selection.minSimilarity !== undefined
      ? candidates.filter((c) => c.similarity >= selection.minSimilarity!)
      : candidates;

  const perSource = new Map<string, number>();
  const chosen: ContextChunk[] = [];
  const sourceMap = new Map<string, SourceMeta>();
  let charBudget = selection.maxContextChars;

  for (const c of filtered) {
    if (chosen.length >= selection.maxContextChunks) break;
    const used = perSource.get(c.sourceId) ?? 0;
    if (used >= selection.maxChunksPerSource) continue;
    if (c.content.length > charBudget) {
      // Skip oversized chunks rather than truncate; preserves source integrity.
      continue;
    }
    chosen.push({
      chunkId: c.chunkId,
      sourceId: c.sourceId,
      sourceExternalId: c.sourceExternalId,
      sourceDocumentId: c.sourceDocumentId,
      chunkIndex: c.chunkIndex,
      content: c.content,
      similarity: c.similarity,
    });
    perSource.set(c.sourceId, used + 1);
    if (!sourceMap.has(c.sourceId)) sourceMap.set(c.sourceId, c.source);
    charBudget -= c.content.length;
  }

  return { chunks: chosen, sources: Array.from(sourceMap.values()) };
}

export interface Retriever {
  retrieve(
    query: string,
    overrides?: RetrieveOptions,
  ): Promise<RetrievalResult>;
}

export class PgVectorRetriever implements Retriever {
  constructor(
    private readonly pool: pg.Pool,
    private readonly embedder: Embedder,
    private readonly config: AppConfig,
  ) {}

  async retrieve(
    query: string,
    overrides: RetrieveOptions = {},
  ): Promise<RetrievalResult> {
    const trimmed = query.trim();
    if (trimmed.length === 0) throw new Error("retrieve: query is empty");

    const selection = resolveSelectionConfig(this.config, overrides);
    const { embedding, inputTokens, model } = await this.embedder.embed(trimmed);
    const queryVector = toPgVector(embedding);

    const sql = `
      SELECT c.id              AS chunk_id,
             c.source_id       AS source_id,
             s.external_id     AS source_external_id,
             c.source_document_id,
             c.chunk_index,
             c.content,
             (1 - (c.embedding <=> $1::vector))::text AS similarity,
             s.title, s.authors, s.year, s.topic,
             s.source_type, s.url, s.doi
      FROM chunks c
      JOIN sources s ON s.id = c.source_id
      WHERE s.status = 'approved'
        AND c.embedding IS NOT NULL
      ORDER BY c.embedding <=> $1::vector
      LIMIT $2
    `;
    const res = await this.pool.query<SearchRow>(sql, [queryVector, selection.topK]);

    const candidates: Candidate[] = res.rows.map((r) => ({
      chunkId: r.chunk_id,
      sourceId: r.source_id,
      sourceExternalId: r.source_external_id,
      sourceDocumentId: r.source_document_id,
      chunkIndex: r.chunk_index,
      content: r.content,
      similarity: Number(r.similarity),
      source: {
        sourceId: r.source_id,
        externalId: r.source_external_id,
        title: r.title,
        authors: r.authors,
        year: r.year,
        topic: r.topic,
        sourceType: r.source_type,
        url: r.url,
        doi: r.doi,
      },
    }));

    const { chunks, sources } = selectContext(candidates, selection);

    return {
      chunks,
      sources,
      candidateCount: candidates.length,
      topSimilarity: candidates[0]?.similarity ?? null,
      embeddingModel: model,
      inputTokens,
    };
  }
}
