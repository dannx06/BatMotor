import type { Request, Response } from "express";
import * as svc from "../services/materiaFornecedor.service";

export async function create(req: Request, res: Response) {
  const { materia_prima_id, fornecedor_id } = req.body ?? {};
  if (!materia_prima_id || !fornecedor_id) {
    return res.status(400).json({ error: "Campos obrigatórios" });
  }
  const row = await svc.createMateriaFornecedor({
    materia_prima_id: Number(materia_prima_id),
    fornecedor_id: Number(fornecedor_id),
  });
  return res.status(201).json(row);
}

export async function list(_req: Request, res: Response) {
  const rows = await svc.listMateriaFornecedor();
  return res.status(200).json(rows);
}

export async function getByPair(req: Request, res: Response) {
  const mp = Number(req.params.materiaid);
  const fo = Number(req.params.fornecedorid);
  if (Number.isNaN(mp) || Number.isNaN(fo)) {
    return res.status(400).json({ error: "IDs inválidos" });
  }
  const row = await svc.findMateriaFornecedor(mp, fo);
  if (!row) {
    return res.status(404).json({ error: "Relação não encontrada" });
  }
  return res.status(200).json(row);
}

export async function updatePair(req: Request, res: Response) {
  const mp = Number(req.params.materiaid);
  const fo = Number(req.params.fornecedorid);
  const { nova_materia_id, novo_fornecedor_id } = req.body ?? {};
  if (Number.isNaN(mp) || Number.isNaN(fo)) {
    return res.status(400).json({ error: "IDs inválidos" });
  }
  if (nova_materia_id == null && novo_fornecedor_id == null) {
    return res.status(400).json({ error: "Informe pelo menos um novo ID" });
  }
  const existente = await svc.findMateriaFornecedor(mp, fo);
  if (!existente) {
    return res.status(404).json({ error: "Relação não encontrada" });
  }
  const row = await svc.updateMateriaFornecedor(mp, fo, {
    nova_materia_id:
      nova_materia_id != null ? Number(nova_materia_id) : undefined,
    novo_fornecedor_id:
      novo_fornecedor_id != null ? Number(novo_fornecedor_id) : undefined,
  });
  return res.status(200).json({
    relacao: row,
    message: "Relação atualizada com sucesso",
  });
}

export async function removePair(req: Request, res: Response) {
  const mp = Number(req.params.materiaid);
  const fo = Number(req.params.fornecedorid);
  if (Number.isNaN(mp) || Number.isNaN(fo)) {
    return res.status(400).json({ error: "IDs inválidos" });
  }
  const row = await svc.deleteMateriaFornecedor(mp, fo);
  return res.status(200).json({
    relacao: row,
    message: "Relação deletada com sucesso",
  });
}
