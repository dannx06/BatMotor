import type { Request, Response } from "express";
import * as svc from "../services/permissaoModulo.service";

export async function create(req: Request, res: Response) {
  const {
    perfil_id,
    modulo_id,
    pode_ler,
    pode_criar,
    pode_atualizar,
    pode_excluir,
  } = req.body ?? {};
  if (!perfil_id || !modulo_id) {
    return res.status(400).json({
      error: "Campos perfil_id e modulo_id são obrigatórios",
    });
  }
  const row = await svc.createPermissaoModulo({
    perfil_id: Number(perfil_id),
    modulo_id: Number(modulo_id),
    pode_ler,
    pode_criar,
    pode_atualizar,
    pode_excluir,
  });
  return res.status(201).json(row);
}

export async function list(_req: Request, res: Response) {
  const rows = await svc.listPermissaoModulo();
  return res.status(200).json(rows);
}

export async function getById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Id inválido" });
  }
  const row = await svc.findPermissaoModulo(id);
  if (!row) {
    return res.status(404).json({ error: "Permissão não encontrada" });
  }
  return res.status(200).json(row);
}

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const {
    perfil_id,
    modulo_id,
    pode_ler,
    pode_criar,
    pode_atualizar,
    pode_excluir,
  } = req.body ?? {};
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Id inválido" });
  }
  const row = await svc.updatePermissaoModulo(id, {
    perfil_id: perfil_id != null ? Number(perfil_id) : undefined,
    modulo_id: modulo_id != null ? Number(modulo_id) : undefined,
    pode_ler,
    pode_criar,
    pode_atualizar,
    pode_excluir,
  });
  return res.status(200).json({
    permissao: row,
    message: "Permissão atualizada com sucesso",
  });
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Id inválido" });
  }
  const row = await svc.deletePermissaoModulo(id);
  return res.status(200).json({
    permissao: row,
    message: "Permissão deletada com sucesso",
  });
}
