/**
 * Serviço de fornecedores: CRUD sobre o modelo `Fornecedor`.
 * Valida `ObjectId` antes de leituras/atualizações; IDs inválidos devolvem `null` em vez de erro.
 */
import mongoose from "mongoose";
import { Fornecedor } from "../models/index";

/** Campos opcionais de cadastro além de nome, CNPJ, contato e flag ativo. */
export type FornecedorExtras = {
  nome_contato?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  categoria?: string | null;
  tipo_fornecedor?: string | null;
  data_inicio?: string | null;
  condicoes_pagamento?: string | null;
  observacoes?: string | null;
  logo_data_url?: string | null;
};

/** Insere um fornecedor; opcionais vazios viram `null`; `ativo` default `true`. */
export function createFornecedor(
  data: {
    nome: string;
    cnpj: string;
    email?: string | null;
    telefone?: string | null;
    ativo?: boolean;
  } & FornecedorExtras,
) {
  return Fornecedor.create({
    nome: data.nome,
    cnpj: data.cnpj,
    email: data.email ?? null,
    telefone: data.telefone ?? null,
    ativo: data.ativo ?? true,
    nome_contato: data.nome_contato ?? null,
    endereco: data.endereco ?? null,
    cidade: data.cidade ?? null,
    estado: data.estado ?? null,
    categoria: data.categoria ?? null,
    tipo_fornecedor: data.tipo_fornecedor ?? null,
    data_inicio: data.data_inicio ?? null,
    condicoes_pagamento: data.condicoes_pagamento ?? null,
    observacoes: data.observacoes ?? null,
    logo_data_url: data.logo_data_url ?? null,
  });
}

/** Lista todos os fornecedores (documentos lean, sem métodos Mongoose). */
export function listFornecedores() {
  return Fornecedor.find().lean();
}

/** Busca por id; retorna `null` se o id não for ObjectId válido ou não existir. */
export function findFornecedor(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Fornecedor.findById(id).lean();
}

/** Atualização parcial (`$set`); só campos enviados são alterados. */
export function updateFornecedor(
  id: string,
  data: {
    nome?: string;
    email?: string | null;
    telefone?: string | null;
    ativo?: boolean;
  } & FornecedorExtras,
) {
  if (!mongoose.Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return Fornecedor.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
}

/** Remove o documento pelo id; `null` se id inválido ou não encontrado. */
export function deleteFornecedor(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return Fornecedor.findByIdAndDelete(id).lean();
}
