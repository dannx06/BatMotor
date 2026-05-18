import { prisma } from "../lib/prisma";

/**
 * Cadastro de fornecedores alinhado ao schema: apenas `nome` e `cnpj` são obrigatórios;
 * `email` e `telefone` são opcionais (diferente da validação antiga que exigia todos).
 */
export function createFornecedor(data: {
  nome: string;
  cnpj: string;
  email?: string | null;
  telefone?: string | null;
  ativo?: boolean;
}) {
  return prisma.fornecedor.create({
    data: {
      nome: data.nome,
      cnpj: data.cnpj,
      email: data.email ?? null,
      telefone: data.telefone ?? null,
      ativo: data.ativo ?? true,
    },
  });
}

export function listFornecedores() {
  return prisma.fornecedor.findMany();
}

export function findFornecedor(id: number) {
  return prisma.fornecedor.findUnique({ where: { id } });
}

export function updateFornecedor(
  id: number,
  data: {
    nome?: string;
    email?: string | null;
    telefone?: string | null;
    ativo?: boolean;
  },
) {
  return prisma.fornecedor.update({
    where: { id },
    data,
  });
}

export function deleteFornecedor(id: number) {
  return prisma.fornecedor.delete({ where: { id } });
}
