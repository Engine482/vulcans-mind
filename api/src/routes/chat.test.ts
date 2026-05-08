import { describe, it, expect } from "vitest";
import { buildServer } from "../server.js";
import { loadConfig } from "../config.js";
import type { MetricsWriter } from "../chat/metrics.js";
import type { Retriever, RetrievalResult } from "../rag/retrieve.js";

function loadTestConfig(): ReturnType<typeof loadConfig> {
  return loadConfig({
    NODE_ENV: "test",
    LOG_LEVEL: "silent",
    ALLOWED_ORIGINS: "https://motornyi.com",
  } as NodeJS.ProcessEnv);
}

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

describe("POST /api/chat — validation", () => {
  it("rejects missing message with 400", async () => {
    const app = await buildServer(loadTestConfig());
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/chat",
        payload: {},
      });
      expect(res.statusCode).toBe(400);
      expect(res.json()).toMatchObject({ error: "bad_request" });
    } finally {
      await app.close();
    }
  });

  it("rejects empty message with 400", async () => {
    const app = await buildServer(loadTestConfig());
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/chat",
        payload: { message: "   " },
      });
      expect(res.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });

  it("rejects oversized message with 400", async () => {
    const app = await buildServer(loadTestConfig());
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/chat",
        payload: { message: "x".repeat(2000) },
      });
      expect(res.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });

  it("rejects invalid language", async () => {
    const app = await buildServer(loadTestConfig());
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/chat",
        payload: { message: "What is RAG?", language: "fr" },
      });
      expect(res.statusCode).toBe(400);
    } finally {
      await app.close();
    }
  });
});

describe("POST /api/chat — happy path (mock mode)", () => {
  it("returns mock answer with retrieval-disabled notice when no retriever", async () => {
    const app = await buildServer(loadTestConfig());
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/chat",
        payload: { message: "What is RAG?" },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as Record<string, unknown>;
      expect(body.answer).toEqual(expect.stringContaining("[MOCK]"));
      expect(body.sources).toEqual([]);
      const meta = body.meta as Record<string, unknown>;
      expect(meta.topic).toBe("rag_llm_chatbots");
      expect(meta.responseLanguage).toBe("en");
      expect(meta.retrievalCount).toBe(0);
      expect(meta.model).toBe("mock-s7");
      expect(typeof meta.requestId).toBe("string");
    } finally {
      await app.close();
    }
  });

  it("uses retriever when provided and returns sources", async () => {
    const retriever: Retriever = {
      async retrieve() {
        return {
          chunks: [
            {
              chunkId: "c1",
              sourceId: "uuid-a",
              sourceExternalId: "src-a",
              sourceDocumentId: "doc",
              chunkIndex: 0,
              content: "secret chunk text",
              similarity: 0.9,
            },
          ],
          sources: [
            {
              sourceId: "uuid-a",
              externalId: "src-a",
              title: "RAG Foundations",
              authors: "A. Author",
              year: 2024,
              topic: "rag_llm_chatbots",
              sourceType: "research_article",
              url: "https://example.com/a",
              doi: null,
            },
          ],
          candidateCount: 1,
          topSimilarity: 0.9,
          embeddingModel: "text-embedding-3-small",
          inputTokens: 5,
        };
      },
    };
    const app = await buildServer(loadTestConfig(), { chat: { retriever } });
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/chat",
        payload: { message: "What is RAG?" },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { answer: string; sources: unknown[]; meta: Record<string, unknown> };
      expect(body.sources).toHaveLength(1);
      expect(body.meta.retrievalCount).toBe(1);
      expect(body.answer).toContain("RAG Foundations");
      // Privacy: chunk content must never appear in the response.
      expect(body.answer).not.toContain("secret chunk text");
    } finally {
      await app.close();
    }
  });

  it("returns medical refusal without invoking retriever", async () => {
    let called = false;
    const retriever: Retriever = {
      async retrieve() {
        called = true;
        return emptyResult();
      },
    };
    const app = await buildServer(loadTestConfig(), { chat: { retriever } });
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/chat",
        payload: { message: "Do I have PTSD?" },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { meta: Record<string, unknown>; answer: string };
      expect(body.meta.topic).toBe("unsafe_medical");
      expect(body.answer.toLowerCase()).toContain("can't provide a diagnosis");
      expect(called).toBe(false);
    } finally {
      await app.close();
    }
  });
});

describe("POST /api/chat — metrics", () => {
  it("invokes metricsWriter with hashed session id and length-only fields", async () => {
    const captured: unknown[] = [];
    const metricsWriter: MetricsWriter = {
      async write(record) {
        captured.push(record);
      },
    };
    const app = await buildServer(loadTestConfig(), { chat: { metricsWriter } });
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/chat",
        payload: { message: "What is RAG?", sessionId: "anon-xyz" },
      });
      expect(res.statusCode).toBe(200);
      // Wait one microtask for fire-and-forget metrics writer.
      await new Promise((r) => setImmediate(r));
      expect(captured).toHaveLength(1);
      const rec = captured[0] as Record<string, unknown>;
      expect(rec.sessionId).toBe("anon-xyz");
      expect(rec.inputLengthChars).toBe(12);
      expect(typeof rec.outputLengthChars).toBe("number");
      expect(rec.status).toBe("ok");
    } finally {
      await app.close();
    }
  });

  it("records refused status for unsafe topics", async () => {
    const captured: unknown[] = [];
    const metricsWriter: MetricsWriter = {
      async write(record) {
        captured.push(record);
      },
    };
    const app = await buildServer(loadTestConfig(), { chat: { metricsWriter } });
    try {
      await app.inject({
        method: "POST",
        url: "/api/chat",
        payload: { message: "Do I have PTSD?" },
      });
      await new Promise((r) => setImmediate(r));
      expect(captured).toHaveLength(1);
      const rec = captured[0] as Record<string, unknown>;
      expect(rec.status).toBe("refused");
    } finally {
      await app.close();
    }
  });
});
