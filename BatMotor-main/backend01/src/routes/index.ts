/**
 * ===========================================================================
 * routes/index.ts — MAPA CENTRAL DA API (URL → controller + permissões)
 * ===========================================================================
 *
 * CONVENÇÕES:
 * - POST /auth/login → público (sem cabeçalho Authorization).
 * - POST /movimentacao → JWT opcional; sem token, o JSON deve trazer usuario_id (fluxo funcionário).
 * - Router `r` após r.use(authenticate): demais rotas exigem Bearer token válido.
 * - requireRole → papéis extraídos do JWT; requireRoleFromDb → papéis lidos na base de dados.
 * - PATCH /users/me → utilizador altera o próprio cadastro (limites por papel no controller).
 *
 * Índice e fluxos detalhados: docs/GUIA_PEDAGOGICO_BATMOTOR.md (raiz do repositório).
 *
 * Caminhos alinhados à API monolítica antiga (`/users`, `/perfil`, …) para compatibilidade.
 * ===========================================================================
 */
import type { Express } from "express";
import { Router } from "express";
import { Role } from "../generated/prisma/client";
import * as authController from "../controllers/auth.controller";
import * as usuarioController from "../controllers/usuario.controller";
import * as perfilController from "../controllers/perfil.controller";
import * as moduloController from "../controllers/modulo.controller";
import * as usuarioPerfilController from "../controllers/usuarioPerfil.controller";
import * as fornecedorController from "../controllers/fornecedor.controller";
import * as materiaFornecedorController from "../controllers/materiaFornecedor.controller";
import * as materiaPrimaController from "../controllers/materiaPrima.controller";
import * as permissaoModuloController from "../controllers/permissaoModulo.controller";
import * as movimentacaoController from "../controllers/movimentacao.controller";
import * as estoqueController from "../controllers/estoque.controller";
import * as relatorioController from "../controllers/relatorio.controller";
import * as testeController from "../controllers/teste.controller";
import { authenticate, optionalAuthenticate } from "../middlewares/authenticate";
import { requireRole, requireRoleFromDb } from "../middlewares/authorize";
import { asyncHandler } from "../utils/asyncHandler";

const adminOnly = requireRole(Role.ADMIN);
const adminOuGerente = requireRole(Role.ADMIN, Role.GERENTE);
/** Rotas /users: papel efetivo no banco (JWT pode estar defasado após alterar perfil). */
const adminOnlyDb = requireRoleFromDb(Role.ADMIN);
const adminOuGerenteDb = requireRoleFromDb(Role.ADMIN, Role.GERENTE);

export function registerRoutes(app: Express): void {
  app.post("/auth/login", asyncHandler(authController.login));

  app.post(
    "/movimentacao",
    optionalAuthenticate,
    asyncHandler(movimentacaoController.create),
  );

  const r = Router();
  r.use(authenticate);

  /* -------- Usuários: gestão de contas (cadastro feito pela equipe, não pelo login público) -------- */
  r.patch("/users/me", asyncHandler(usuarioController.updateMe));
  r.get("/users", adminOuGerenteDb, asyncHandler(usuarioController.list));
  r.get("/users/:id", asyncHandler(usuarioController.getById));
  r.post("/users", adminOnlyDb, asyncHandler(usuarioController.create));
  r.put("/users/:id", adminOnlyDb, asyncHandler(usuarioController.update));
  r.delete("/users/:id", adminOnlyDb, asyncHandler(usuarioController.remove));

  /* -------- Perfis, módulos, permissões e vínculo usuário–perfil: configuração do sistema -------- */
  r.post("/perfil", adminOnly, asyncHandler(perfilController.create));
  r.get("/perfil", adminOnly, asyncHandler(perfilController.list));
  r.get("/perfil/:id", adminOnly, asyncHandler(perfilController.getById));
  r.put("/perfil/:id", adminOnly, asyncHandler(perfilController.update));
  r.delete("/perfil/:id", adminOnly, asyncHandler(perfilController.remove));

  r.post("/modulos", adminOnly, asyncHandler(moduloController.create));
  r.get("/modulos", adminOnly, asyncHandler(moduloController.list));
  r.get("/modulos/:id", adminOnly, asyncHandler(moduloController.getById));
  r.put("/modulos/:id", adminOnly, asyncHandler(moduloController.update));
  r.delete("/modulos/:id", adminOnly, asyncHandler(moduloController.remove));

  r.post("/user-perfil", adminOnly, asyncHandler(usuarioPerfilController.create));
  r.get("/user-perfil", adminOnly, asyncHandler(usuarioPerfilController.list));
  r.get(
    "/user-perfil/:usuario_id/:perfil_id",
    adminOnly,
    asyncHandler(usuarioPerfilController.getByPair),
  );
  r.put(
    "/user-perfil/:usuario_id/:perfil_id",
    adminOnly,
    asyncHandler(usuarioPerfilController.updatePair),
  );
  r.delete(
    "/user-perfil/:usuario_id/:perfil_id",
    adminOnly,
    asyncHandler(usuarioPerfilController.removePair),
  );

  r.post(
    "/permissao-modulo",
    adminOnly,
    asyncHandler(permissaoModuloController.create),
  );
  r.get(
    "/permissao-modulo",
    adminOnly,
    asyncHandler(permissaoModuloController.list),
  );
  r.get(
    "/permissao-modulo/:id",
    adminOnly,
    asyncHandler(permissaoModuloController.getById),
  );
  r.put(
    "/permissao-modulo/:id",
    adminOnly,
    asyncHandler(permissaoModuloController.update),
  );
  r.delete(
    "/permissao-modulo/:id",
    adminOnly,
    asyncHandler(permissaoModuloController.remove),
  );

  /* -------- Almoxarifado: consulta para todos autenticados; alterações para ADMIN e GERENTE -------- */
  r.post(
    "/fornecedores",
    adminOuGerente,
    asyncHandler(fornecedorController.create),
  );
  r.get("/fornecedores", asyncHandler(fornecedorController.list));
  r.get("/fornecedores/:id", asyncHandler(fornecedorController.getById));
  r.put(
    "/fornecedores/:id",
    adminOuGerente,
    asyncHandler(fornecedorController.update),
  );
  r.delete(
    "/fornecedores/:id",
    adminOuGerente,
    asyncHandler(fornecedorController.remove),
  );

  r.post(
    "/materia-fornecedor",
    adminOuGerente,
    asyncHandler(materiaFornecedorController.create),
  );
  r.get("/materia-fornecedor", asyncHandler(materiaFornecedorController.list));
  r.get(
    "/materia-fornecedor/:materiaid/:fornecedorid",
    asyncHandler(materiaFornecedorController.getByPair),
  );
  r.put(
    "/materia-fornecedor/:materiaid/:fornecedorid",
    adminOuGerente,
    asyncHandler(materiaFornecedorController.updatePair),
  );
  r.delete(
    "/materia-fornecedor/:materiaid/:fornecedorid",
    adminOuGerente,
    asyncHandler(materiaFornecedorController.removePair),
  );

  r.post(
    "/materia-prima",
    adminOuGerente,
    asyncHandler(materiaPrimaController.create),
  );
  r.get("/materia-prima", asyncHandler(materiaPrimaController.list));
  r.get("/materia-prima/:id", asyncHandler(materiaPrimaController.getById));
  r.put(
    "/materia-prima/:id",
    adminOuGerente,
    asyncHandler(materiaPrimaController.update),
  );
  r.delete(
    "/materia-prima/:id",
    adminOuGerente,
    asyncHandler(materiaPrimaController.remove),
  );

  /* -------- Movimentação: POST sem router (JWT opcional + usuario_id); demais rotas autenticadas -------- */
  r.get("/movimentacao", asyncHandler(movimentacaoController.list));
  r.get("/movimentacao/:id", asyncHandler(movimentacaoController.getById));
  r.put(
    "/movimentacao/:id",
    adminOuGerente,
    asyncHandler(movimentacaoController.update),
  );
  r.delete(
    "/movimentacao/:id",
    adminOuGerente,
    asyncHandler(movimentacaoController.remove),
  );

  /** Saldo atual por matéria-prima (nova rota em relação ao arquivo único antigo). */
  r.get("/estoque-atual", asyncHandler(estoqueController.list));

  /** Relatório: matérias-primas abaixo do estoque mínimo (compras / alertas). */
  r.get(
    "/relatorios/estoque-baixo",
    asyncHandler(relatorioController.estoqueBaixo),
  );
  r.post(
    "/relatorios/estoque-baixo/enviar-email",
    adminOuGerente,
    asyncHandler(relatorioController.estoqueBaixoEnviarEmail),
  );
  /** Série diária entrada/saída (dados reais de Movimentacao) para gráficos do dashboard. */
  r.get(
    "/relatorios/movimentacoes-por-dia",
    asyncHandler(relatorioController.movimentacoesPorDia),
  );

  /* -------- Modelo de exemplo no schema (opcional em produção) -------- */
  r.get("/teste", adminOnly, asyncHandler(testeController.list));
  r.get("/teste/:id", adminOnly, asyncHandler(testeController.getById));
  r.post("/teste", adminOnly, asyncHandler(testeController.create));
  r.put("/teste/:id", adminOnly, asyncHandler(testeController.update));
  r.delete("/teste/:id", adminOnly, asyncHandler(testeController.remove));

  app.use(r);
}
