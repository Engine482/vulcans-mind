import type { ChatTopic, ResponseLanguage } from "./types.js";

const MEDICAL_REFUSAL: Record<ResponseLanguage, string> = {
  uk: "Я не можу оцінювати індивідуальний стан, ставити діагноз або радити лікування. Але можу пояснити загальні принципи цифрового скринінгу, психометрики, ментального здоров'я або те, як AI може допомагати фахівцям без заміни професійної допомоги.",
  en: "I can't assess an individual state, give a diagnosis, or recommend treatment. I can explain general principles of digital screening, psychometrics, mental health, or how AI can support clinicians without replacing professional care.",
};

const MILITARY_REFUSAL: Record<ResponseLanguage, string> = {
  uk: "Я не можу допомагати з тактичними або операційними військовими рішеннями. Можу обговорити це безпечно: як польові умови, стрес, обмежений зв'язок і cognitive load впливають на дизайн медичних або цифрових інструментів.",
  en: "I can't help with tactical or operational military decisions. I can discuss this at a safe level: how field conditions, stress, limited communications, and cognitive load shape the design of medical or digital tools.",
};

const OUT_OF_SCOPE: Record<ResponseLanguage, string> = {
  uk: "Це трохи поза моєю основною базою. Я найкраще працюю з темами AI-автоматизації, RAG/LLM, психометрики, цифрового скринінгу станів, охорони ментального здоров'я, військового контексту і проєктів Володимира. Можу або відповісти дуже загально, або допомогти переформулювати питання ближче до цих тем.",
  en: "This is a bit outside my main domain. I work best with AI automation, RAG/LLM, psychometrics, digital screening, mental health, the military context of digital tools, and Volodymyr's projects. I can answer at a very general level, or help reframe the question closer to those topics.",
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
