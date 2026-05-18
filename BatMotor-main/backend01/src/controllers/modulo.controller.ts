import type { Request, Response } from "express";
import * as moduloService from "../services/modulo.service";

export async function create(req: Request, res: Response) {
  const { nome, descricao } = req.body ?? {};
  if (!nome) {
    return res.status(400).json({ error: "Campo nome é obrigatório" });
  }
  const row = await moduloService.createModulo({ nome, descricao });
  return res.status(201).json(row);
}

export async function list(_req: Request, res: Response) {
  const rows = await moduloService.listModulos();
  return res.status(200).json(rows);
}

export async function getById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Id inválido" });
  }
  const row = await moduloService.findModulo(id);
  if (!row) {
    return res.status(404).json({ error: "Módulo não encontrado" });
  }
  return res.status(200).json(row);
}

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { nome, descricao } = req.body ?? {};
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Id inválido" });
  }
  if (!nome) {
    return res.status(400).json({ error: "Campo nome é obrigatório" });
  }
  const row = await moduloService.updateModulo(id, { nome, descricao });
  return res.status(200).json({
    modulo: row,
    message: "Módulo atualizado com sucesso",
  });
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Id inválido" });
  }
  const row = await moduloService.deleteModulo(id);
  return res.status(200).json({
    modulo: row,
    message: "Módulo deletado com sucesso",
  });
}
