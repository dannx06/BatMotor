/**
 * =============================================================================
 * auth.service.ts — CREDENCIAIS → JWT
 * =============================================================================
 * Erros comuns: utilizador inexistente, inativo, senha errada — Error com .status
 * para o errorHandler. Mensagens genéricas onde faz sentido (segurança).
 *
 * roles no token: Perfis ligados em UsuarioPerfil. O front normaliza em
 * batmotorAdapters.normalizeAuthSuccess → accountKind / profileRole.
 * Guia: docs/GUIA_PEDAGOGICO_BATMOTOR.md
 * =============================================================================
 */
import { prisma } from "../lib/prisma";
import { verifyPassword } from "../utils/password";
import { signToken } from "../utils/token";
import type { Role } from "../generated/prisma/client";

/**
 * Serviço de autenticação: valida credenciais e monta o payload do JWT.
 *
 * Fluxo didático:
 * 1) localiza usuário por e-mail;
 * 2) garante que está ativo;
 * 3) confere senha (bcrypt ou legado texto puro — migração gradual);
 * 4) coleta todas as `Role` via vínculo UsuarioPerfil → Perfil;
 * 5) retorna token + dados públicos do usuário (sem senha).
 */
export async function login(email: string, senha: string) {
  const usuario = await prisma.usuario.findFirst({
    where: { email },
    include: {
      usuarioPerfis: {
        include: { perfil: { select: { role: true } } },
      },
    },
  });

  if (!usuario) {
    const err = new Error("E-mail ou senha inválidos");
    (err as Error & { status: number }).status = 401;
    throw err;
  }

  if (!usuario.ativo) {
    const err = new Error("Usuário inativo");
    (err as Error & { status: number }).status = 403;
    throw err;
  }

  const ok = await verifyPassword(senha, usuario.senha);
  if (!ok) {
    const err = new Error("E-mail ou senha inválidos");
    (err as Error & { status: number }).status = 401;
    throw err;
  }

  const roles: Role[] = usuario.usuarioPerfis.map((up) => up.perfil.role);

  const token = signToken({
    sub: usuario.id,
    email: usuario.email,
    roles,
  });

  return {
    token,
    user: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      roles,
    },
  };
}
