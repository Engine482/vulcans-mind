import { describe, it, expect } from "vitest";
import { buildServer } from "../server.js";
import { loadConfig } from "../config.js";

describe("GET /health", () => {
  it("returns 200 with safe payload", async () => {
    const cfg = loadConfig({
      NODE_ENV: "test",
      APP_VERSION: "1.2.3",
      LOG_LEVEL: "silent",
      ALLOWED_ORIGINS: "https://motornyi.com",
    } as NodeJS.ProcessEnv);

    const app = await buildServer(cfg);
    try {
      const res = await app.inject({ method: "GET", url: "/health" });
      expect(res.statusCode).toBe(200);
      const body = res.json() as Record<string, unknown>;
      expect(body.status).toBe("ok");
      expect(body.service).toBe("vulcans-mind-api");
      expect(body.version).toBe("1.2.3");
      expect(typeof body.timestamp).toBe("string");
    } finally {
      await app.close();
    }
  });

  it("returns 404 for unknown routes", async () => {
    const cfg = loadConfig({
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
      ALLOWED_ORIGINS: "https://motornyi.com",
    } as NodeJS.ProcessEnv);
    const app = await buildServer(cfg);
    try {
      const res = await app.inject({ method: "GET", url: "/nope" });
      expect(res.statusCode).toBe(404);
      expect(res.json()).toMatchObject({ error: "not_found" });
    } finally {
      await app.close();
    }
  });
});
