import { prisma } from "../lib/prisma";

/**
 * Módulos do sistema (telas/áreas) usados junto com PermissaoModulo.
 * Ajuste de validação: apenas `nome` é obrigatório — `descricao` é opcional no Prisma.
 */
export function createModulo(data: { nome: string; descricao?: string | null }) {
  return prisma.modulo.create({
    data: {
      nome: data.nome,
      descricao: data.descricao ?? null,
    },
  });
}

export function listModulos() {
  return prisma.modulo.findMany();
}

export function findModulo(id: number) {
  return prisma.modulo.findFirst({ where: { id } });
}

export function updateModulo(
  id: number,
  data: { nome?: string; descricao?: string | null },
) {
  return prisma.modulo.update({
    where: { id },
    data,
  });
}

export function deleteModulo(id: number) {
  return prisma.modulo.delete({ where: { id } });
}
