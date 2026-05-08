import { describe, it, expect } from "vitest";
import { buildMockAnswer } from "./mock.js";
import type { ChatSourceCard } from "./types.js";

const card = (id: string, title: string): ChatSourceCard => ({
  id,
  title,
  authors: null,
  year: null,
  url: null,
  doi: null,
  sourceType: "research_article",
  topic: "rag_llm_chatbots",
});

describe("buildMockAnswer", () => {
  it("notes mock mode and lists source titles when retrieval returns sources", () => {
    const out = buildMockAnswer({
      language: "en",
      retrievalEnabled: true,
      sources: [card("a", "Source A"), card("b", "Source B")],
    });
    expect(out).toContain("[MOCK]");
    expect(out).toContain("found 2 relevant source(s)");
    expect(out).toContain("1. Source A");
    expect(out).toContain("2. Source B");
  });

  it("explains weak retrieval honestly when no sources", () => {
    const out = buildMockAnswer({
      language: "uk",
      retrievalEnabled: true,
      sources: [],
    });
    expect(out).toContain("[MOCK]");
    expect(out).toContain("немає підходящих джерел");
  });

  it("explains retrieval disabled when no DB/OpenAI key", () => {
    const out = buildMockAnswer({
      language: "en",
      retrievalEnabled: false,
      sources: [],
    });
    expect(out).toContain("retrieval is temporarily disabled");
  });

  it("does not echo any user-supplied text — only titles and notice", () => {
    const out = buildMockAnswer({
      language: "en",
      retrievalEnabled: true,
      sources: [card("a", "Title One")],
    });
    expect(out.toLowerCase()).not.toContain("question");
    expect(out.toLowerCase()).not.toContain("user said");
  });
});
