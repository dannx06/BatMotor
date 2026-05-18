import { prisma } from "../lib/prisma";

/**
 * Leitura do saldo atual por matéria-prima (tabela `EstoqueAtual`).
 * Útil para painéis e conferência rápida sem percorrer todas as movimentações.
 */
export function listEstoqueAtual() {
  return prisma.estoqueAtual.findMany({
    include: { materia: true },
  });
}
