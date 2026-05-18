import { prisma } from "../lib/prisma";

export function createMateriaFornecedor(data: {
  materia_prima_id: number;
  fornecedor_id: number;
}) {
  return prisma.materiaFornecedor.create({
    data: {
      materia_prima_id: data.materia_prima_id,
      fornecedor_id: data.fornecedor_id,
    },
  });
}

export function listMateriaFornecedor() {
  return prisma.materiaFornecedor.findMany({
    include: { materia: true, fornecedor: true },
  });
}

export function findMateriaFornecedor(
  materiaPrimaId: number,
  fornecedorId: number,
) {
  return prisma.materiaFornecedor.findUnique({
    where: {
      materia_prima_id_fornecedor_id: {
        materia_prima_id: materiaPrimaId,
        fornecedor_id: fornecedorId,
      },
    },
    include: { materia: true, fornecedor: true },
  });
}

export async function updateMateriaFornecedor(
  materiaId: number,
  fornecedorId: number,
  body: { nova_materia_id?: number; novo_fornecedor_id?: number },
) {
  const materiaUpdate = body.nova_materia_id ?? materiaId;
  const fornecedorUpdate = body.novo_fornecedor_id ?? fornecedorId;

  await prisma.materiaFornecedor.delete({
    where: {
      materia_prima_id_fornecedor_id: {
        materia_prima_id: materiaId,
        fornecedor_id: fornecedorId,
      },
    },
  });

  return prisma.materiaFornecedor.create({
    data: {
      materia_prima_id: materiaUpdate,
      fornecedor_id: fornecedorUpdate,
    },
    include: { materia: true, fornecedor: true },
  });
}

export function deleteMateriaFornecedor(
  materiaPrimaId: number,
  fornecedorId: number,
) {
  return prisma.materiaFornecedor.delete({
    where: {
      materia_prima_id_fornecedor_id: {
        materia_prima_id: materiaPrimaId,
        fornecedor_id: fornecedorId,
      },
    },
  });
}
