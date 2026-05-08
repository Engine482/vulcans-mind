import { describe, it, expect } from "vitest";
import { ChatService, MOCK_MODEL_TAG } from "./service.js";
import type {
  Retriever,
  RetrievalResult,
  SourceMeta,
} from "../rag/retrieve.js";
import { loadConfig } from "../config.js";

const cfg = loadConfig({
  NODE_ENV: "test",
  LOG_LEVEL: "silent",
} as NodeJS.ProcessEnv);

function makeRetriever(result: RetrievalResult): Retriever {
  return {
    async retrieve() {
      return result;
    },
  };
}

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

describe("ChatService", () => {
  it("returns a refusal for unsafe medical without calling retriever", async () => {
    let called = false;
    const retriever: Retriever = {
      async retrieve() {
        called = true;
        return emptyResult();
      },
    };
    const svc = new ChatService({ config: cfg, retriever });
    const out = await svc.handle({
      message: "Do I have PTSD?",
      requestId: "req_test_1",
    });
    expect(called).toBe(false);
    expect(out.refusalIssued).toBe(true);
    expect(out.topic).toBe("unsafe_medical");
    expect(out.response.sources).toEqual([]);
    expect(out.response.meta.retrievalCount).toBe(0);
    expect(out.response.meta.model).toBe(MOCK_MODEL_TAG);
  });

  it("returns a refusal for out_of_scope without calling retriever", async () => {
    const svc = new ChatService({
      config: cfg,
      retriever: makeRetriever(emptyResult()),
    });
    const out = await svc.handle({
      message: "What's a good pasta recipe?",
      requestId: "req_test_2",
    });
    expect(out.refusalIssued).toBe(true);
    expect(out.topic).toBe("out_of_scope");
  });

  it("calls retriever for supported topics and returns source cards", async () => {
    const svc = new ChatService({
      config: cfg,
      retriever: makeRetriever({
        chunks: [
          {
            chunkId: "c1",
            sourceId: sourceA.sourceId,
            sourceExternalId: sourceA.externalId,
            sourceDocumentId: "doc1",
            chunkIndex: 0,
            content: "ignored chunk text",
            similarity: 0.9,
          },
        ],
        sources: [sourceA],
        candidateCount: 1,
        topSimilarity: 0.9,
        embeddingModel: "text-embedding-3-small",
        inputTokens: 5,
      }),
    });
    const out = await svc.handle({
      message: "Що таке RAG і чому він важливий?",
      requestId: "req_test_3",
    });
    expect(out.refusalIssued).toBe(false);
    expect(out.topic).toBe("rag_llm_chatbots");
    expect(out.language).toBe("uk");
    expect(out.response.sources).toHaveLength(1);
    expect(out.response.sources[0]!.id).toBe("src-a");
    expect(out.response.sources[0]!.title).toBe("RAG Foundations");
    expect(out.response.meta.retrievalCount).toBe(1);
    expect(out.retrievedSourceIds).toEqual(["src-a"]);
    expect(out.response.answer).toContain("RAG Foundations");
    expect(out.response.answer).not.toContain("ignored chunk text");
  });

  it("returns mock-with-no-retrieval message when retriever is undefined", async () => {
    const svc = new ChatService({ config: cfg });
    const out = await svc.handle({
      message: "What is retrieval-augmented generation?",
      requestId: "req_test_4",
    });
    expect(out.refusalIssued).toBe(false);
    expect(out.topic).toBe("rag_llm_chatbots");
    expect(out.response.sources).toEqual([]);
    expect(out.response.answer.toLowerCase()).toContain(
      "retrieval is temporarily disabled",
    );
  });
});

function emptyResult(): RetrievalResult {
  return {
    chunks: [],
    sources: [],
    candidateCount: 0,
    topSimilarity: null,
    embeddingModel: "text-embedding-3-small",
    inputTokens: 0,
  };
}
