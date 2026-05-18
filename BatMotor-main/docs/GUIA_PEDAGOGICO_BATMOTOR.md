# Guia pedagógico — BatMotor (Estocaê): backend + frontend

Documento principal para **professores e revisores** entenderem como o sistema foi construído, como as camadas conversam entre si e onde procurar detalhes no código.

---

## Nota sobre “comentar tudo” (botões, vírgulas, etc.)

Em engenharia de software, **comentar cada linha ou cada vírgula** em dezenas de ficheiros:

- aumenta o ruído e **dificulta a leitura** (o código deixa de ser autodocumentado);
- duplica informação que o compilador/formatador já torna clara;
- fica **desatualizado** rapidamente.

Por isso, este projeto combina:

1. **Este guia** — visão de arquitectura e fluxos.
2. **Comentários de bloco nos “fios condutores”** — `main.ts`, `app.ts`, `routes/index.ts`, `App.jsx`, `main.jsx`, `api/client.js`, `api/index.js`, `PermissionsContext.jsx`, serviços e controllers chave, etc.
3. **Comentários pontuais** onde a regra de negócio não é óbvia (JWT opcional em movimentação, `PATCH /users/me`, tratamento Prisma P2002, etc.).

Assim o professor compreende **o desenho do sistema** e sabe **qual ficheiro abrir** para cada domínio.

---

## 1. Visão geral

| Camada | Tecnologia | Papel |
|--------|------------|--------|
| **Frontend** | React 18 + Vite + React Router | SPA: login, painel, inventário, relatórios, configurações. |
| **Backend** | Node.js + Express + TypeScript | API REST + JWT + regras de negócio. |
| **Base de dados** | MySQL 8 + Prisma ORM | Utilizadores, perfis, matérias-primas, movimentações, fornecedores, etc. |

**Comunicação:** o browser usa `VITE_API_URL` (por defeito `http://localhost:3000`). Depois do login, o Axios envia `Authorization: Bearer <token>` em cada pedido protegido.

---

## 2. Backend — estrutura de pastas (mapa mental)

```
backend/src/
├── main.ts                 → Arranca `createApp()` e `listen(port)`.
├── app.ts                  → Express: CORS, JSON, rotas, errorHandler.
├── routes/index.ts         → “Mapa”: URL + método + middleware + controller.
├── controllers/            → HTTP fino: lê req, chama service, devolve res.json.
├── services/               → Regra de negócio + Prisma (transações quando preciso).
├── middlewares/
│   ├── authenticate.ts     → JWT obrigatório ou opcional.
│   ├── authorize.ts        → Papel ADMIN / GERENTE / FUNCIONARIO.
│   └── errorHandler.ts     → JSON consistente em erros (incl. códigos Prisma).
├── lib/prisma.ts           → Cliente Prisma + adapter MySQL/MariaDB.
├── config/env.ts           → PORT, JWT_SECRET, JWT_EXPIRES_IN.
├── generated/prisma/       → Código gerado pelo `prisma generate` (não editar à mão).
└── utils/                  → hash senha, sign/verify JWT, asyncHandler.
```

### 2.1 Fluxo de um pedido (passo a passo)

1. **TCP** chega ao Node; **Express** despacha para middlewares na ordem definida em `app.ts`.
2. **CORS** valida `Origin` (lista em `CORS_ORIGINS` ou valores por defeito do Vite).
3. **express.json** preenche `req.body` (há regra especial para não confundir com `urlencoded`).
4. **`registerRoutes`** em `routes/index.ts`:
   - Rotas **antes** de `r.use(authenticate)` podem ser públicas (`POST /auth/login`, `POST /movimentacao` com JWT opcional).
   - Router `r` com `authenticate`: todas as rotas abaixo exigem token válido (salvo excepções montadas fora).
5. Middlewares **`requireRole`** ou **`requireRoleFromDb`** restringem por papel.
6. **Controller** valida entrada mínima e chama **service**.
7. **Service** usa **`prisma`** para ler/escrever.
8. Resposta **JSON**; erros não capturados → **`errorHandler`** (ex.: `status` no Error, ou `P2002` duplicado).

### 2.2 Autenticação e papéis (didática)

| Conceito | Onde ver |
|----------|-----------|
| Login | `POST /auth/login` → `auth.controller.ts` → `auth.service.ts` |
| Senha | `utils/password.ts` — bcrypt; compatibilidade com legado quando aplicável |
| JWT | `utils/token.ts` — `signToken` / `verifyToken`; segredo em `config/env.ts` |
| Quem sou no pedido | `middlewares/authenticate.ts` preenche `req.auth = { userId, email, roles }` |
| Só ADMIN | `requireRole(Role.ADMIN)` |
| ADMIN ou GERENTE | `requireRole(Role.ADMIN, Role.GERENTE)` |
| Papel “verdadeiro” no banco | `requireRoleFromDb` — útil se o JWT ficou antigo após mudança de perfil |

### 2.3 Rotas úteis (resumo para o front)

| Método | Caminho | Quem (typical) | Notas |
|--------|---------|----------------|--------|
| POST | `/auth/login` | Público | Body: `email`, `senha`. Resposta: `token`, `user` (com `roles`). |
| PATCH | `/users/me` | Autenticado | Próprio utilizador: FUNCIONARIO só **nome**; GERENTE/ADMIN podem nome/e-mail/senha. |
| GET/POST/PUT/DELETE | `/fornecedores`, `/materia-prima`, … | Conforme rota | Ver comentários em `routes/index.ts`. |
| POST | `/movimentacao` | JWT opcional | Sem token: body deve trazer `usuario_id` (fluxo funcionário). |
| GET | `/estoque-atual` | Autenticado | Saldos para telas de inventário. |
| GET | `/relatorios/estoque-baixo` | Autenticado | Alertas abaixo do mínimo. |
| POST | `/relatorios/estoque-baixo/enviar-email` | ADMIN/GERENTE | E-mail (SMTP no `.env`). |
| GET | `/relatorios/movimentacoes-por-dia` | Autenticado | Série para gráficos. |

Lista **completa** e ordenada: ficheiro **`backend/src/routes/index.ts`** (cada bloco tem comentário de secção).

### 2.4 Ficheiro legado

**`main.legado.ts`** — versão monolítica antiga para comparar “tudo num ficheiro” vs módulos.

---

## 3. Frontend — estrutura de pastas

```
frontend/src/
├── main.jsx                → ReactDOM + BrowserRouter + import global app.css.
├── App.jsx                 → Rotas, layout, sessão, PermissionsProvider, sidebar.
├── pages/                  → Uma rota principal por ficheiro (Dashboard, Estoque, …).
├── pages/auth/LoginPage.jsx
├── components/             → UI reutilizável (avatar, modais, gráficos).
├── context/PermissionsContext.jsx → canManageInventory / canManageUsers.
├── api/
│   ├── client.js           → Axios, baseURL, interceptors (token, 401 → /login).
│   ├── index.js            → Reexporta tudo o que as páginas importam de `@/api`.
│   ├── services/*.js       → fetchX / createX — cada um escolhe mock ou HTTP.
│   ├── batmotorAdapters.js → Normaliza JSON backend → props React.
│   └── mock/               → Dados fictícios se getUseMock() === true.
├── constants/              → ACCOUNT_KIND, avatares, etc.
├── styles/                 → app.css (global) + reports-page.css (só relatórios).
└── utils/                  → PDF, Excel, helpers.
```

### 3.1 Fluxo de arranque (`main.jsx`)

1. Encontra `#root` no `index.html`.
2. **`BrowserRouter`** — suporte a `Route`, `NavLink`, `useNavigate`.
3. Renderiza **`<App />`**.
4. Importa **`app.css`** (Bootstrap/AdminLTE + tema Batmotor).

### 3.2 `App.jsx` — o que um programa de SPA faz aqui

- **Sessão:** `localStorage` guarda token, id, nome, e-mail, `accountKind`, `profileRole`, foto; estado React espelha isso ao carregar.
- **Protecção:** `ProtectedRoute` redireciona para `/login` sem token.
- **Permissões:** `PermissionsProvider` calcula flags a partir de `accountKind` (funcionário não gere inventário/utilizadores na UI).
- **Navegação:** cada **`NavLink to="..."`** é equivalente a um “botão de menu” sem recarregar a página.
- **AdminLTE:** em `/login` remove-se `main.min.css` para não estragar o layout de autenticação; nas rotas internas o link é recriado.

### 3.3 Camada API

- **`getUseMock()`** — se verdadeiro, `services/*` usam `mock/` em vez de `api.get/post`.
- **Interceptor request** — anexa `Authorization: Bearer …` se existir token.
- **Interceptor response** — em **401**, limpa sessão e manda para `/login` (exceto durante o próprio login).

### 3.4 Adaptadores (`batmotorAdapters.js`)

O backend usa nomes de campos em português (`nome`, `estoque_minimo`). Muitos componentes esperam inglês (`name`, `minStock`). Os adaptadores **traduzem** para uma única língua na UI.

### 3.5 Relatórios e CSS isolado

**`styles/reports-page.css`** — só classes sob **`.bm-reports-page`**, para alinhar visualmente às outras telas **sem** alterar `app.css` global.

### 3.6 Perfil (Settings) e funcionário

- UI esconde e-mail/senha para **employee**.
- **`PATCH /users/me`** no backend recusa `email`/`senha` no body se o papel efectivo for só FUNCIONARIO.

---

## 4. Funcionalidades “extra” ao longo do projeto

- Relatórios com KPIs, filtro, PDF/Excel, e-mail de alertas (SMTP).
- Gráfico de movimentações por dia ligado à API real.
- Permissões na UI (fornecedores, produtos, estoque, relatórios).
- `PATCH /users/me` com regras por papel.
- Folha de estilo dedicada aos relatórios.

---

## 5. Índice — onde estão comentários extensos no código

| Ficheiro | Conteúdo didático nos comentários |
|----------|-----------------------------------|
| `backend/src/main.ts` | Entrada, camadas, legado. |
| `backend/src/app.ts` | Ordem dos middlewares, CORS, JSON. |
| `backend/src/routes/index.ts` | Mapa completo da API. |
| `backend/src/middlewares/authenticate.ts` | Onde ler JWT; opcional vs obrigatório. |
| `backend/src/middlewares/authorize.ts` | Papéis; JWT vs banco. |
| `backend/src/middlewares/errorHandler.ts` | Prisma P2002, etc. |
| `backend/src/utils/token.ts` | Assinatura e validação JWT. |
| `backend/src/utils/asyncHandler.ts` | Porque async precisa disto no Express. |
| `backend/src/config/env.ts` | Variáveis de ambiente. |
| `backend/src/lib/prisma.ts` | Adapter MySQL. |
| `backend/src/services/auth.service.ts` | Passos do login. |
| `backend/src/services/usuario.service.ts` | CRUD utilizador + getRolesForUsuario. |
| `backend/src/controllers/auth.controller.ts` | Contrato JSON do login. |
| `backend/src/controllers/usuario.controller.ts` | `updateMe` e CRUD admin. |
| `frontend/src/main.jsx` | Montagem React. |
| `frontend/src/App.jsx` | Rotas, sessão, sidebar, permissões. |
| `frontend/src/api/client.js` | Mock, interceptors, 401. |
| `frontend/src/api/index.js` | Barreira `@/api`. |
| `frontend/src/context/PermissionsContext.jsx` | Flags da UI. |
| `frontend/src/pages/auth/LoginPage.jsx` | Formulário, validação, erros. |
| `frontend/src/api/batmotorAdapters.js` | Normalização backend → UI. |

**Outros controllers/services** seguem o mesmo **padrão**: controller fino, service com Prisma e regras.

---

## 6. Como demonstrar (checklist)

1. **Backend:** `.env` com base de dados e `JWT_SECRET`; `npm install`; migrar/seed; `npm run dev`.
2. **Frontend:** `npm install`; `VITE_API_URL` apontando para a API; `npm run dev`.
3. Testar **papéis** diferentes (seed): admin, gerente, funcionário — observar menus e botões (PDF, importar, etc.).

---

## 7. Glossário rápido

| Termo | Significado |
|-------|-------------|
| **JWT** | Token assinado que identifica o utilizador sem enviar senha a cada pedido. |
| **SPA** | Single Page Application — uma página HTML, conteúdo muda por React Router. |
| **ORM Prisma** | Gera tipos e queries type-safe para MySQL. |
| **Middleware** | Função Express que lê/altera `req`/`res` ou corta o fluxo (403/401). |
| **Mock** | Modo sem backend — dados fictícios no browser. |

---

*Documento de apoio académico — BatMotor / Estocaê. Para sugestões de melhoria didática, atualize este ficheiro em `docs/`.*
