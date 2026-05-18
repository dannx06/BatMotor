import { prisma } from "../lib/prisma";

/** Liga um Usuario a um Perfil (N:N com tabela de junção). */
export function createUsuarioPerfil(data: {
  usuario_id: number;
  perfil_id: number;
}) {
  return prisma.usuarioPerfil.create({
    data: { usuario_id: data.usuario_id, perfil_id: data.perfil_id },
    include: {
      usuario: { select: { id: true, nome: true, email: true } },
      perfil: { select: { id: true, role: true } },
    },
  });
}

export function listUsuarioPerfis() {
  return prisma.usuarioPerfil.findMany({
    include: {
      usuario: { select: { id: true, nome: true, email: true } },
      perfil: { select: { id: true, role: true, descricao: true } },
    },
  });
}

export function findUsuarioPerfil(usuarioId: number, perfilId: number) {
  return prisma.usuarioPerfil.findUnique({
    where: {
      usuario_id_perfil_id: { usuario_id: usuarioId, perfil_id: perfilId },
    },
    include: {
      usuario: { select: { id: true, nome: true, email: true } },
      perfil: { select: { id: true, role: true, descricao: true } },
    },
  });
}

/**
 * Chave composta: removemos a linha antiga e recriamos com os novos IDs
 * (mesma lógica da versão anterior dos colegas).
 */
export async function updateUsuarioPerfil(
  usuarioId: number,
  perfilId: number,
  body: { novo_usuario_id?: number; novo_perfil_id?: number },
) {
  const usuarioUpdate = body.novo_usuario_id ?? usuarioId;
  const perfilUpdate = body.novo_perfil_id ?? perfilId;

  await prisma.usuarioPerfil.delete({
    where: {
      usuario_id_perfil_id: { usuario_id: usuarioId, perfil_id: perfilId },
    },
  });

  return prisma.usuarioPerfil.create({
    data: {
      usuario_id: usuarioUpdate,
      perfil_id: perfilUpdate,
    },
    include: {
      usuario: { select: { id: true, nome: true, email: true } },
      perfil: { select: { id: true, role: true, descricao: true } },
    },
  });
}

export function deleteUsuarioPerfil(usuarioId: number, perfilId: number) {
  return prisma.usuarioPerfil.delete({
    where: {
      usuario_id_perfil_id: { usuario_id: usuarioId, perfil_id: perfilId },
    },
    include: {
      usuario: { select: { id: true, nome: true, email: true } },
      perfil: { select: { id: true, role: true } },
    },
  });
}
