import Fastify, { type FastifyError, type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { type AppConfig } from "./config.js";
import { registerHealthRoute } from "./routes/health.js";
import { registerChatRoute, type ChatRouteDeps } from "./routes/chat.js";
import { newRequestId } from "./lib/request-id.js";

export type BuildServerOptions = {
  chat?: Omit<ChatRouteDeps, "config">;
};

export async function buildServer(
  config: AppConfig,
  options: BuildServerOptions = {},
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          "req.body.message",
          "res.body.answer",
        ],
        censor: "[redacted]",
      },
    },
    genReqId: () => newRequestId(),
    disableRequestLogging: false,
    bodyLimit: 32 * 1024,
  });

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (config.allowedOrigins.length === 0) return cb(null, false);
      if (config.allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    credentials: false,
  });

  if (config.nodeEnv !== "test") {
    await app.register(rateLimit, {
      global: false,
      max: config.rateLimit.max,
      timeWindow: config.rateLimit.windowSeconds * 1000,
      errorResponseBuilder: () => ({
        error: "rate_limited",
        message: "Too many requests. Please try again shortly.",
      }),
    });
  }

  app.setErrorHandler((error: FastifyError, req, reply) => {
    req.log.error({ err: { message: error.message, name: error.name } }, "request_error");
    const status = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    const safeMessage =
      status >= 500 ? "Internal server error" : error.message || "Request failed";
    reply.status(status).send({
      error: status >= 500 ? "internal_error" : "bad_request",
      message: safeMessage,
    });
  });

  app.setNotFoundHandler((_req, reply) => {
    reply.status(404).send({ error: "not_found", message: "Route not found" });
  });

  await registerHealthRoute(app, config);
  await registerChatRoute(app, { config, ...(options.chat ?? {}) });

  return app;
}
