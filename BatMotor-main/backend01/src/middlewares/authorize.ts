/**
 * =============================================================================
 * authorize.ts — AUTORIZAÇÃO POR PAPEL (depois da autenticação)
 * =============================================================================
 * Autenticação responde “quem é?”; autorização responde “pode fazer esta acção?”.
 *
 * requireRole(A, B, …)     — compara com req.auth.roles (vindas do JWT no momento do login).
 * requireRoleFromDb(A, B…) — re-lê perfis na tabela UsuarioPerfil (evita 403 injusto se o
 *                            admin mudou o papel no banco mas o JWT ainda é antigo).
 *
 * hasAnyAllowedRole: ADMIN sempre passa (regra de negócio explícita).
 * mergeJwtAndDbRoles: união de papéis JWT + BD para decisão única.
 *
 * Uso típico em routes/index.ts: adminOnly = requireRole(Role.ADMIN).
 * Guia: docs/GUIA_PEDAGOGICO_BATMOTOR.md
 * =============================================================================
 */
import type { RequestHandler } from "express";
import { Role } from "../generated/prisma/client";
import { getRolesForUsuario } from "../services/usuario.service";

/**
 * ADMIN pode tudo neste middleware: se o usuário tem role ADMIN, liberamos
 * imediatamente (regra de negócio pedida: administrador vê e altera o sistema inteiro).
 */
function hasAnyAllowedRole(userRoles: Role[], ...allowed: Role[]): boolean {
  if (userRoles.includes(Role.ADMIN)) return true;
  return allowed.some((r) => userRoles.includes(r));
}

/** Unifica papéis do JWT (login) e do banco (UsuarioPerfil → Perfil). */
function mergeJwtAndDbRoles(jwtRoles: Role[] | undefined, dbRoles: Role[]): Role[] {
  const out: Role[] = [...dbRoles];
  for (const r of jwtRoles ?? []) {
    if (!out.includes(r)) out.push(r);
  }
  return out;
}

/**
 * Exige usuário autenticado (use após `authenticate`).
 */
export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.auth) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  next();
};

/**
 * Exige pelo menos uma das roles informadas (ADMIN sempre passa).
 */
export function requireRole(...allowed: Role[]): RequestHandler {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    if (!hasAnyAllowedRole(req.auth.roles, ...allowed)) {
      return res.status(403).json({
        error:
          "Sem permissão para esta ação. Verifique o perfil do usuário (ADMIN / GERENTE / FUNCIONARIO).",
      });
    }
    next();
  };
}

/**
 * Como `requireRole`, mas consulta perfis no banco (UsuarioPerfil → Perfil).
 * Evita 403 quando o JWT ainda traz o papel antigo após troca de perfil/sessão.
 */
export function requireRoleFromDb(...allowed: Role[]): RequestHandler {
  return (req, res, next) => {
    void (async () => {
      if (!req.auth) {
        res.status(401).json({ error: "Não autenticado" });
        return;
      }
      try {
        const dbRoles = await getRolesForUsuario(req.auth.userId);
        const roles = mergeJwtAndDbRoles(req.auth.roles, dbRoles);
        if (!hasAnyAllowedRole(roles, ...allowed)) {
          res.status(403).json({
            error:
              "Sem permissão para esta ação. Verifique o perfil do usuário (ADMIN / GERENTE / FUNCIONARIO).",
          });
          return;
        }
        next();
      } catch (err) {
        next(err);
      }
    })();
  };
}
