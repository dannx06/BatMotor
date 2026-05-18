import type { Request, Response } from "express";
import * as svc from "../services/fornecedor.service";

export async function create(req: Request, res: Response) {
  const { nome, cnpj, email, telefone, ativo } = req.body ?? {};
  if (!nome || !cnpj) {
    return res.status(400).json({ error: "Campos obrigatórios: nome, cnpj" });
  }
  const row = await svc.createFornecedor({
    nome,
    cnpj,
    email,
    telefone,
    ativo: ativo === undefined ? undefined : Boolean(ativo),
  });
  return res.status(201).json(row);
}

export async function list(_req: Request, res: Response) {
  const rows = await svc.listFornecedores();
  return res.status(200).json(rows);
}

export async function getById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Id inválido" });
  }
  const row = await svc.findFornecedor(id);
  if (!row) {
    return res.status(404).json({ error: "Fornecedor não encontrado" });
  }
  return res.status(200).json(row);
}

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { nome, email, telefone, ativo } = req.body ?? {};
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Id inválido" });
  }
  const data: {
    nome?: string;
    email?: string | null;
    telefone?: string | null;
    ativo?: boolean;
  } = {};
  if (nome !== undefined) data.nome = nome;
  if (email !== undefined) data.email = email;
  if (telefone !== undefined) data.telefone = telefone;
  if (ativo !== undefined) data.ativo = Boolean(ativo);
  const row = await svc.updateFornecedor(id, data);
  return res.status(200).json(row);
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Id inválido" });
  }
  const row = await svc.deleteFornecedor(id);
  return res.status(200).json({
    fornecedor: row,
    message: "Fornecedor removido com sucesso",
  });
}
