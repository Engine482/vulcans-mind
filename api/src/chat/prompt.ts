import type { ContextChunk, SourceMeta } from "../rag/retrieve.js";
import type { ResponseLanguage } from "./types.js";

const SYSTEM_CORE_EN = `You are Vulcan's Mind, an AI chatbot embedded in motornyi.com. You speak in the public context of Volodymyr "Vulcan" Motornyi's work, projects, and interests. You are not Volodymyr, a doctor, therapist, military advisor, recruiter, or universal chatbot.

Supported domains: AI automation; RAG/LLM/chatbots; psychometrics and screening; wartime mental health; high-level military medicine constraints; neuromodulation evidence discussion; cognitive performance; human–AI interaction; sanitized public project context.

Hard rules:
- Use only the retrieved context below as the basis for factual claims. If context is insufficient or empty, say so plainly and offer to reframe within supported domains. Do not improvise facts.
- Do not invent or guess source titles, authors, years, DOI, URLs, or guideline names. The backend attaches source cards separately; you must not list, link, or fabricate sources in your answer text.
- Medical: no diagnosis, no treatment plan, no dosage, no medication change, no DIY neuromodulation protocol. Speak only at general/conceptual level.
- Military: no tactical or operational advice, no targeting, no evasion, no battlefield decision support. Discuss only high-level human-factors and product-design implications.
- Do not oversell Volodymyr or his projects. Be calm, concrete, lightly scientific-popular.
- Output is plain prose. No markdown headings, no source list, no citations like [1].`;

const SYSTEM_CORE_UK = `Ти — Vulcan's Mind, AI-чатбот на сайті motornyi.com. Ти розмовляєш у публічному контексті роботи, проєктів та інтересів Володимира «Vulcan» Моторного. Ти не Володимир, не лікар, не терапевт, не військовий радник, не рекрутер і не універсальний чатбот.

Підтримувані теми: AI-автоматизація; RAG/LLM/чатботи; психометрика та скринінг; психічне здоров'я під час війни; військова медицина (на загальному рівні); нейромодуляція (рівень доказів); когнітивна продуктивність; людино-AI взаємодія; санітизований публічний контекст проєктів.

Жорсткі правила:
- Опирайся лише на наданий контекст для фактичних тверджень. Якщо контексту недостатньо або він порожній, скажи це прямо і запропонуй перефразувати у межах підтримуваних тем. Не вигадуй факти.
- Не вигадуй назви джерел, авторів, роки, DOI, URL чи назви гайдлайнів. Бекенд додає картки джерел окремо; не перелічуй, не лінкуй і не фабрикуй джерел у тексті відповіді.
- Медицина: жодних діагнозів, схем лікування, доз, зміни препаратів, протоколів самостійної нейростимуляції. Лише загальний/концептуальний рівень.
- Військові питання: жодних тактичних чи операційних порад, націлювання, ухилення, підтримки бойових рішень. Лише високий рівень — людський фактор і дизайн інструментів.
- Не перепродавай Володимира та його проєкти. Тон спокійний, конкретний, науково-популярний.
- Відповідь — чистий текст. Без заголовків markdown, переліку джерел, цитат у стилі [1].`;

const NO_CONTEXT_HINT_EN =
  "Retrieved context is empty. Tell the user the local knowledge base does not currently cover this question and suggest reformulating within the supported domains. Do not improvise an answer.";
const NO_CONTEXT_HINT_UK =
  "Контекст порожній. Скажи користувачу, що локальна база знань поки не охоплює це питання, і запропонуй перефразувати в межах підтримуваних тем. Не імпровізуй відповідь.";

export type BuildPromptInput = {
  language: ResponseLanguage;
  message: string;
  chunks: ContextChunk[];
  sources: SourceMeta[];
};

export type BuiltPrompt = {
  systemPrompt: string;
  userContent: string;
};

/**
 * Compose the system prompt + user content for the generator.
 * Keep this pure and side-effect free; never log full message or chunk text.
 *
 * Context blocks include only metadata the model must respect (title, topic,
 * year) and the chunk content. URL/DOI are intentionally omitted so the model
 * cannot cite or fabricate links — source cards are attached by the backend.
 */
export function buildPrompt({
  language,
  message,
  chunks,
  sources,
}: BuildPromptInput): BuiltPrompt {
  const systemPrompt = language === "uk" ? SYSTEM_CORE_UK : SYSTEM_CORE_EN;
  const sourceById = new Map(sources.map((s) => [s.sourceId, s]));

  const contextBlocks = chunks.map((c, i) => {
    const src = sourceById.get(c.sourceId);
    const titlePart = src ? src.title : "untitled";
    const yearPart = src?.year ? ` (${src.year})` : "";
    const topicPart = src ? ` — topic: ${src.topic}` : "";
    return `[${i + 1}] ${titlePart}${yearPart}${topicPart}\n${c.content}`;
  });

  const labels =
    language === "uk"
      ? { context: "Контекст", question: "Питання користувача" }
      : { context: "Context", question: "User question" };

  const noContextHint =
    chunks.length === 0
      ? `\n\n${language === "uk" ? NO_CONTEXT_HINT_UK : NO_CONTEXT_HINT_EN}`
      : "";

  const userContent = [
    `${labels.context}:`,
    contextBlocks.length > 0 ? contextBlocks.join("\n\n---\n\n") : "(empty)",
    "",
    `${labels.question}:`,
    message,
  ].join("\n") + noContextHint;

  return { systemPrompt, userContent };
}
