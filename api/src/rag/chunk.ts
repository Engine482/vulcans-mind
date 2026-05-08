import { createHash } from "node:crypto";

/**
 * Default chunking parameters. Per docs/06_RAG_DESIGN.md:
 * 3000–4500 chars with 500–900 char overlap.
 */
export const DEFAULT_CHUNK_OPTIONS = {
  targetChars: 3500,
  overlapChars: 700,
  minChars: 200,
} as const;

export type ChunkOptions = {
  targetChars?: number;
  overlapChars?: number;
  minChars?: number;
};

export type Chunk = {
  index: number;
  content: string;
  contentHash: string;
};

/**
 * Split text into chunks of ~targetChars with overlap, preferring paragraph
 * and sentence boundaries within `slack` of the target length. Pure function;
 * no I/O. Deterministic for a given input.
 */
export function chunkText(rawText: string, options: ChunkOptions = {}): Chunk[] {
  const target = options.targetChars ?? DEFAULT_CHUNK_OPTIONS.targetChars;
  const overlap = options.overlapChars ?? DEFAULT_CHUNK_OPTIONS.overlapChars;
  const minChars = options.minChars ?? DEFAULT_CHUNK_OPTIONS.minChars;

  if (target <= 0) throw new Error("targetChars must be > 0");
  if (overlap < 0 || overlap >= target) throw new Error("overlapChars must be in [0, targetChars)");

  const text = normalizeWhitespace(rawText);
  if (text.length === 0) return [];
  if (text.length <= target) {
    return [{ index: 0, content: text, contentHash: hash(text) }];
  }

  const chunks: Chunk[] = [];
  const slack = Math.min(400, Math.floor(target * 0.15));
  let start = 0;
  let index = 0;

  while (start < text.length) {
    const idealEnd = Math.min(start + target, text.length);
    const end =
      idealEnd === text.length ? idealEnd : findBoundary(text, idealEnd, slack);

    const piece = text.slice(start, end).trim();
    if (piece.length >= minChars || end === text.length) {
      chunks.push({ index, content: piece, contentHash: hash(piece) });
      index += 1;
    }

    if (end === text.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}

function findBoundary(text: string, ideal: number, slack: number): number {
  const min = Math.max(0, ideal - slack);
  const max = Math.min(text.length, ideal + slack);
  const window = text.slice(min, max);

  const paragraphIdx = window.lastIndexOf("\n\n");
  if (paragraphIdx !== -1) return min + paragraphIdx + 2;

  const sentenceIdx = lastSentenceBoundary(window);
  if (sentenceIdx !== -1) return min + sentenceIdx + 1;

  const newlineIdx = window.lastIndexOf("\n");
  if (newlineIdx !== -1) return min + newlineIdx + 1;

  const spaceIdx = window.lastIndexOf(" ");
  if (spaceIdx !== -1) return min + spaceIdx + 1;

  return ideal;
}

function lastSentenceBoundary(s: string): number {
  for (let i = s.length - 1; i >= 0; i -= 1) {
    const ch = s[i];
    if ((ch === "." || ch === "!" || ch === "?") && (i + 1 === s.length || s[i + 1] === " ")) {
      return i;
    }
  }
  return -1;
}

function hash(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}
