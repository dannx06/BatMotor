/**
 * Serviço de matéria-prima: CRUD e enriquecimento com `fornecedor_id` “principal”.
 * O vínculo principal é o primeiro registo em `MateriaFornecedor` (ver `materiaFornecedor.service`).
 */
import mongoose from "mongoose";
import { MateriaFornecedor, MateriaPrima } from "../models/index";
import {
  mapPrimeiroFornecedorPorMateria,
  setFornecedorPrimarioMateria,
} from "./materiaFornecedor.service";

/** Cria matéria; se `fornecedor_id` for válido, define-o como único fornecedor ligado. */
export async function createMateriaPrima(data: {
  nome: string;
  categoria: string;
  unidade: string;
  estoque_minimo: number;
  ativo?: boolean;
  fornecedor_id?: string | null;
  observacao?: string | null;
  preco_custo?: number | null;
  preco_venda?: number | null;
}) {
  const created = await MateriaPrima.create({
    nome: data.nome,
    categoria: data.categoria,
    unidade: data.unidade,
    estoque_minimo: data.estoque_minimo,
    ativo: data.ativo ?? true,
    observacao: data.observacao ?? null,
    preco_custo: data.preco_custo ?? null,
    preco_venda: data.preco_venda ?? null,
  });
  const row = await MateriaPrima.findById(created._id).lean();
  if (!row) return null;
  const fid =
    data.fornecedor_id != null ? String(data.fornecedor_id).trim() : "";
  if (fid && mongoose.Types.ObjectId.isValid(fid)) {
    await setFornecedorPrimarioMateria(String(row._id), fid);
  }
  const map = await mapPrimeiroFornecedorPorMateria([
    row._id as mongoose.Types.ObjectId,
  ]);
  return {
    ...row,
    fornecedor_id: map.get(String(row._id)) ?? null,
  };
}

/**
 * Lista com filtros opcionais: categoria exata, texto em nome/categoria (case-insensitive), ativo.
 * Ordena por nome; cada linha inclui `fornecedor_id` resolvido.
 */
export async function listMateriaPrima(filters?: {
  categoria?: string;
  busca?: string;
  ativo?: boolean;
}) {
  const q: mongoose.FilterQuery<typeof MateriaPrima> = {};
  if (filters?.categoria?.trim()) {
    q.categoria = filters.categoria.trim();
  }
  if (filters?.ativo !== undefined) {
    q.ativo = filters.ativo;
  }
  const busca = filters?.busca?.trim();
  if (busca) {
    q.$or = [
      { nome: { $regex: busca, $options: "i" } },
      { categoria: { $regex: busca, $options: "i" } },
    ];
  }
  const rows = await MateriaPrima.find(q).sort({ nome: 1 }).lean();
  if (rows.length === 0) return rows;
  const ids = rows.map((r) => r._id as mongoose.Types.ObjectId);
  const map = await mapPrimeiroFornecedorPorMateria(ids);
  return rows.map((r) => ({
    ...r,
    fornecedor_id: map.get(String(r._id)) ?? null,
  }));
}

/** Uma matéria por id com `fornecedor_id`; `null` se id inválido ou inexistente. */
export async function findMateriaPrima(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const row = await MateriaPrima.findById(id).lean();
  if (!row) return null;
  const map = await mapPrimeiroFornecedorPorMateria([
    row._id as mongoose.Types.ObjectId,
  ]);
  return {
    ...row,
    fornecedor_id: map.get(String(row._id)) ?? null,
  };
}

/**
 * Atualiza campos da matéria; `fornecedor_id` (se enviado) repõe o fornecedor principal
 * (apaga vínculos antigos e cria o novo — ver `setFornecedorPrimarioMateria`).
 */
export async function updateMateriaPrima(
  id: string,
  data: {
    nome?: string;
    categoria?: string;
    unidade?: string;
    estoque_minimo?: number;
    ativo?: boolean;
    fornecedor_id?: string | null;
    observacao?: string | null;
    preco_custo?: number | null;
    preco_venda?: number | null;
  },
) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return Promise.resolve(null);
  }
  const { fornecedor_id, ...fields } = data;
  const row = await MateriaPrima.findByIdAndUpdate(
    id,
    { $set: fields },
    { new: true },
  ).lean();
  if (!row) return null;
  if (fornecedor_id !== undefined) {
    await setFornecedorPrimarioMateria(id, fornecedor_id);
  }
  const map = await mapPrimeiroFornecedorPorMateria([
    row._id as mongoose.Types.ObjectId,
  ]);
  return {
    ...row,
    fornecedor_id: map.get(String(row._id)) ?? null,
  };
}

/** Apaga vínculos `MateriaFornecedor` desta matéria e remove o documento `MateriaPrima`. */
export async function deleteMateriaPrima(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return Promise.resolve(null);
  }
  const oid = new mongoose.Types.ObjectId(id);
  await MateriaFornecedor.deleteMany({ materia_prima_id: oid });
  return MateriaPrima.findByIdAndDelete(id).lean();
}
