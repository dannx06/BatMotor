# Backend BatMotor — MongoDB (Mongoose)

Cópia da API do pasta `backend` original, adaptada para **MongoDB** em vez de Prisma/MySQL.

## Requisitos

- Node.js ≥ 20
- MongoDB local ou URI na nuvem (Atlas, etc.)

## Configuração

1. Copie `.env.example` para `.env` e ajuste `MONGODB_URI`.
2. Opcional: `docker compose up -d` nesta pasta para subir Mongo na porta 27017.
3. `npm install`
4. `npm run db:seed` — perfis e utilizadores de desenvolvimento.
5. `npm run dev` — API na porta definida em `PORT` (padrão 3000).

## Diferenças face ao `backend` original

- IDs nas rotas e no JSON são **ObjectIds em string** (24 caracteres hex), não inteiros.
- O administrador principal protegido contra DELETE é o utilizador com e-mail **`admin@batmotor.com`**.
- Mesmas rotas HTTP que o backend Express original (compatível em estrutura, não em IDs numéricos).

## Scripts

| Comando        | Descrição              |
|----------------|------------------------|
| `npm run dev`  | Servidor com hot reload |
| `npm run start`| Servidor único         |
| `npm run db:seed` | Popular dados iniciais |
| `npm run verify` | `tsc --noEmit`        |

## Render (nuvem)

- **`render.yaml`** nesta pasta: Web Service Node com `healthCheckPath: /health`.
- Variáveis: `MONGODB_URI`, `JWT_SECRET`, **`CORS_ORIGINS`** = URL HTTPS do front (ex.: `https://xxx.onrender.com`). O servidor **junta** estas origens às de localhost (Vite).
- Após o primeiro deploy, corre **`npm run db:seed`** (Shell no Render ou local com a mesma `MONGODB_URI`).
- Guia do front: `../frontend - mongoDB/DEPLOY_RENDER.md`.

