import type { SourceMeta } from "../rag/retrieve.js";

export type ChatLanguage = "uk" | "en" | "auto";
export type ResponseLanguage = "uk" | "en";

export type ChatRequest = {
  message: string;
  sessionId?: string;
  language?: ChatLanguage;
};

export type ChatTopic =
  | "ai_automation"
  | "rag_llm_chatbots"
  | "psychometrics_screening"
  | "wartime_mental_health"
  | "military_medicine"
  | "neuromodulation"
  | "cognitive_performance_learning"
  | "human_ai_interaction"
  | "volodymyr_projects_context"
  | "out_of_scope"
  | "unsafe_medical"
  | "unsafe_military";

export type Classification = {
  topic: ChatTopic;
  language: ResponseLanguage;
};

export type ChatSourceCard = {
  id: string;
  title: string;
  authors: string | null;
  year: number | null;
  url: string | null;
  doi: string | null;
  sourceType: string;
  topic: string;
};

export type ChatMeta = {
  requestId: string;
  topic: ChatTopic;
  model: string;
  fallbackUsed: boolean;
  retrievalCount: number;
  responseLanguage: ResponseLanguage;
};

export type ChatResponse = {
  answer: string;
  sources: ChatSourceCard[];
  meta: ChatMeta;
};

export function toSourceCards(sources: SourceMeta[]): ChatSourceCard[] {
  return sources.map((s) => ({
    id: s.externalId,
    title: s.title,
    authors: s.authors,
    year: s.year,
    url: s.url,
    doi: s.doi,
    sourceType: s.sourceType,
    topic: s.topic,
  }));
}
