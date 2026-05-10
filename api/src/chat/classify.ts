import type {
  ChatLanguage,
  ChatTopic,
  Classification,
  ResponseLanguage,
} from "./types.js";

const CYRILLIC_RE = /[Ѐ-ӿ]/;

export function detectLanguage(
  message: string,
  hint: ChatLanguage = "auto",
): ResponseLanguage {
  if (hint === "uk" || hint === "en") return hint;
  return CYRILLIC_RE.test(message) ? "uk" : "en";
}

/**
 * Rule-based classifier (P0). Order matters: unsafe checks run before topic
 * matching so a "What's my PTSD diagnosis?" question routes to unsafe_medical
 * even though it mentions a wartime mental health topic.
 *
 * Pure function. No I/O, no logging. The caller must NOT log the message.
 */
export function classify(
  message: string,
  hint: ChatLanguage = "auto",
): Classification {
  const language = detectLanguage(message, hint);
  const text = message.toLowerCase();

  if (matchesUnsafeMedical(text)) return { topic: "unsafe_medical", language };
  if (matchesUnsafeMilitary(text)) return { topic: "unsafe_military", language };

  const topic = matchTopic(text);
  return { topic, language };
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((re) => re.test(text));
}

function matchesUnsafeMedical(text: string): boolean {
  return matchesAny(text, [
    /\bdo i have\b/,
    /\bdiagnose me\b/,
    /\bself[- ]?diagnos/,
    /\b(dose|dosage|mg per|prescrib|medication change|stop taking|taper)\b/,
    /\bshould i stop\b/,
    /\bdiy\s+(tdcs|rtms|tms)\b/,
    /\b(tdcs|rtms|tms)\s+(protocol|montage|current|setup|how to)/,
    /чи (в мене|у мене)\s+(птср|депрес|тривож|діагноз)/,
    /у\s+мене\s+(симптом|ознак).*?(\.|\?).*\bце\b/,
    /(це|чи це)\s+(птср|депрес|тривожн|панічн)/,
    /постав(ь|ити)?\s+(мені\s+)?діагноз/,
    /самостійн[аеоиі]+\s+(нейростимуляц|тдкс|tdcs)/,
    /\b(tdcs|rtms|tms)\s+протокол/,
    /протокол\s+(tdcs|rtms|tms)/,
    /яку\s+дозу/,
    /(збільшити|зменшити|відмінити)\s+(дозу|препарат|таблет)/,
  ]);
}

function matchesUnsafeMilitary(text: string): boolean {
  return matchesAny(text, [
    /\b(targeting|target acquisition|fire mission|kill chain)\b/,
    /\b(evasion|evade|exfil|exfiltrat)\b/,
    /\btactical (plan|operation|movement|medevac under fire)\b/,
    /\bdrone (strike|attack|targeting|optim)\b/,
    /\boptimi[sz]e\s+a?\s*(drone\s+strike|weapon|fire|targeting)/,
    /таргет(инг|увати)/,
    /тактичн(ий|ого|у)\s+(план|маневр|удар|медевак)/,
    /(евакуац|медевак)\s+(під\s+(вогн|обстріл))/,
    /(удар|атак)\s+(дрон|fpv)/,
    /оптимізаці[яї]\s+(зброї|ураження)/,
    /(обійти|обходити|оминути)\s+(спостережен|розвідк|дозор|противник)/,
  ]);
}

const TOPIC_PATTERNS: Array<{ topic: ChatTopic; patterns: RegExp[] }> = [
  {
    topic: "volodymyr_projects_context",
    patterns: [
      /\b(vulcan'?s? mind|vulcan_mind|motornyi|lusterko|imenuy)\b/,
      /люстерк/,
      /іменуй\s+мене/,
      /волод(имир|и|імир)/,
      /мотор(ний|ного|ним|ні)/,
      /вулкан/,
      /vulcan/,
    ],
  },
  {
    topic: "rag_llm_chatbots",
    patterns: [
      /\b(rag|retrieval[- ]augmented|llm|prompt|embedding|vector\s+(db|search)|chatbot)\b/,
      /чат[- ]?бот|чатбот/,
      /(векторн|ембеддинг|ретрив)/,
    ],
  },
  {
    topic: "ai_automation",
    patterns: [
      /\b(ai\s+automation|automation|workflow|agentic|orchestrat)\b/,
      /(автоматизац|агентн)/,
    ],
  },
  {
    topic: "wartime_mental_health",
    patterns: [
      /\b(ptsd|combat stress|wartime|mental health|mental[- ]?wellbeing)\b/,
      /(птср|психічн[еого]+\s+здоров|війн|бойов(ий|а)\s+стрес)/,
      /менталь(не|ного|ним|ним|ні|ному)?(\s+здоров)?/,
      /охорон[аиу]\s+ментальн/,
    ],
  },
  {
    topic: "psychometrics_screening",
    patterns: [
      /\b(phq[- ]?9|gad[- ]?7|pcl[- ]?5|psychometric|screening|likert|validity)\b/,
      /(скринінг|опитувальник|психометр|валідн)/,
    ],
  },
  {
    topic: "military_medicine",
    patterns: [
      /\b(military medicine|battlefield medic|tccc|combat casualty)\b/,
      /(військов[аоі]+\s+медицин|тссс|польов[аоі]+\s+медицин)/,
    ],
  },
  {
    topic: "neuromodulation",
    patterns: [
      /\b(tdcs|rtms|tms|neuromodulation|transcranial)\b/,
      /(нейромодуляц|нейростим|транскраніальн)/,
    ],
  },
  {
    topic: "cognitive_performance_learning",
    patterns: [
      /\b(cognitive (performance|load)|attention|working memory|learning|spaced repetition|executive function)\b/,
      /(когнітивн|когнітивн[еого]+\s+навантаж|увага|пам'ять|навчанн|інтервальн)/,
    ],
  },
  {
    topic: "human_ai_interaction",
    patterns: [
      /\b(human[- ]ai|hci|user experience\s+with\s+ai|ai ux|conversational ux)\b/,
      /(людино[- ]ai|UX\s+штучного|взаємодія\s+з\s+(ai|штучн))/,
    ],
  },
];

function matchTopic(text: string): ChatTopic {
  for (const { topic, patterns } of TOPIC_PATTERNS) {
    if (matchesAny(text, patterns)) return topic;
  }
  return "out_of_scope";
}
