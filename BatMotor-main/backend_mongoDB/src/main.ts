/**
 * Entrada do servidor — liga ao MongoDB antes de aceitar pedidos HTTP.
 */
import { createApp } from "./app";
import { env } from "./config/env";
import { connectDb } from "./lib/db";

const app = createApp();

void (async () => {
  try {
    await connectDb();
    app.listen(env.port, () => {
      console.log(`[BatMotor MongoDB] API na porta ${env.port}`);
      console.log(`Login: POST /auth/login  (JSON: email, senha)`);
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
