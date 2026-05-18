/// <reference types="node" />

/**
 * Carrega sempre `backend/.env`, mesmo que o comando seja corrido na raiz do monorepo
 * (`npx prisma ...` sem `cd backend`). Evita P1001 por `DATABASE_URL` errado/ausente.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

const backendRoot = path.dirname(fileURLToPath(import.meta.url));
/** `override: false` — variáveis já definidas no Render/painel não são substituídas por `.env` local. */
dotenv.config({ path: path.join(backendRoot, ".env"), override: false });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"] || undefined,
  },
});
