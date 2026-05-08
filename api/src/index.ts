import "dotenv/config";
import { loadConfig } from "./config.js";
import { buildServer } from "./server.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const app = await buildServer(config);

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
      process.exit(0);
    });
  }
}

main().catch((err) => {
  console.error("fatal_startup_error", err);
  process.exit(1);
});
