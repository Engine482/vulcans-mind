import type { AppConfig } from "../config.js";
import type {
  ContextChunk,
  Retriever,
  SourceMeta,
} from "../rag/retrieve.js";
import { classify } from "./classify.js";
import {
  generateWithFallback,
  type Generator,
  isUsableAnswer,
} from "./generate.js";
import { buildMockAnswer } from "./mock.js";
import { buildPrompt } from "./prompt.js";
import { refusalFor } from "./refusals.js";
import {
  toSourceCards,
  type ChatRequest,
  type ChatResponse,
  type ChatSourceCard,
  type ChatTopic,
  type ResponseLanguage,
} from "./types.js";

export const MOCK_MODEL_TAG = "mock-s7";

export type ChatServiceDeps = {
  config: AppConfig;
  retriever?: Retriever;
  generator?: Generator;
};

export type ChatHandleInput = ChatRequest & { requestId: string };

export type ChatHandleOutcome = {
  response: ChatResponse;
  topic: ChatTopic;
  language: ResponseLanguage;
  retrievalCount: number;
  retrievedSourceIds: string[];
  retrievalDurationMs: number | null;
  refusalIssued: boolean;
  generationDurationMs: number | null;
  inputTokens: number;
  outputTokens: number;
};

const WEAK_RETRIEVAL: Record<ResponseLanguage, string> = {
  uk: "У локальній базі знань зараз немає підходящих джерел для цього запиту. Спробуйте сформулювати інакше або обрати одну з підтримуваних тем.",
  en: "The local knowledge base does not have relevant sources for this query right now. Try rephrasing or picking one of the supported domains.",
};

export class ChatService {
  constructor(private readonly deps: ChatServiceDeps) {}

  async handle(input: ChatHandleInput): Promise<ChatHandleOutcome> {
    const { topic, language } = classify(input.message, input.language);
    const refusal = refusalFor(topic, language);
    if (refusal !== null) {
      return makeOutcome({
        requestId: input.requestId,
        topic,
        language,
        answer: refusal,
        sources: [],
        model: MOCK_MODEL_TAG,
        fallbackUsed: false,
        retrievalCount: 0,
        retrievedSourceIds: [],
        retrievalDurationMs: null,
        refusalIssued: true,
        generationDurationMs: null,
        inputTokens: 0,
        outputTokens: 0,
      });
    }

    let sources: ChatSourceCard[] = [];
    let retrievalCount = 0;
    let retrievedSourceIds: string[] = [];
    let retrievalDurationMs: number | null = null;
    let retrievedSourceMetas: SourceMeta[] = [];
    let chunks: ContextChunk[] = [];
    const retrievalEnabled = this.deps.retriever !== undefined;

    if (this.deps.retriever) {
      const t0 = Date.now();
      const result = await this.deps.retriever.retrieve(input.message);
      retrievalDurationMs = Date.now() - t0;
      retrievalCount = result.chunks.length;
      retrievedSourceIds = result.sources.map((s) => s.externalId);
      retrievedSourceMetas = result.sources;
      chunks = result.chunks;
      sources = toSourceCards(result.sources);
    }

    // Generator branch — only when retrieval found grounded chunks.
    if (this.deps.generator && retrievalCount > 0) {
      const { systemPrompt, userContent } = buildPrompt({
        language,
        message: input.message,
        chunks,
        sources: retrievedSourceMetas,
      });
      const tg0 = Date.now();
      try {
        const { result, fallbackUsed } = await generateWithFallback({
          generator: this.deps.generator,
          config: this.deps.config,
          systemPrompt,
          userContent,
        });
        return makeOutcome({
          requestId: input.requestId,
          topic,
          language,
          answer: result.text.trim(),
          sources,
          model: result.model,
          fallbackUsed,
          retrievalCount,
          retrievedSourceIds,
          retrievalDurationMs,
          refusalIssued: false,
          generationDurationMs: Date.now() - tg0,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
        });
      } catch (err) {
        // Bubble up — route layer translates to 503 and writes error metric.
        throw err instanceof Error ? err : new Error(String(err));
      }
    }

    // Generator branch without grounded chunks: honest no-answer.
    if (this.deps.generator && retrievalCount === 0) {
      return makeOutcome({
        requestId: input.requestId,
        topic,
        language,
        answer: WEAK_RETRIEVAL[language],
        sources: [],
        model: this.deps.config.openai.mainModel,
        fallbackUsed: false,
        retrievalCount: 0,
        retrievedSourceIds: [],
        retrievalDurationMs,
        refusalIssued: false,
        generationDurationMs: null,
        inputTokens: 0,
        outputTokens: 0,
      });
    }

    // Mock-mode (no generator configured): preserve S7 behavior.
    const answer = buildMockAnswer({ language, sources, retrievalEnabled });
    void chunks;
    void retrievedSourceMetas;
    return makeOutcome({
      requestId: input.requestId,
      topic,
      language,
      answer,
      sources,
      model: MOCK_MODEL_TAG,
      fallbackUsed: false,
      retrievalCount,
      retrievedSourceIds,
      retrievalDurationMs,
      refusalIssued: false,
      generationDurationMs: null,
      inputTokens: 0,
      outputTokens: 0,
    });
  }
}

function makeOutcome(args: {
  requestId: string;
  topic: ChatTopic;
  language: ResponseLanguage;
  answer: string;
  sources: ChatSourceCard[];
  model: string;
  fallbackUsed: boolean;
  retrievalCount: number;
  retrievedSourceIds: string[];
  retrievalDurationMs: number | null;
  refusalIssued: boolean;
  generationDurationMs: number | null;
  inputTokens: number;
  outputTokens: number;
}): ChatHandleOutcome {
  return {
    response: {
      answer: args.answer,
      sources: args.sources,
      meta: {
        requestId: args.requestId,
        topic: args.topic,
        model: args.model,
        fallbackUsed: args.fallbackUsed,
        retrievalCount: args.retrievalCount,
        responseLanguage: args.language,
      },
    },
    topic: args.topic,
    language: args.language,
    retrievalCount: args.retrievalCount,
    retrievedSourceIds: args.retrievedSourceIds,
    retrievalDurationMs: args.retrievalDurationMs,
    refusalIssued: args.refusalIssued,
    generationDurationMs: args.generationDurationMs,
    inputTokens: args.inputTokens,
    outputTokens: args.outputTokens,
  };
}

export { isUsableAnswer };
