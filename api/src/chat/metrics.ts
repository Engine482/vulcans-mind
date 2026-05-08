import { createHash } from "node:crypto";
import type pg from "pg";
import type { ChatHandleOutcome } from "./service.js";

export type MetricsRecord = {
  requestId: string;
  sessionId?: string;
  inputLengthChars: number;
  outputLengthChars: number;
  latencyMs: number;
  status: "ok" | "refused" | "error";
  errorCode?: string;
  outcome?: ChatHandleOutcome;
};

export interface MetricsWriter {
  write(record: MetricsRecord): Promise<void>;
}

export class PgMetricsWriter implements MetricsWriter {
  constructor(private readonly pool: pg.Pool) {}

  async write(record: MetricsRecord): Promise<void> {
    const sessionHash = record.sessionId
      ? createHash("sha256").update(record.sessionId).digest("hex")
      : null;
    const topic = record.outcome?.topic ?? null;
    const responseLanguage = record.outcome?.language ?? null;
    const retrievalCount = record.outcome?.retrievalCount ?? 0;
    const retrievedSourceIds = record.outcome?.retrievedSourceIds ?? [];
    const model = record.outcome?.response.meta.model ?? null;
    const fallbackUsed = record.outcome?.response.meta.fallbackUsed ?? false;
    const inputTokens = record.outcome?.inputTokens ?? null;
    const outputTokens = record.outcome?.outputTokens ?? null;

    await this.pool.query(
      `INSERT INTO request_metrics
         (request_id, session_id_hash, topic, response_language, model_used,
          fallback_used, retrieval_count, retrieved_source_ids,
          input_length_chars, output_length_chars,
          input_tokens, output_tokens, latency_ms,
          status, error_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (request_id) DO NOTHING`,
      [
        record.requestId,
        sessionHash,
        topic,
        responseLanguage,
        model,
        fallbackUsed,
        retrievalCount,
        JSON.stringify(retrievedSourceIds),
        record.inputLengthChars,
        record.outputLengthChars,
        inputTokens,
        outputTokens,
        record.latencyMs,
        record.status,
        record.errorCode ?? null,
      ],
    );
  }
}
