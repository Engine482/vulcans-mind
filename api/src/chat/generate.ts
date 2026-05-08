import OpenAI from "openai";
import type { AppConfig } from "../config.js";

export type GenerateInput = {
  systemPrompt: string;
  userContent: string;
  model: string;
  temperature: number;
  maxOutputTokens: number;
  timeoutMs: number;
};

export type GenerateResult = {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  finishReason: string;
};

export interface Generator {
  generate(input: GenerateInput): Promise<GenerateResult>;
}

export class OpenAIGenerator implements Generator {
  private readonly client: OpenAI;

  constructor(config: AppConfig) {
    if (!config.openai.apiKey) {
      throw new Error("OPENAI_API_KEY is required for the generator");
    }
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
      timeout: config.openai.timeoutMs,
    });
  }

  async generate(input: GenerateInput): Promise<GenerateResult> {
    const res = await this.client.chat.completions.create({
      model: input.model,
      temperature: input.temperature,
      max_completion_tokens: input.maxOutputTokens,
      messages: [
        { role: "system", content: input.systemPrompt },
        { role: "user", content: input.userContent },
      ],
    });
    const choice = res.choices[0];
    return {
      text: choice?.message?.content ?? "",
      model: res.model,
      inputTokens: res.usage?.prompt_tokens ?? 0,
      outputTokens: res.usage?.completion_tokens ?? 0,
      finishReason: choice?.finish_reason ?? "unknown",
    };
  }
}

export type FallbackInput = {
  generator: Generator;
  config: AppConfig;
  systemPrompt: string;
  userContent: string;
};

export type FallbackOutcome = {
  result: GenerateResult;
  fallbackUsed: boolean;
};

export function isUsableAnswer(text: string): boolean {
  return text.trim().length > 0;
}

/**
 * Try main model once. On thrown error or empty/invalid output, try fallback
 * model exactly once. Cap at 2 generation attempts per request per docs/14.
 */
export async function generateWithFallback({
  generator,
  config,
  systemPrompt,
  userContent,
}: FallbackInput): Promise<FallbackOutcome> {
  const baseInput = {
    systemPrompt,
    userContent,
    temperature: config.openai.temperature,
    maxOutputTokens: config.openai.maxOutputTokens,
    timeoutMs: config.openai.timeoutMs,
  };

  let mainResult: GenerateResult | undefined;
  try {
    mainResult = await generator.generate({
      ...baseInput,
      model: config.openai.mainModel,
    });
    if (isUsableAnswer(mainResult.text)) {
      return { result: mainResult, fallbackUsed: false };
    }
  } catch {
    // fall through to fallback model
  }

  const fallbackResult = await generator.generate({
    ...baseInput,
    model: config.openai.fallbackModel,
  });

  if (!isUsableAnswer(fallbackResult.text)) {
    throw new Error("generation_failed");
  }

  return { result: fallbackResult, fallbackUsed: true };
}
