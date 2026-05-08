import type { AppConfig } from "../config.js";
import type { Retriever } from "../rag/retrieve.js";
import { classify } from "./classify.js";
import { buildMockAnswer } from "./mock.js";
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
};

export class ChatService {
  constructor(private readonly deps: ChatServiceDeps) {}

  async handle(input: ChatHandleInput): Promise<ChatHandleOutcome> {
    const { topic, language } = classify(input.message, input.language);
    const refusal = refusalFor(topic, language);
    if (refusal !== null) {
      return {
        response: {
          answer: refusal,
          sources: [],
          meta: {
            requestId: input.requestId,
            topic,
            model: MOCK_MODEL_TAG,
            fallbackUsed: false,
            retrievalCount: 0,
            responseLanguage: language,
          },
        },
        topic,
        language,
        retrievalCount: 0,
        retrievedSourceIds: [],
        retrievalDurationMs: null,
        refusalIssued: true,
      };
    }

    let sources: ChatSourceCard[] = [];
    let retrievalCount = 0;
    let retrievedSourceIds: string[] = [];
    let retrievalDurationMs: number | null = null;
    const retrievalEnabled = this.deps.retriever !== undefined;

    if (this.deps.retriever) {
      const t0 = Date.now();
      const result = await this.deps.retriever.retrieve(input.message);
      retrievalDurationMs = Date.now() - t0;
      retrievalCount = result.chunks.length;
      retrievedSourceIds = result.sources.map((s) => s.externalId);
      sources = toSourceCards(result.sources);
    }

    const answer = buildMockAnswer({ language, sources, retrievalEnabled });

    return {
      response: {
        answer,
        sources,
        meta: {
          requestId: input.requestId,
          topic,
          model: MOCK_MODEL_TAG,
          fallbackUsed: false,
          retrievalCount,
          responseLanguage: language,
        },
      },
      topic,
      language,
      retrievalCount,
      retrievedSourceIds,
      retrievalDurationMs,
      refusalIssued: false,
    };
  }
}
