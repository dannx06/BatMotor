/**
 * Módulos da aplicação (menus/áreas): CRUD simples com validação de ObjectId nas operações por id.
 */
import mongoose from "mongoose";
import { Modulo } from "../models/index";

/** Novo módulo; `descricao` opcional vira `null`. */
export function createModulo(data: { nome: string; descricao?: string | null }) {
  return Modulo.create({
    nome: data.nome,
    descricao: data.descricao ?? null,
  });
}

/** Lista todos os módulos (lean). */
export function listModulos() {
  return Modulo.find().lean();
}

/** Por id ou `null` se inválido/inexistente. */
export function findModulo(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Modulo.findById(id).lean();
}

/** Atualização parcial; `null` se id inválido. */
export function updateModulo(
  id: string,
  data: { nome?: string; descricao?: string | null },
) {
  if (!mongoose.Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return Modulo.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
}

/** Remove por id; `null` se id inválido. */
export function deleteModulo(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return Modulo.findByIdAndDelete(id).lean();
}
