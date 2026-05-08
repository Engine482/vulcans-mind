import Fastify, { type FastifyError, type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { type AppConfig } from "./config.js";
import { registerHealthRoute } from "./routes/health.js";
import { newRequestId } from "./lib/request-id.js";

export async function buildServer(config: AppConfig): Promise<FastifyInstance> {
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

  return app;
}
