/**
 * Permissões por perfil e módulo (CRUD + flags ler/criar/atualizar/excluir).
 */
import mongoose from "mongoose";
import { PermissaoModulo } from "../models/index";

/** Nova linha de permissão; flags default `false` se omitidas. */
export function createPermissaoModulo(data: {
  perfil_id: string;
  modulo_id: string;
  pode_ler?: boolean;
  pode_criar?: boolean;
  pode_atualizar?: boolean;
  pode_excluir?: boolean;
}) {
  return PermissaoModulo.create({
    perfil_id: new mongoose.Types.ObjectId(data.perfil_id),
    modulo_id: new mongoose.Types.ObjectId(data.modulo_id),
    pode_ler: data.pode_ler ?? false,
    pode_criar: data.pode_criar ?? false,
    pode_atualizar: data.pode_atualizar ?? false,
    pode_excluir: data.pode_excluir ?? false,
  });
}

/** Lista com `perfil_id` e `modulo_id` populados. */
export function listPermissaoModulo() {
  return PermissaoModulo.find()
    .populate({ path: "perfil_id", options: { lean: true } })
    .populate({ path: "modulo_id", options: { lean: true } })
    .lean();
}

/** Documento por id com populate; `null` se inválido/inexistente. */
export function findPermissaoModulo(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return PermissaoModulo.findById(id)
    .populate({ path: "perfil_id", options: { lean: true } })
    .populate({ path: "modulo_id", options: { lean: true } })
    .lean();
}

/** Atualiza referências e/ou flags; `null` se id ou novos ids forem inválidos. */
export function updatePermissaoModulo(
  id: string,
  data: {
    perfil_id?: string;
    modulo_id?: string;
    pode_ler?: boolean;
    pode_criar?: boolean;
    pode_atualizar?: boolean;
    pode_excluir?: boolean;
  },
) {
  if (!mongoose.Types.ObjectId.isValid(id)) return Promise.resolve(null);
  const set: Record<string, unknown> = {};
  if (data.perfil_id !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(data.perfil_id)) return Promise.resolve(null);
    set.perfil_id = new mongoose.Types.ObjectId(data.perfil_id);
  }
  if (data.modulo_id !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(data.modulo_id)) return Promise.resolve(null);
    set.modulo_id = new mongoose.Types.ObjectId(data.modulo_id);
  }
  if (data.pode_ler !== undefined) set.pode_ler = data.pode_ler;
  if (data.pode_criar !== undefined) set.pode_criar = data.pode_criar;
  if (data.pode_atualizar !== undefined) set.pode_atualizar = data.pode_atualizar;
  if (data.pode_excluir !== undefined) set.pode_excluir = data.pode_excluir;
  return PermissaoModulo.findByIdAndUpdate(id, { $set: set }, { new: true })
    .populate({ path: "perfil_id", options: { lean: true } })
    .populate({ path: "modulo_id", options: { lean: true } })
    .lean();
}

/** Remove por id; `null` se id inválido. */
export function deletePermissaoModulo(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return PermissaoModulo.findByIdAndDelete(id).lean();
}
