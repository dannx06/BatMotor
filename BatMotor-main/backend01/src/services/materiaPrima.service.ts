import type { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";

export function createMateriaPrima(data: {
  nome: string;
  categoria: string;
  unidade: string;
  estoque_minimo: number;
  ativo?: boolean;
}) {
  return prisma.materiaPrima.create({
    data: {
      nome: data.nome,
      categoria: data.categoria,
      unidade: data.unidade,
      estoque_minimo: data.estoque_minimo,
      ativo: data.ativo ?? true,
    },
  });
}

export function listMateriaPrima(filters?: {
  categoria?: string;
  busca?: string;
  ativo?: boolean;
}) {
  const where: Prisma.MateriaPrimaWhereInput = {};
  if (filters?.categoria?.trim()) {
    where.categoria = { equals: filters.categoria.trim() };
  }
  if (filters?.ativo !== undefined) {
    where.ativo = filters.ativo;
  }
  const q = filters?.busca?.trim();
  if (q) {
    where.OR = [
      { nome: { contains: q } },
      { categoria: { contains: q } },
    ];
  }
  return prisma.materiaPrima.findMany({
    where,
    orderBy: { nome: "asc" },
  });
}

export function findMateriaPrima(id: number) {
  return prisma.materiaPrima.findUnique({ where: { id } });
}

export function updateMateriaPrima(
  id: number,
  data: {
    nome?: string;
    categoria?: string;
    unidade?: string;
    estoque_minimo?: number;
    ativo?: boolean;
  },
) {
  return prisma.materiaPrima.update({
    where: { id },
    data,
  });
}

export function deleteMateriaPrima(id: number) {
  return prisma.materiaPrima.delete({ where: { id } });
}
