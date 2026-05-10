import { describe, it, expect } from "vitest";
import { buildPrompt } from "./prompt.js";
import type { ContextChunk, SourceMeta } from "../rag/retrieve.js";

const sourceA: SourceMeta = {
  sourceId: "uuid-a",
  externalId: "src-a",
  title: "RAG Foundations",
  authors: "Author A",
  year: 2023,
  topic: "rag_llm_chatbots",
  sourceType: "research_article",
  url: "https://example.com/a",
  doi: null,
};

const chunkA: ContextChunk = {
  chunkId: "c1",
  sourceId: "uuid-a",
  sourceExternalId: "src-a",
  sourceDocumentId: "doc1",
  chunkIndex: 0,
  content: "Retrieval-augmented generation grounds LLM output in retrieved passages.",
  similarity: 0.9,
};

describe("buildPrompt — system core", () => {
  it("uses Ukrainian system core for uk language", () => {
    const out = buildPrompt({
      language: "uk",
      message: "Що таке RAG?",
      chunks: [chunkA],
      sources: [sourceA],
    });
    expect(out.systemPrompt).toContain("Vulcan's Mind");
    expect(out.systemPrompt).toContain("Фактичність");
    expect(out.systemPrompt).toContain("не вигадуй");
  });

  it("uses English system core for en language", () => {
    const out = buildPrompt({
      language: "en",
      message: "What is RAG?",
      chunks: [chunkA],
      sources: [sourceA],
    });
    expect(out.systemPrompt).toContain("Factuality");
    expect(out.systemPrompt).toContain("do not invent");
    expect(out.systemPrompt).toContain("source attribution");
  });

  it("never instructs the model to emit citations or source lists", () => {
    const out = buildPrompt({
      language: "en",
      message: "x",
      chunks: [chunkA],
      sources: [sourceA],
    });
    expect(out.systemPrompt).toContain("do not output a separate sources block");
    expect(out.systemPrompt).toContain("[1]");
  });
});

describe("buildPrompt — context block", () => {
  it("includes title, year, topic, and chunk content but never URL or DOI", () => {
    const out = buildPrompt({
      language: "en",
      message: "What is RAG?",
      chunks: [chunkA],
      sources: [sourceA],
    });
    expect(out.userContent).toContain("[1] RAG Foundations (2023) — topic: rag_llm_chatbots");
    expect(out.userContent).toContain(chunkA.content);
    expect(out.userContent).not.toContain("https://example.com/a");
    expect(out.userContent).not.toContain("doi");
  });

  it("numbers chunks sequentially and joins with separators", () => {
    const c2: ContextChunk = {
      ...chunkA,
      chunkId: "c2",
      chunkIndex: 1,
      content: "Second relevant passage.",
    };
    const out = buildPrompt({
      language: "en",
      message: "x",
      chunks: [chunkA, c2],
      sources: [sourceA],
    });
    expect(out.userContent).toMatch(/\[1\] /);
    expect(out.userContent).toMatch(/\[2\] /);
    expect(out.userContent).toContain("---");
  });

  it("appends an honesty hint when context is empty", () => {
    const en = buildPrompt({
      language: "en",
      message: "What is RAG?",
      chunks: [],
      sources: [],
    });
    expect(en.userContent).toContain("(empty)");
    expect(en.userContent).toContain("Retrieved context is empty");
    expect(en.userContent).toContain("Do not improvise factual claims");

    const uk = buildPrompt({
      language: "uk",
      message: "Що таке RAG?",
      chunks: [],
      sources: [],
    });
    expect(uk.userContent).toContain("Контекст порожній");
    expect(uk.userContent).toContain("Не імпровізуй");
  });

  it("includes the user question verbatim", () => {
    const message = "How does pgvector approximate cosine similarity?";
    const out = buildPrompt({
      language: "en",
      message,
      chunks: [chunkA],
      sources: [sourceA],
    });
    expect(out.userContent).toContain(message);
  });
});
