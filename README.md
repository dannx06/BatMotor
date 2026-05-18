# 🏭 BatMotor

Sistema de gerenciamento de estoque e movimentação de materiais desenvolvido para controle interno de empresas, com autenticação de usuários e diferentes níveis de acesso.

---

# 📌 Sobre o Projeto

O **BatMotor** é uma aplicação full stack voltada para controle de estoque, movimentação de materiais e gerenciamento de fornecedores.

O sistema possui autenticação com JWT, níveis de permissão para usuários e uma API organizada para administração de estoque e operações internas.

---

# 🚀 Tecnologias Utilizadas

## Backend

* Node.js
* TypeScript
* Express
* Prisma ORM
* MySQL
* JWT Authentication
* Docker

## Ferramentas

* Postman
* Visual Studio Code

---

# 🎨 Funcionalidades

✅ Sistema de login com JWT
✅ Controle de usuários e permissões
✅ Cadastro de fornecedores
✅ Cadastro de matéria-prima
✅ Controle de estoque
✅ Entrada e saída de materiais
✅ Registro de movimentações
✅ API REST organizada
✅ Banco de dados relacional
✅ Seed automático para desenvolvimento
✅ Estrutura modularizada

---

# 👥 Perfis de Usuário

O sistema possui diferentes níveis de acesso:

* **ADMIN**

  * Gerencia usuários
  * Gerencia perfis
  * Controle total do sistema

* **GERENTE**

  * Consulta estoque
  * Gerencia fornecedores e matérias-primas
  * Acompanha movimentações

* **FUNCIONÁRIO**

  * Registra entradas e saídas de estoque
  * Consulta informações permitidas

---

# 📂 Estrutura do Projeto

```bash
BatMotor/
│
├── backend01/
│
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── middlewares/
│   ├── services/
│   ├── config/
│   └── app.ts
│
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
│
├── docs/
├── docker/
├── postman/
│
├── package.json
└── README.md
```

---

# 💻 Como Executar o Projeto

## 1️⃣ Clone o repositório

```bash
git clone https://github.com/seu-usuario/BatMotor.git
```

## 2️⃣ Acesse a pasta

```bash
cd BatMotor/backend01
```

## 3️⃣ Instale as dependências

```bash
npm install
```

## 4️⃣ Configure o arquivo `.env`

Crie um arquivo `.env` baseado no `.env.example`.

---

# 🐳 Executando com Docker

```bash
docker compose up -d
```

---

# 🗄️ Banco de Dados

O projeto utiliza:

* MySQL
* Prisma ORM

Para executar as migrations:

```bash
npx prisma migrate dev
```

Para popular o banco com dados iniciais:

```bash
npx prisma db seed
```

---

# 🔐 Autenticação

A aplicação utiliza autenticação via JWT.

Após o login, o token deve ser enviado no header:

```bash
Authorization: Bearer SEU_TOKEN
```

---

# 📡 Principais Rotas da API

## Auth

```bash
POST /auth/login
```

## Usuários

```bash
POST /users
GET /users
```

## Estoque

```bash
GET /estoque-atual
POST /movimentacao
```

## Fornecedores

```bash
POST /fornecedor
GET /fornecedor
```

---

# 🧠 Aprendizados

Durante o desenvolvimento foram aplicados conceitos como:

* API REST
* CRUD completo
* Autenticação JWT
* Controle de permissões
* Banco de dados relacional
* Prisma ORM
* Organização em camadas
* Docker
* TypeScript
* Segurança de rotas

---

# 📸 Preview

Adicione aqui prints da API, banco de dados ou documentação.

---

# 📞 Contato

📧 Email: [danielluccas201006@gmail.com](mailto:danielluccas201006@gmail.com)
📱 WhatsApp: (81) 99991-6502

---

# 👨‍💻 Desenvolvedor

Desenvolvido por **Daniel Lucas Silva Santos de Luna**.

---

# ⭐ GitHub

Se gostou do projeto, deixe uma ⭐ no repositório.
