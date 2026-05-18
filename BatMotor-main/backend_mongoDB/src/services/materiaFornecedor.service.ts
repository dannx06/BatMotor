/**
 * Liga matéria-prima a fornecedores (N:N). Inclui helpers para o “primeiro” fornecedor
 * por matéria e para substituir todos os vínculos por um fornecedor principal.
 */
import mongoose from "mongoose";
import { MateriaFornecedor } from "../models/index";

/** Cria um par (matéria, fornecedor); ids convertidos para ObjectId. */
export function createMateriaFornecedor(data: {
  materia_prima_id: string;
  fornecedor_id: string;
}) {
  return MateriaFornecedor.create({
    materia_prima_id: new mongoose.Types.ObjectId(data.materia_prima_id),
    fornecedor_id: new mongoose.Types.ObjectId(data.fornecedor_id),
  });
}

/** Lista todos os vínculos com matéria e fornecedor populados (lean). */
export async function listMateriaFornecedor() {
  return MateriaFornecedor.find()
    .populate({ path: "materia_prima_id", options: { lean: true } })
    .populate({ path: "fornecedor_id", options: { lean: true } })
    .lean();
}

/** Par exato (matéria + fornecedor); `null` se ids inválidos ou não encontrado. */
export async function findMateriaFornecedor(
  materiaPrimaId: string,
  fornecedorId: string,
) {
  if (
    !mongoose.Types.ObjectId.isValid(materiaPrimaId) ||
    !mongoose.Types.ObjectId.isValid(fornecedorId)
  ) {
    return null;
  }
  return MateriaFornecedor.findOne({
    materia_prima_id: new mongoose.Types.ObjectId(materiaPrimaId),
    fornecedor_id: new mongoose.Types.ObjectId(fornecedorId),
  })
    .populate({ path: "materia_prima_id", options: { lean: true } })
    .populate({ path: "fornecedor_id", options: { lean: true } })
    .lean();
}

/**
 * Remove o vínculo antigo e cria um novo (pode mudar matéria e/ou fornecedor).
 * Lança se algum id for inválido.
 */
export async function updateMateriaFornecedor(
  materiaId: string,
  fornecedorId: string,
  body: { nova_materia_id?: string; novo_fornecedor_id?: string },
) {
  if (
    !mongoose.Types.ObjectId.isValid(materiaId) ||
    !mongoose.Types.ObjectId.isValid(fornecedorId)
  ) {
    throw new Error("Ids inválidos");
  }
  const materiaUpdate = body.nova_materia_id ?? materiaId;
  const fornecedorUpdate = body.novo_fornecedor_id ?? fornecedorId;
  if (
    !mongoose.Types.ObjectId.isValid(materiaUpdate) ||
    !mongoose.Types.ObjectId.isValid(fornecedorUpdate)
  ) {
    throw new Error("Ids inválidos");
  }

  await MateriaFornecedor.deleteOne({
    materia_prima_id: new mongoose.Types.ObjectId(materiaId),
    fornecedor_id: new mongoose.Types.ObjectId(fornecedorId),
  });

  return MateriaFornecedor.create({
    materia_prima_id: new mongoose.Types.ObjectId(materiaUpdate),
    fornecedor_id: new mongoose.Types.ObjectId(fornecedorUpdate),
  });
}

/** Remove o par (matéria, fornecedor); `null` se ids inválidos. */
export function deleteMateriaFornecedor(
  materiaPrimaId: string,
  fornecedorId: string,
) {
  if (
    !mongoose.Types.ObjectId.isValid(materiaPrimaId) ||
    !mongoose.Types.ObjectId.isValid(fornecedorId)
  ) {
    return Promise.resolve(null);
  }
  return MateriaFornecedor.findOneAndDelete({
    materia_prima_id: new mongoose.Types.ObjectId(materiaPrimaId),
    fornecedor_id: new mongoose.Types.ObjectId(fornecedorId),
  }).lean();
}

/** Primeiro fornecedor ligado a cada matéria (ordem estável por _id). */
export async function mapPrimeiroFornecedorPorMateria(
  materiaIds: mongoose.Types.ObjectId[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!materiaIds.length) return out;
  const links = await MateriaFornecedor.find({
    materia_prima_id: { $in: materiaIds },
  })
    .select("materia_prima_id fornecedor_id")
    .sort({ _id: 1 })
    .lean();
  for (const l of links) {
    const mid = String(l.materia_prima_id);
    if (!out.has(mid)) out.set(mid, String(l.fornecedor_id));
  }
  return out;
}

/**
 * Define um único fornecedor “principal” para a matéria: remove vínculos anteriores e cria o novo.
 * `fornecedorId` vazio ou inválido só remove vínculos (sem criar).
 */
export async function setFornecedorPrimarioMateria(
  materiaPrimaId: string,
  fornecedorId: string | null | undefined,
) {
  if (!mongoose.Types.ObjectId.isValid(materiaPrimaId)) return;
  const mpOid = new mongoose.Types.ObjectId(materiaPrimaId);
  await MateriaFornecedor.deleteMany({ materia_prima_id: mpOid });
  const fid =
    fornecedorId != null ? String(fornecedorId).trim() : "";
  if (!fid || !mongoose.Types.ObjectId.isValid(fid)) return;
  await MateriaFornecedor.create({
    materia_prima_id: mpOid,
    fornecedor_id: new mongoose.Types.ObjectId(fid),
  });
}
