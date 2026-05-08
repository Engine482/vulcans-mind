import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AppConfig } from "../config.js";
import { ChatService } from "../chat/service.js";
import type { Generator } from "../chat/generate.js";
import type { MetricsWriter } from "../chat/metrics.js";
import type { Retriever } from "../rag/retrieve.js";

const ChatBodySchema = z.object({
  message: z
    .string({ required_error: "message is required" })
    .trim()
    .min(1, "message must not be empty")
    .max(1500, "message exceeds 1500 characters"),
  sessionId: z.string().trim().min(1).max(100).optional(),
  language: z.enum(["uk", "en", "auto"]).default("auto"),
});

export type ChatRouteDeps = {
  config: AppConfig;
  retriever?: Retriever;
  generator?: Generator;
  metricsWriter?: MetricsWriter;
};

export async function registerChatRoute(
  app: FastifyInstance,
  deps: ChatRouteDeps,
): Promise<void> {
  const service = new ChatService({
    config: deps.config,
    retriever: deps.retriever,
    generator: deps.generator,
  });

  app.post("/api/chat", {
    config: {
      rateLimit: {
        max: deps.config.rateLimit.max,
        timeWindow: deps.config.rateLimit.windowSeconds * 1000,
      },
    },
  }, async (req, reply) => {
    const t0 = Date.now();
    const parsed = ChatBodySchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "invalid request";
      reply.status(400).send({ error: "bad_request", message });
      return;
    }
    const body = parsed.data;

    try {
      const outcome = await service.handle({
        ...body,
        requestId: req.id,
      });

      const latencyMs = Date.now() - t0;
      req.log.info(
        {
          request_id: req.id,
          topic: outcome.topic,
          response_language: outcome.language,
          retrieval_count: outcome.retrievalCount,
          retrieval_duration_ms: outcome.retrievalDurationMs,
          input_length_chars: body.message.length,
          output_length_chars: outcome.response.answer.length,
          latency_ms: latencyMs,
          model: outcome.response.meta.model,
          refusal: outcome.refusalIssued,
        },
        "chat_handled",
      );

      if (deps.metricsWriter) {
        deps.metricsWriter
          .write({
            requestId: req.id,
            sessionId: body.sessionId,
            inputLengthChars: body.message.length,
            outputLengthChars: outcome.response.answer.length,
            latencyMs,
            status: outcome.refusalIssued ? "refused" : "ok",
            outcome,
          })
          .catch((err) => {
            req.log.warn(
              { err: { message: (err as Error).message }, request_id: req.id },
              "metrics_write_failed",
            );
          });
      }

      reply.status(200).send(outcome.response);
    } catch (err) {
      const latencyMs = Date.now() - t0;
      const errorCode = err instanceof Error ? err.name : "Error";
      req.log.error(
        { request_id: req.id, error_code: errorCode, latency_ms: latencyMs },
        "chat_failed",
      );
      if (deps.metricsWriter) {
        deps.metricsWriter
          .write({
            requestId: req.id,
            sessionId: body.sessionId,
            inputLengthChars: body.message.length,
            outputLengthChars: 0,
            latencyMs,
            status: "error",
            errorCode,
          })
          .catch(() => undefined);
      }
      reply
        .status(503)
        .send({ error: "service_unavailable", message: "Chat service is temporarily unavailable" });
    }
  });
}
