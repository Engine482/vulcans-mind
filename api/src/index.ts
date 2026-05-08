import "dotenv/config";
import type pg from "pg";
import { loadConfig, type AppConfig } from "./config.js";
import { buildServer, type BuildServerOptions } from "./server.js";
import { getPool, closePool } from "./db/pool.js";
import { OpenAIEmbedder } from "./rag/embed.js";
import { PgVectorRetriever } from "./rag/retrieve.js";
import { OpenAIGenerator } from "./chat/generate.js";
import { PgMetricsWriter } from "./chat/metrics.js";

function looksLikeRealOpenAiKey(key: string | undefined): boolean {
  return typeof key === "string" && key.startsWith("sk-") && key.length >= 20;
}

async function probeDb(pool: pg.Pool): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

async function buildChatDeps(
  config: AppConfig,
): Promise<BuildServerOptions["chat"]> {
  const hasDb = Boolean(config.databaseUrl);
  const hasOpenAi = looksLikeRealOpenAiKey(config.openai.apiKey);
  if (!hasDb || !hasOpenAi) return {};

  const pool = getPool(config);
  const dbOk = await probeDb(pool);
  if (!dbOk) {
    console.warn(
      JSON.stringify({
        level: "warn",
        msg: "chat_falling_back_to_mock_mode",
        reason: "database_probe_failed",
      }),
    );
    await closePool();
    return {};
  }

  const embedder = new OpenAIEmbedder(config);
  return {
    retriever: new PgVectorRetriever(pool, embedder, config),
    generator: new OpenAIGenerator(config),
    metricsWriter: new PgMetricsWriter(pool),
  };
}

async function main(): Promise<void> {
  const config = loadConfig();
  const chat = await buildChatDeps(config);
  const app = await buildServer(config, { chat });

  if (Object.keys(chat ?? {}).length === 0) {
    app.log.warn(
      {
        has_database_url: Boolean(config.databaseUrl),
        has_openai_key: looksLikeRealOpenAiKey(config.openai.apiKey),
      },
      "chat_running_in_mock_only_mode",
    );
  }

  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info(
      { port: config.port, host: config.host, env: config.nodeEnv },
      "vulcans-mind-api listening",
    );
  } catch (err) {
    app.log.error({ err }, "failed_to_start");
    process.exit(1);
  }

  for (const sig of ["SIGINT", "SIGTERM"] as const) {
    process.on(sig, async () => {
      app.log.info({ sig }, "shutdown_signal");
      await app.close();
      await closePool();
      process.exit(0);
    });
  }
}

main().catch((err) => {
  console.error("fatal_startup_error", err);
  process.exit(1);
});
