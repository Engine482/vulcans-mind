import { describe, it, expect } from "vitest";
import { loadConfig } from "./config.js";

const baseEnv = {
  NODE_ENV: "test",
  PORT: "3001",
  APP_VERSION: "9.9.9",
  ALLOWED_ORIGINS: "https://motornyi.com, http://localhost:5173",
} as NodeJS.ProcessEnv;

describe("loadConfig", () => {
  it("parses defaults and CSV origins", () => {
    const cfg = loadConfig(baseEnv);
    expect(cfg.port).toBe(3001);
    expect(cfg.appVersion).toBe("9.9.9");
    expect(cfg.allowedOrigins).toEqual(["https://motornyi.com", "http://localhost:5173"]);
    expect(cfg.openai.mainModel).toBe("gpt-5-mini");
    expect(cfg.rag.topK).toBe(8);
    expect(cfg.maxMessageLength).toBe(1500);
  });

  it("rejects invalid PORT", () => {
    expect(() => loadConfig({ ...baseEnv, PORT: "not-a-number" })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it("treats empty RAG_MIN_SIMILARITY as undefined", () => {
    const cfg = loadConfig({ ...baseEnv, RAG_MIN_SIMILARITY: "" });
    expect(cfg.rag.minSimilarity).toBeUndefined();
  });

  it("parses RAG_MIN_SIMILARITY when present", () => {
    const cfg = loadConfig({ ...baseEnv, RAG_MIN_SIMILARITY: "0.25" });
    expect(cfg.rag.minSimilarity).toBe(0.25);
  });
});
