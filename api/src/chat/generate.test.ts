import { describe, it, expect } from "vitest";
import {
  generateWithFallback,
  isUsableAnswer,
  type GenerateInput,
  type GenerateResult,
  type Generator,
} from "./generate.js";
import { loadConfig } from "../config.js";

const cfg = loadConfig({
  NODE_ENV: "test",
  LOG_LEVEL: "silent",
  OPENAI_MAIN_MODEL: "main-model",
  OPENAI_FALLBACK_MODEL: "fallback-model",
} as NodeJS.ProcessEnv);

function fakeGenerator(
  impl: (input: GenerateInput, callIndex: number) => Promise<GenerateResult>,
): { generator: Generator; calls: GenerateInput[] } {
  const calls: GenerateInput[] = [];
  const generator: Generator = {
    async generate(input) {
      const idx = calls.length;
      calls.push(input);
      return impl(input, idx);
    },
  };
  return { generator, calls };
}

describe("isUsableAnswer", () => {
  it("rejects empty/whitespace text", () => {
    expect(isUsableAnswer("")).toBe(false);
    expect(isUsableAnswer("   ")).toBe(false);
    expect(isUsableAnswer("\n\t")).toBe(false);
  });

  it("accepts non-empty text", () => {
    expect(isUsableAnswer("ok")).toBe(true);
  });
});

describe("generateWithFallback", () => {
  it("returns main result without invoking fallback when main produces text", async () => {
    const { generator, calls } = fakeGenerator(async (input) => ({
      text: "main answer",
      model: input.model,
      inputTokens: 10,
      outputTokens: 5,
      finishReason: "stop",
    }));

    const out = await generateWithFallback({
      generator,
      config: cfg,
      systemPrompt: "sys",
      userContent: "hello",
    });

    expect(out.fallbackUsed).toBe(false);
    expect(out.result.text).toBe("main answer");
    expect(calls).toHaveLength(1);
    expect(calls[0]!.model).toBe("main-model");
  });

  it("falls back exactly once when main throws", async () => {
    const { generator, calls } = fakeGenerator(async (input, idx) => {
      if (idx === 0) throw new Error("rate limited");
      return {
        text: "fallback answer",
        model: input.model,
        inputTokens: 12,
        outputTokens: 6,
        finishReason: "stop",
      };
    });

    const out = await generateWithFallback({
      generator,
      config: cfg,
      systemPrompt: "sys",
      userContent: "hello",
    });

    expect(out.fallbackUsed).toBe(true);
    expect(out.result.text).toBe("fallback answer");
    expect(calls.map((c) => c.model)).toEqual(["main-model", "fallback-model"]);
  });

  it("falls back when main returns empty/whitespace text", async () => {
    const { generator, calls } = fakeGenerator(async (input, idx) => ({
      text: idx === 0 ? "   " : "fallback content",
      model: input.model,
      inputTokens: 5,
      outputTokens: idx === 0 ? 0 : 3,
      finishReason: "stop",
    }));

    const out = await generateWithFallback({
      generator,
      config: cfg,
      systemPrompt: "sys",
      userContent: "hello",
    });

    expect(out.fallbackUsed).toBe(true);
    expect(calls).toHaveLength(2);
  });

  it("throws generation_failed when both models fail to produce text", async () => {
    const { generator, calls } = fakeGenerator(async () => {
      throw new Error("api down");
    });
    await expect(
      generateWithFallback({
        generator,
        config: cfg,
        systemPrompt: "sys",
        userContent: "hello",
      }),
    ).rejects.toThrow();
    expect(calls).toHaveLength(2);
  });

  it("never makes a third attempt", async () => {
    const { generator, calls } = fakeGenerator(async (input) => ({
      text: "",
      model: input.model,
      inputTokens: 0,
      outputTokens: 0,
      finishReason: "length",
    }));
    await expect(
      generateWithFallback({
        generator,
        config: cfg,
        systemPrompt: "sys",
        userContent: "hello",
      }),
    ).rejects.toThrow();
    expect(calls).toHaveLength(2);
  });
});
