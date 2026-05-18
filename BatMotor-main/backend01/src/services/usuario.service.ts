/**
 * ===========================================================================
 * usuario.service.ts — CRUD de utilizadores e regras de unicidade
 * ===========================================================================
 * Chamado pelos controllers de `usuario.controller.ts`.
 *
 * Responsabilidades principais:
 *   - list/find/create/update/delete usuário na tabela `Usuario` (Prisma);
 *   - validar e-mail e CPF únicos antes de gravar (evita duplicados);
 *   - opcionalmente vincular Perfil (GERENTE/FUNCIONARIO) na criação;
 *   - getRolesForUsuario — usado pelo middleware requireRoleFromDb e por PATCH /users/me.
 *
 * Segurança: senhas nunca regressam nas respostas; só hash entra em `update` quando `senha` vem no body.
 * Visão geral: docs/GUIA_PEDAGOGICO_BATMOTOR.md
 * ===========================================================================
 */
import { Role } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../utils/password";

const usuarioSelectComPerfis = {
  id: true,
  nome: true,
  email: true,
  cpf: true,
  ativo: true,
  data_atual: true,
  usuarioPerfis: {
    select: {
      perfil_id: true,
      perfil: {
        select: { id: true, role: true },
      },
    },
  },
} as const;

/** Roles atuais do usuário (banco) — fonte de verdade para autorização quando o JWT está defasado. */
export async function getRolesForUsuario(userId: number): Promise<Role[]> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: {
      usuarioPerfis: {
        include: { perfil: { select: { role: true } } },
      },
    },
  });
  if (!usuario) return [];
  return usuario.usuarioPerfis.map((up) => up.perfil.role);
}

function conflictError(message: string) {
  const err = new Error(message) as Error & { status: number };
  err.status = 409;
  return err;
}

async function ensureUsuarioUniqueFields(data: {
  email?: string;
  cpf?: string;
  excludeId?: number;
}) {
  const { email, cpf, excludeId } = data;

  if (email !== undefined && email !== "") {
    const byEmail = await prisma.usuario.findFirst({
      where: {
        email,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true, ativo: true },
    });
    if (byEmail) {
      throw conflictError(
        `E-mail já utilizado por outro usuário (id ${byEmail.id}${byEmail.ativo ? "" : ", inativo"})`,
      );
    }
  }

  if (cpf !== undefined && cpf !== "") {
    const byCpf = await prisma.usuario.findFirst({
      where: {
        cpf,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true, ativo: true },
    });
    if (byCpf) {
      throw conflictError(
        `CPF já utilizado por outro usuário (id ${byCpf.id}${byCpf.ativo ? "" : ", inativo"})`,
      );
    }
  }
}

/** Lista todos os usuários (sem senha) — uso restrito a perfis de gestão. */
export function listUsuarios() {
  return prisma.usuario.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
      cpf: true,
      ativo: true,
      data_atual: true,
      usuarioPerfis: {
        select: {
          perfil_id: true,
          perfil: {
            select: { id: true, role: true },
          },
        },
      },
    },
  });
}

export function findUsuario(id: number) {
  return prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      email: true,
      cpf: true,
      ativo: true,
      data_atual: true,
      usuarioPerfis: {
        select: {
          perfil_id: true,
          perfil: {
            select: { id: true, role: true },
          },
        },
      },
    },
  });
}

/**
 * Criação de usuário pela API: senha é armazenada com bcrypt.
 * Opcionalmente vincula um perfil (GERENTE ou FUNCIONARIO) na mesma transação.
 * ADMIN não pode ser criado por esta rota (há um único administrador principal).
 */
export async function createUsuario(data: {
  nome: string;
  email: string;
  senha: string;
  cpf: string;
  ativo?: boolean;
  perfil_role?: Role;
}) {
  await ensureUsuarioUniqueFields({ email: data.email, cpf: data.cpf });
  const senhaHash = await hashPassword(data.senha);

  if (data.perfil_role === Role.ADMIN) {
    const err = new Error(
      "Não é permitido criar outro administrador por esta rota.",
    ) as Error & { status: number };
    err.status = 400;
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    const created = await tx.usuario.create({
      data: {
        nome: data.nome,
        email: data.email,
        senha: senhaHash,
        cpf: data.cpf,
        ativo: data.ativo ?? true,
      },
      select: { id: true },
    });

    if (data.perfil_role) {
      if (data.perfil_role !== Role.GERENTE && data.perfil_role !== Role.FUNCIONARIO) {
        const err = new Error("perfil_role deve ser GERENTE ou FUNCIONARIO") as Error & {
          status: number;
        };
        err.status = 400;
        throw err;
      }
      const perfil = await tx.perfil.findFirst({
        where: { role: data.perfil_role },
      });
      if (!perfil) {
        const err = new Error(
          `Perfil ${data.perfil_role} não encontrado. Execute o seed (npm run db:seed).`,
        ) as Error & { status: number };
        err.status = 400;
        throw err;
      }
      await tx.usuarioPerfil.create({
        data: { usuario_id: created.id, perfil_id: perfil.id },
      });
    }

    return tx.usuario.findUniqueOrThrow({
      where: { id: created.id },
      select: usuarioSelectComPerfis,
    });
  });
}

/** Atualização — se `senha` vier no body, substitui com hash. */
export async function updateUsuario(
  id: number,
  data: {
    nome?: string;
    email?: string;
    senha?: string;
    cpf?: string;
    ativo?: boolean;
  },
) {
  await ensureUsuarioUniqueFields({
    email: data.email,
    cpf: data.cpf,
    excludeId: id,
  });

  const senha =
    data.senha !== undefined ? await hashPassword(data.senha) : undefined;
  return prisma.usuario.update({
    where: { id },
    data: {
      nome: data.nome,
      email: data.email,
      cpf: data.cpf,
      ativo: data.ativo,
      ...(senha ? { senha } : {}),
    },
    select: {
      id: true,
      nome: true,
      email: true,
      cpf: true,
      ativo: true,
      data_atual: true,
    },
  });
}

/** Remove usuário e dependências (movimentações e vínculos de perfil). */
export async function deleteUsuario(id: number) {
  return prisma.$transaction(async (tx) => {
    await tx.movimentacao.deleteMany({ where: { usuario_id: id } });
    await tx.usuarioPerfil.deleteMany({ where: { usuario_id: id } });
    return tx.usuario.delete({ where: { id } });
  });
}
