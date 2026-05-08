import type { ChatTopic, ResponseLanguage } from "./types.js";

const MEDICAL_REFUSAL: Record<ResponseLanguage, string> = {
  uk: "Я не можу ставити діагноз або підбирати лікування. Можу пояснити загально, як працює скринінг, які є обмеження таких інструментів і чому для рішення потрібна оцінка фахівця.",
  en: "I can't provide a diagnosis or pick treatment. I can explain at a general level how screening works, what its limits are, and why a clinician's assessment is required for any decision.",
};

const MILITARY_REFUSAL: Record<ResponseLanguage, string> = {
  uk: "Я не можу допомагати з тактичними або операційними військовими рішеннями. Можу обговорити це на безпечному рівні: як польові умови, стрес, обмежений зв’язок і cognitive load впливають на дизайн медичних або цифрових інструментів.",
  en: "I can't help with tactical or operational military decisions. I can discuss this at a safe level: how field conditions, stress, limited communications, and cognitive load shape the design of medical or digital tools.",
};

const OUT_OF_SCOPE: Record<ResponseLanguage, string> = {
  uk: "Це питання поза підтримуваними темами Vulcan’s Mind. Я можу допомогти з: AI-автоматизацією, RAG/LLM, психометрикою/скринінгом, психічним здоров’ям під час війни, військовою медициною (на загальному рівні), нейромодуляцією, когнітивною продуктивністю, human–AI взаємодією, або контекстом проєктів Володимира.",
  en: "This question is outside Vulcan's Mind supported domains. I can help with: AI automation, RAG/LLM, psychometrics/screening, wartime mental health, military medicine (at a general level), neuromodulation evidence, cognitive performance, human–AI interaction, or Volodymyr's project context.",
};

export function refusalFor(
  topic: ChatTopic,
  language: ResponseLanguage,
): string | null {
  switch (topic) {
    case "unsafe_medical":
      return MEDICAL_REFUSAL[language];
    case "unsafe_military":
      return MILITARY_REFUSAL[language];
    case "out_of_scope":
      return OUT_OF_SCOPE[language];
    default:
      return null;
  }
}
