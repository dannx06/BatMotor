/**
 * ===========================================================================
 * app.ts — FÁBRICA Express (sem escutar porta)
 * ===========================================================================
 * Porque existe separado de `main.ts`?
 *   - Facilita testes: em testes pode criar-se `createApp()` sem subir servidor real.
 *
 * ORDEM DOS MIDDLEWARES (importante para o professor):
 *   1) cors(...)        — navegador só aceita resposta se origem estiver na lista permitida.
 *   2) express.json(...) — preenche `req.body` em pedidos JSON (com excepção para form/multipart).
 *   3) urlencoded        — formulários clássicos application/x-www-form-urlencoded.
 *   4) registerRoutes   — regista todas as rotas da API (ver `routes/index.ts`).
 *   5) errorHandler     — último middleware: captura erros e devolve JSON consistente.
 *
 * Vírgulas em `CORS_ORIGINS` (env): lista de origens do front permitidas, separadas por vírgula.
 * ===========================================================================
 */
import cors from "cors";
import express from "express";
import { registerRoutes } from "./routes/index";
import { errorHandler } from "./middlewares/errorHandler";

const DEFAULT_CORS_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4173",
];

function parseCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) return DEFAULT_CORS_ORIGINS;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Fábrica da aplicação Express (sem subir a porta).
 * Separamos de `main.ts` para facilitar testes futuros e leitura didática.
 */
export function createApp() {
  const app = express();

  const allowedOrigins = parseCorsOrigins();
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  /**
   * JSON: por padrão o Express só faz parse com `Content-Type: application/json`.
   * Postman/cURL às vezes mandam o body JSON sem esse header (ou como text/plain) —
   * aí `req.body` fica vazio e o middleware de JWT acha que “falta token”.
   *
   * Só NÃO tratamos como JSON quando é claramente form ou multipart (aí o parser abaixo lê).
   */
  app.use(
    express.json({
      limit: process.env.JSON_BODY_LIMIT ?? "2mb",
      type: (req) => {
        const ct = (req.headers["content-type"] ?? "")
          .split(";")[0]
          .trim()
          .toLowerCase();
        if (ct === "application/x-www-form-urlencoded") return false;
        if (ct.startsWith("multipart/")) return false;
        return true;
      },
    }),
  );
  app.use(
    express.urlencoded({
      extended: true,
      limit: process.env.URLENCODED_BODY_LIMIT ?? "2mb",
    }),
  );

  registerRoutes(app);

  app.use(errorHandler);
  return app;
}
