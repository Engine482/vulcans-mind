import { describe, it, expect } from "vitest";
import { chunkText, DEFAULT_CHUNK_OPTIONS } from "./chunk.js";

describe("chunkText", () => {
  it("returns empty array for empty input", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n\t   ")).toEqual([]);
  });

  it("returns a single chunk when text is short", () => {
    const text = "A short paragraph. Two sentences.";
    const chunks = chunkText(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.index).toBe(0);
    expect(chunks[0]!.content).toBe("A short paragraph. Two sentences.");
    expect(chunks[0]!.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("splits long text into multiple chunks with overlap", () => {
    const para = "Sentence one is here. Sentence two follows. Sentence three concludes. ".repeat(
      80,
    );
    const chunks = chunkText(para, { targetChars: 1000, overlapChars: 200 });
    expect(chunks.length).toBeGreaterThan(2);
    for (const c of chunks) {
      expect(c.content.length).toBeLessThanOrEqual(1400);
      expect(c.content.length).toBeGreaterThan(200);
    }
    expect(chunks.map((c) => c.index)).toEqual(chunks.map((_, i) => i));
  });

  it("prefers paragraph boundaries when available", () => {
    const a = "First paragraph. ".repeat(80);
    const b = "Second paragraph. ".repeat(80);
    const text = `${a}\n\n${b}`;
    const chunks = chunkText(text, { targetChars: 1500, overlapChars: 200 });
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0]!.content.startsWith("First paragraph")).toBe(true);
  });

  it("is deterministic for the same input", () => {
    const text = "Repeating content. ".repeat(500);
    const a = chunkText(text);
    const b = chunkText(text);
    expect(a).toEqual(b);
  });

  it("rejects invalid options", () => {
    expect(() => chunkText("x", { targetChars: 0 })).toThrow();
    expect(() => chunkText("x", { targetChars: 100, overlapChars: 100 })).toThrow();
    expect(() => chunkText("x", { targetChars: 100, overlapChars: 200 })).toThrow();
  });

  it("uses defaults that match docs/06 (3000–4500 chars target)", () => {
    expect(DEFAULT_CHUNK_OPTIONS.targetChars).toBeGreaterThanOrEqual(3000);
    expect(DEFAULT_CHUNK_OPTIONS.targetChars).toBeLessThanOrEqual(4500);
    expect(DEFAULT_CHUNK_OPTIONS.overlapChars).toBeGreaterThanOrEqual(500);
    expect(DEFAULT_CHUNK_OPTIONS.overlapChars).toBeLessThanOrEqual(900);
  });
});
