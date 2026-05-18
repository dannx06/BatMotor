/**
 * Associação utilizador ↔ perfil (`UsuarioPerfil`): CRUD com populate de utilizador e perfil.
 */
import mongoose from "mongoose";
import { UsuarioPerfil } from "../models/index";

/** Cria vínculo utilizador–perfil (ObjectIds). */
export function createUsuarioPerfil(data: {
  usuario_id: string;
  perfil_id: string;
}) {
  return UsuarioPerfil.create({
    usuario_id: new mongoose.Types.ObjectId(data.usuario_id),
    perfil_id: new mongoose.Types.ObjectId(data.perfil_id),
  });
}

/** Lista todas as associações com nome/e-mail do utilizador e role/descrição do perfil. */
export function listUsuarioPerfis() {
  return UsuarioPerfil.find()
    .populate({
      path: "usuario_id",
      select: "nome email",
      options: { lean: true },
    })
    .populate({
      path: "perfil_id",
      select: "role descricao",
      options: { lean: true },
    })
    .lean();
}

/** Par (usuario_id, perfil_id); `null` se ids inválidos ou não encontrado. */
export function findUsuarioPerfil(usuarioId: string, perfilId: string) {
  if (
    !mongoose.Types.ObjectId.isValid(usuarioId) ||
    !mongoose.Types.ObjectId.isValid(perfilId)
  ) {
    return null;
  }
  return UsuarioPerfil.findOne({
    usuario_id: new mongoose.Types.ObjectId(usuarioId),
    perfil_id: new mongoose.Types.ObjectId(perfilId),
  })
    .populate({
      path: "usuario_id",
      select: "nome email",
      options: { lean: true },
    })
    .populate({
      path: "perfil_id",
      select: "role descricao",
      options: { lean: true },
    })
    .lean();
}

/** Remove o vínculo antigo e cria novo (troca de utilizador e/ou perfil). */
export async function updateUsuarioPerfil(
  usuarioId: string,
  perfilId: string,
  body: { novo_usuario_id?: string; novo_perfil_id?: string },
) {
  if (
    !mongoose.Types.ObjectId.isValid(usuarioId) ||
    !mongoose.Types.ObjectId.isValid(perfilId)
  ) {
    throw new Error("Ids inválidos");
  }
  const usuarioUpdate = body.novo_usuario_id ?? usuarioId;
  const perfilUpdate = body.novo_perfil_id ?? perfilId;
  if (
    !mongoose.Types.ObjectId.isValid(usuarioUpdate) ||
    !mongoose.Types.ObjectId.isValid(perfilUpdate)
  ) {
    throw new Error("Ids inválidos");
  }

  await UsuarioPerfil.deleteOne({
    usuario_id: new mongoose.Types.ObjectId(usuarioId),
    perfil_id: new mongoose.Types.ObjectId(perfilId),
  });

  return UsuarioPerfil.create({
    usuario_id: new mongoose.Types.ObjectId(usuarioUpdate),
    perfil_id: new mongoose.Types.ObjectId(perfilUpdate),
  });
}

/** Remove o par; `null` se ids inválidos. */
export function deleteUsuarioPerfil(usuarioId: string, perfilId: string) {
  if (
    !mongoose.Types.ObjectId.isValid(usuarioId) ||
    !mongoose.Types.ObjectId.isValid(perfilId)
  ) {
    return Promise.resolve(null);
  }
  return UsuarioPerfil.findOneAndDelete({
    usuario_id: new mongoose.Types.ObjectId(usuarioId),
    perfil_id: new mongoose.Types.ObjectId(perfilId),
  }).lean();
}
