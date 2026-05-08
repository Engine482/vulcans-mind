import type { FastifyInstance } from "fastify";
import type { AppConfig } from "../config.js";

export async function registerHealthRoute(app: FastifyInstance, config: AppConfig): Promise<void> {
  app.get("/health", async () => ({
    status: "ok",
    service: "vulcans-mind-api",
    timestamp: new Date().toISOString(),
    version: config.appVersion,
  }));
}
