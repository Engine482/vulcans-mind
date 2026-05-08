import OpenAI from "openai";
import type { AppConfig } from "../config.js";

export const EMBEDDING_DIMENSION = 1536;

export type EmbeddingResult = {
  embedding: number[];
  inputTokens: number;
  model: string;
};

export interface Embedder {
  readonly model: string;
  embed(text: string): Promise<EmbeddingResult>;
}

export class OpenAIEmbedder implements Embedder {
  readonly model: string;
  private readonly client: OpenAI;

  constructor(config: AppConfig) {
    if (!config.openai.apiKey) {
      throw new Error("OPENAI_API_KEY is required to call the embeddings API");
    }
    this.model = config.openai.embeddingModel;
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
      timeout: config.openai.timeoutMs,
    });
  }

  async embed(text: string): Promise<EmbeddingResult> {
    if (text.length === 0) throw new Error("Cannot embed empty text");
    const res = await this.client.embeddings.create({
      model: this.model,
      input: text,
    });
    const first = res.data[0];
    if (!first) throw new Error("OpenAI embeddings response missing data");
    if (first.embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(
        `Expected ${EMBEDDING_DIMENSION}-d embedding, got ${first.embedding.length}`,
      );
    }
    return {
      embedding: first.embedding,
      inputTokens: res.usage?.prompt_tokens ?? 0,
      model: res.model,
    };
  }
}

export function toPgVector(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
