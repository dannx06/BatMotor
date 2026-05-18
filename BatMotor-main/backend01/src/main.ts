/**
 * ===========================================================================
 * BACKEND — PONTO DE ENTRADA DO SERVIDOR HTTP (Node + Express)
 * ===========================================================================
 *
 * FLUXO DE ARRANQUE:
 *   1) `createApp()` (em `app.ts`) constrói a aplicação Express: CORS, parse de JSON, rotas.
 *   2) `app.listen(port)` abre o socket TCP e começa a aceitar pedidos.
 *   3) A porta vem de `config/env.ts` (variável de ambiente, ex.: PORT=3000).
 *
 * ORGANIZAÇÃO DO CÓDIGO (camadas):
 *   - `routes/index.ts`  — qual URL chama qual controller e que middleware (JWT, papel ADMIN…).
 *   - `controllers/*`   — traduz HTTP (query/body/params) em chamadas aos services.
 *   - `services/*`       — regra de negócio + Prisma (`lib/prisma.ts`).
 *   - `middlewares/*`   — `authenticate` (valida JWT), `authorize` (exige papel).
 *
 * DIDÁCTICA: o ficheiro monolítico antigo mantém-se como `main.legado.ts` para comparar
 * “tudo num arquivo” vs “módulos separados”.
 *
 * Documentação expandida para o professor: `docs/GUIA_PEDAGOGICO_BATMOTOR.md` (na raiz do repo).
 * ===========================================================================
 */
import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app.listen(env.port, () => {
  console.log(`API BatMotor na porta ${env.port}`);
  console.log(`Login: POST /auth/login  (JSON: email, senha)`);
});
