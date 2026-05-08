import { z } from "zod";

const csv = (raw: string | undefined): string[] =>
  (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  APP_VERSION: z.string().default("0.1.0"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),

  DATABASE_URL: z.string().optional(),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MAIN_MODEL: z.string().default("gpt-5-mini"),
  OPENAI_FALLBACK_MODEL: z.string().default("gpt-5.4-mini"),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  OPENAI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(900),
  OPENAI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.3),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),

  RAG_TOP_K: z.coerce.number().int().positive().default(8),
  RAG_MAX_CONTEXT_CHUNKS: z.coerce.number().int().positive().default(5),
  RAG_MAX_CONTEXT_CHARS: z.coerce.number().int().positive().default(16_000),
  RAG_MAX_CHUNKS_PER_SOURCE: z.coerce.number().int().positive().default(2),
  RAG_MIN_SIMILARITY: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? Number(v) : undefined))
    .pipe(z.number().min(0).max(1).optional()),

  ALLOWED_ORIGINS: z.string().default(""),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(600),
  MAX_MESSAGE_LENGTH: z.coerce.number().int().positive().default(1500),
});

export type AppConfig = {
  nodeEnv: "development" | "test" | "production";
  port: number;
  host: string;
  appVersion: string;
  logLevel: string;
  databaseUrl: string | undefined;
  openai: {
    apiKey: string | undefined;
    mainModel: string;
    fallbackModel: string;
    embeddingModel: string;
    maxOutputTokens: number;
    temperature: number;
    timeoutMs: number;
  };
  rag: {
    topK: number;
    maxContextChunks: number;
    maxContextChars: number;
    maxChunksPerSource: number;
    minSimilarity: number | undefined;
  };
  allowedOrigins: string[];
  rateLimit: { max: number; windowSeconds: number };
  maxMessageLength: number;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  const e = parsed.data;
  return {
    nodeEnv: e.NODE_ENV,
    port: e.PORT,
    host: e.HOST,
    appVersion: e.APP_VERSION,
    logLevel: e.LOG_LEVEL,
    databaseUrl: e.DATABASE_URL,
    openai: {
      apiKey: e.OPENAI_API_KEY,
      mainModel: e.OPENAI_MAIN_MODEL,
      fallbackModel: e.OPENAI_FALLBACK_MODEL,
      embeddingModel: e.OPENAI_EMBEDDING_MODEL,
      maxOutputTokens: e.OPENAI_MAX_OUTPUT_TOKENS,
      temperature: e.OPENAI_TEMPERATURE,
      timeoutMs: e.OPENAI_TIMEOUT_MS,
    },
    rag: {
      topK: e.RAG_TOP_K,
      maxContextChunks: e.RAG_MAX_CONTEXT_CHUNKS,
      maxContextChars: e.RAG_MAX_CONTEXT_CHARS,
      maxChunksPerSource: e.RAG_MAX_CHUNKS_PER_SOURCE,
      minSimilarity: e.RAG_MIN_SIMILARITY,
    },
    allowedOrigins: csv(e.ALLOWED_ORIGINS),
    rateLimit: {
      max: e.RATE_LIMIT_MAX_REQUESTS,
      windowSeconds: e.RATE_LIMIT_WINDOW_SECONDS,
    },
    maxMessageLength: e.MAX_MESSAGE_LENGTH,
  };
}
