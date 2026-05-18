import type { Request, Response } from "express";
import * as svc from "../services/materiaPrima.service";

export async function create(req: Request, res: Response) {
  const { nome, categoria, unidade, estoque_minimo, ativo } = req.body ?? {};
  if (!nome || !categoria || !unidade || estoque_minimo === undefined) {
    return res.status(400).json({ error: "Campos obrigatórios" });
  }
  const row = await svc.createMateriaPrima({
    nome,
    categoria,
    unidade,
    estoque_minimo: Number(estoque_minimo),
    ativo,
  });
  return res.status(201).json(row);
}

export async function list(req: Request, res: Response) {
  const { categoria, busca } = req.query;
  let ativo: boolean | undefined;
  if (req.query.ativo === "true") ativo = true;
  else if (req.query.ativo === "false") ativo = false;
  const rows = await svc.listMateriaPrima({
    categoria: typeof categoria === "string" ? categoria : undefined,
    busca: typeof busca === "string" ? busca : undefined,
    ativo,
  });
  return res.status(200).json(rows);
}

export async function getById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Id inválido" });
  }
  const row = await svc.findMateriaPrima(id);
  if (!row) {
    return res.status(404).json({ error: "Matéria-prima não encontrada" });
  }
  return res.status(200).json(row);
}

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { nome, categoria, unidade, estoque_minimo, ativo } = req.body ?? {};
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Id inválido" });
  }
  if (!nome || !categoria || !unidade || estoque_minimo === undefined) {
    return res.status(400).json({ error: "Campos obrigatórios" });
  }
  const row = await svc.updateMateriaPrima(id, {
    nome,
    categoria,
    unidade,
    estoque_minimo: Number(estoque_minimo),
    ativo,
  });
  return res.status(200).json(row);
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Id inválido" });
  }
  const row = await svc.deleteMateriaPrima(id);
  return res.status(200).json(row);
}
