import type { ChatSourceCard, ResponseLanguage } from "./types.js";

const NOTICE: Record<ResponseLanguage, string> = {
  uk: "[MOCK] Цей бекенд поки відповідає у тестовому режимі без виклику реальної моделі. Реальна генерація з’явиться в Sprint 8.",
  en: "[MOCK] This backend is currently in test mode without real model calls. Real generation arrives in Sprint 8.",
};

const WITH_SOURCES: Record<ResponseLanguage, (n: number) => string> = {
  uk: (n) =>
    `Запит оброблено локальним пошуком; знайдено ${n} релевантних джерел у базі знань.`,
  en: (n) =>
    `Local retrieval found ${n} relevant source(s) in the knowledge base.`,
};

const NO_SOURCES: Record<ResponseLanguage, string> = {
  uk: "У локальній базі знань зараз немає підходящих джерел для цього запиту. Спробуйте сформулювати інакше або уточнити.",
  en: "The local knowledge base does not have relevant sources for this query right now. Try rephrasing or narrowing the question.",
};

const RETRIEVAL_DISABLED: Record<ResponseLanguage, string> = {
  uk: "Пошук у базі знань тимчасово недоступний (немає DATABASE_URL або OPENAI_API_KEY). Це очікувано на цьому етапі розробки.",
  en: "Knowledge base retrieval is temporarily disabled (DATABASE_URL or OPENAI_API_KEY missing). This is expected at the current dev stage.",
};

export type MockAnswerInput = {
  language: ResponseLanguage;
  sources: ChatSourceCard[];
  retrievalEnabled: boolean;
};

/**
 * Build a deterministic mock answer for Sprint 7. The generated text never
 * echoes the user message and never quotes retrieved chunk content. Only
 * source titles are referenced — those are public metadata.
 */
export function buildMockAnswer({
  language,
  sources,
  retrievalEnabled,
}: MockAnswerInput): string {
  const parts: string[] = [NOTICE[language]];

  if (!retrievalEnabled) {
    parts.push(RETRIEVAL_DISABLED[language]);
    return parts.join("\n\n");
  }

  if (sources.length === 0) {
    parts.push(NO_SOURCES[language]);
    return parts.join("\n\n");
  }

  parts.push(WITH_SOURCES[language](sources.length));
  const titles = sources.map((s, i) => `${i + 1}. ${s.title}`).join("\n");
  parts.push(titles);
  return parts.join("\n\n");
}
