/**
 * CRUD de exemplo sobre o modelo `Teste` (desenvolvimento/demos); valida ObjectId nas operações por id.
 */
import mongoose from "mongoose";
import { Teste } from "../models/index";

/** Lista todos os registos de teste. */
export function listTeste() {
  return Teste.find().lean();
}

/** Por id ou `null` se inválido/inexistente. */
export function findTeste(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Teste.findById(id).lean();
}

/** Insere documento de teste (sem hash de senha — apenas demo). */
export function createTeste(data: { nome: string; email: string; senha: string }) {
  return Teste.create(data);
}

/** Atualização parcial; `null` se id inválido. */
export function updateTeste(
  id: string,
  data: { nome?: string; email?: string; senha?: string },
) {
  if (!mongoose.Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return Teste.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
}

/** Remove por id; `null` se id inválido. */
export function deleteTeste(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return Teste.findByIdAndDelete(id).lean();
}
