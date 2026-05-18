import { prisma } from "../lib/prisma";

export function createPermissaoModulo(data: {
  perfil_id: number;
  modulo_id: number;
  pode_ler?: boolean;
  pode_criar?: boolean;
  pode_atualizar?: boolean;
  pode_excluir?: boolean;
}) {
  return prisma.permissaoModulo.create({
    data: {
      perfil_id: data.perfil_id,
      modulo_id: data.modulo_id,
      pode_ler: data.pode_ler ?? false,
      pode_criar: data.pode_criar ?? false,
      pode_atualizar: data.pode_atualizar ?? false,
      pode_excluir: data.pode_excluir ?? false,
    },
    include: { perfil: true, modulo: true },
  });
}

export function listPermissaoModulo() {
  return prisma.permissaoModulo.findMany({
    include: { perfil: true, modulo: true },
  });
}

export function findPermissaoModulo(id: number) {
  return prisma.permissaoModulo.findUnique({
    where: { id },
    include: { perfil: true, modulo: true },
  });
}

export function updatePermissaoModulo(
  id: number,
  data: {
    perfil_id?: number;
    modulo_id?: number;
    pode_ler?: boolean;
    pode_criar?: boolean;
    pode_atualizar?: boolean;
    pode_excluir?: boolean;
  },
) {
  return prisma.permissaoModulo.update({
    where: { id },
    data: {
      perfil_id: data.perfil_id,
      modulo_id: data.modulo_id,
      pode_ler: data.pode_ler,
      pode_criar: data.pode_criar,
      pode_atualizar: data.pode_atualizar,
      pode_excluir: data.pode_excluir,
    },
    include: { perfil: true, modulo: true },
  });
}

export function deletePermissaoModulo(id: number) {
  return prisma.permissaoModulo.delete({ where: { id } });
}
