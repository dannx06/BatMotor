import type { Request, Response } from "express";
import * as svc from "../services/teste.service";

export async function list(_req: Request, res: Response) {
  return res.status(200).json(await svc.listTeste());
}

export async function getById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Id inválido" });
  }
  const row = await svc.findTeste(id);
  if (!row) {
    return res.status(404).json({ error: "Registro não encontrado" });
  }
  return res.status(200).json(row);
}

export async function create(req: Request, res: Response) {
  const { nome, email, senha } = req.body ?? {};
  if (!nome || !email || !senha) {
    return res.status(400).json({ error: "Campos obrigatórios" });
  }
  const row = await svc.createTeste({ nome, email, senha });
  return res.status(201).json(row);
}

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { nome, email, senha } = req.body ?? {};
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Id inválido" });
  }
  const row = await svc.updateTeste(id, { nome, email, senha });
  return res.status(200).json(row);
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Id inválido" });
  }
  await svc.deleteTeste(id);
  return res.status(204).send();
}
