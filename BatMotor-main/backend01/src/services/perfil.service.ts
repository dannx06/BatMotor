import { Role } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";

/**
 * Perfis definem papéis no sistema (ADMIN, GERENTE, FUNCIONARIO).
 * Mantivemos a verificação de negócio dos colegas: apenas um GERENTE "ativo" por vez
 * (ajuste se a empresa permitir vários gerentes).
 */
export async function createPerfil(data: {
  role: Role;
  descricao?: string | null;
}) {
  if (data.role === Role.GERENTE) {
    const exists = await prisma.perfil.findFirst({
      where: { role: Role.GERENTE },
    });
    if (exists) {
      const err = new Error("Já existe um perfil GERENTE no sistema");
      (err as Error & { status: number }).status = 400;
      throw err;
    }
  }

  return prisma.perfil.create({
    data: {
      role: data.role,
      descricao: data.descricao ?? null,
    },
  });
}

export function listPerfis() {
  return prisma.perfil.findMany();
}

export function findPerfil(id: number) {
  return prisma.perfil.findFirst({ where: { id } });
}

/** `descricao` no schema é opcional; não exigimos mais os dois campos como na versão antiga. */
export function updatePerfil(
  id: number,
  data: { role?: Role; descricao?: string | null },
) {
  return prisma.perfil.update({
    where: { id },
    data: {
      role: data.role,
      descricao: data.descricao,
    },
  });
}

export function deletePerfil(id: number) {
  return prisma.perfil.delete({ where: { id } });
}
