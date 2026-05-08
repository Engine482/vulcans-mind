import { describe, it, expect } from "vitest";
import {
  selectContext,
  resolveSelectionConfig,
  type SelectionConfig,
  type SourceMeta,
  type RetrievedChunk,
} from "./retrieve.js";
import { loadConfig } from "../config.js";

type Candidate = RetrievedChunk & { source: SourceMeta };

function src(id: string, extra: Partial<SourceMeta> = {}): SourceMeta {
  return {
    sourceId: id,
    externalId: `ext-${id}`,
    title: `Source ${id}`,
    authors: null,
    year: 2024,
    topic: "rag_llm_chatbots",
    sourceType: "research_article",
    url: null,
    doi: null,
    ...extra,
  };
}

function chunk(
  source: SourceMeta,
  chunkIndex: number,
  similarity: number,
  content = "x".repeat(100),
): Candidate {
  return {
    chunkId: `${source.sourceId}#${chunkIndex}`,
    sourceId: source.sourceId,
    sourceExternalId: source.externalId,
    sourceDocumentId: `${source.sourceId}-doc`,
    chunkIndex,
    content,
    similarity,
    source,
  };
}

const baseSelection: SelectionConfig = {
  topK: 8,
  maxContextChunks: 5,
  maxContextChars: 16_000,
  maxChunksPerSource: 2,
  minSimilarity: undefined,
};

describe("selectContext", () => {
  it("returns top candidates within chunk and per-source caps", () => {
    const a = src("a");
    const b = src("b");
    const candidates = [
      chunk(a, 0, 0.9),
      chunk(a, 1, 0.85),
      chunk(a, 2, 0.8), // 3rd from same source — should be skipped
      chunk(b, 0, 0.75),
      chunk(b, 1, 0.7),
    ];
    const { chunks, sources } = selectContext(candidates, baseSelection);
    expect(chunks).toHaveLength(4);
    expect(chunks.map((c) => c.chunkId)).toEqual([
      "a#0",
      "a#1",
      "b#0",
      "b#1",
    ]);
    expect(sources.map((s) => s.sourceId)).toEqual(["a", "b"]);
  });

  it("respects maxContextChunks", () => {
    const a = src("a");
    const b = src("b");
    const c = src("c");
    const candidates = [
      chunk(a, 0, 0.9),
      chunk(b, 0, 0.85),
      chunk(c, 0, 0.8),
      chunk(a, 1, 0.75),
      chunk(b, 1, 0.7),
    ];
    const { chunks } = selectContext(candidates, {
      ...baseSelection,
      maxContextChunks: 3,
    });
    expect(chunks).toHaveLength(3);
    expect(chunks.map((c) => c.chunkId)).toEqual(["a#0", "b#0", "c#0"]);
  });

  it("respects maxContextChars budget", () => {
    const a = src("a");
    const b = src("b");
    const c = src("c");
    const big = "y".repeat(800);
    const candidates = [
      chunk(a, 0, 0.9, big),
      chunk(b, 0, 0.85, big),
      chunk(c, 0, 0.7, big),
    ];
    const { chunks } = selectContext(candidates, {
      ...baseSelection,
      maxContextChars: 1700,
    });
    expect(chunks.map((c) => c.chunkId)).toEqual(["a#0", "b#0"]);
  });

  it("skips oversized chunks rather than truncating", () => {
    const a = src("a");
    const b = src("b");
    const candidates = [
      chunk(a, 0, 0.9, "y".repeat(2000)),
      chunk(b, 0, 0.85, "z".repeat(500)),
    ];
    const { chunks } = selectContext(candidates, {
      ...baseSelection,
      maxContextChars: 1000,
    });
    expect(chunks.map((c) => c.chunkId)).toEqual(["b#0"]);
  });

  it("filters by minSimilarity when provided", () => {
    const a = src("a");
    const b = src("b");
    const candidates = [
      chunk(a, 0, 0.9),
      chunk(b, 0, 0.5),
      chunk(b, 1, 0.4),
    ];
    const { chunks } = selectContext(candidates, {
      ...baseSelection,
      minSimilarity: 0.6,
    });
    expect(chunks.map((c) => c.chunkId)).toEqual(["a#0"]);
  });

  it("returns empty result when no candidates", () => {
    const { chunks, sources } = selectContext([], baseSelection);
    expect(chunks).toEqual([]);
    expect(sources).toEqual([]);
  });

  it("deduplicates source metadata across multiple chunks from same source", () => {
    const a = src("a");
    const candidates = [chunk(a, 0, 0.9), chunk(a, 1, 0.85)];
    const { sources } = selectContext(candidates, baseSelection);
    expect(sources).toHaveLength(1);
    expect(sources[0]!.sourceId).toBe("a");
  });
});

describe("resolveSelectionConfig", () => {
  it("uses config defaults when no overrides", () => {
    const cfg = loadConfig({
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
      RAG_TOP_K: "8",
      RAG_MAX_CONTEXT_CHUNKS: "5",
      RAG_MAX_CONTEXT_CHARS: "16000",
      RAG_MAX_CHUNKS_PER_SOURCE: "2",
    } as NodeJS.ProcessEnv);
    const sel = resolveSelectionConfig(cfg);
    expect(sel.topK).toBe(8);
    expect(sel.maxContextChunks).toBe(5);
    expect(sel.maxContextChars).toBe(16_000);
    expect(sel.maxChunksPerSource).toBe(2);
    expect(sel.minSimilarity).toBeUndefined();
  });

  it("applies overrides", () => {
    const cfg = loadConfig({
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
    } as NodeJS.ProcessEnv);
    const sel = resolveSelectionConfig(cfg, {
      topK: 20,
      maxContextChunks: 3,
      minSimilarity: 0.7,
    });
    expect(sel.topK).toBe(20);
    expect(sel.maxContextChunks).toBe(3);
    expect(sel.minSimilarity).toBe(0.7);
  });

  it("reads RAG_MIN_SIMILARITY from env", () => {
    const cfg = loadConfig({
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
      RAG_MIN_SIMILARITY: "0.5",
    } as NodeJS.ProcessEnv);
    const sel = resolveSelectionConfig(cfg);
    expect(sel.minSimilarity).toBe(0.5);
  });
});
