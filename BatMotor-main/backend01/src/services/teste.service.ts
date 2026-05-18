import { prisma } from "../lib/prisma";

/**
 * Modelo `Teste` ainda existe no schema (exemplo / migração antiga).
 * Rotas expostas apenas para manter paridade com o banco; em produção costuma ser removido.
 */
export function listTeste() {
  return prisma.teste.findMany();
}

export function findTeste(id: number) {
  return prisma.teste.findUnique({ where: { id } });
}

export function createTeste(data: { nome: string; email: string; senha: string }) {
  return prisma.teste.create({ data });
}

export function updateTeste(
  id: number,
  data: { nome?: string; email?: string; senha?: string },
) {
  return prisma.teste.update({ where: { id }, data });
}

export function deleteTeste(id: number) {
  return prisma.teste.delete({ where: { id } });
}
