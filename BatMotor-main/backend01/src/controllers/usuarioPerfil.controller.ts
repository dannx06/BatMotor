import type { Request, Response } from "express";
import * as svc from "../services/usuarioPerfil.service";

export async function create(req: Request, res: Response) {
  const { usuario_id, perfil_id } = req.body ?? {};
  if (!usuario_id || !perfil_id) {
    return res.status(400).json({ error: "Campos obrigatórios: usuario_id, perfil_id" });
  }
  const row = await svc.createUsuarioPerfil({
    usuario_id: Number(usuario_id),
    perfil_id: Number(perfil_id),
  });
  return res.status(201).json(row);
}

export async function list(_req: Request, res: Response) {
  const rows = await svc.listUsuarioPerfis();
  const resultado = rows.map((up) => ({
    usuario: up.usuario,
    perfil: up.perfil,
  }));
  return res.status(200).json(resultado);
}

export async function getByPair(req: Request, res: Response) {
  const usuarioId = Number(req.params.usuario_id);
  const perfilId = Number(req.params.perfil_id);
  if (Number.isNaN(usuarioId) || Number.isNaN(perfilId)) {
    return res.status(400).json({ error: "IDs inválidos" });
  }
  const row = await svc.findUsuarioPerfil(usuarioId, perfilId);
  if (!row) {
    return res.status(404).json({ error: "Relacionamento não encontrado" });
  }
  return res.status(200).json(row);
}

export async function updatePair(req: Request, res: Response) {
  const usuarioId = Number(req.params.usuario_id);
  const perfilId = Number(req.params.perfil_id);
  const { novo_usuario_id, novo_perfil_id } = req.body ?? {};
  if (Number.isNaN(usuarioId) || Number.isNaN(perfilId)) {
    return res.status(400).json({ error: "IDs inválidos" });
  }
  if (novo_usuario_id == null && novo_perfil_id == null) {
    return res.status(400).json({ error: "Informe pelo menos um novo ID" });
  }
  const existente = await svc.findUsuarioPerfil(usuarioId, perfilId);
  if (!existente) {
    return res.status(404).json({ error: "Relacionamento não encontrado" });
  }
  const row = await svc.updateUsuarioPerfil(usuarioId, perfilId, {
    novo_usuario_id: novo_usuario_id != null ? Number(novo_usuario_id) : undefined,
    novo_perfil_id: novo_perfil_id != null ? Number(novo_perfil_id) : undefined,
  });
  return res.status(200).json({
    relacionamento: row,
    message: "Relacionamento atualizado com sucesso",
  });
}

export async function removePair(req: Request, res: Response) {
  const usuarioId = Number(req.params.usuario_id);
  const perfilId = Number(req.params.perfil_id);
  if (Number.isNaN(usuarioId) || Number.isNaN(perfilId)) {
    return res.status(400).json({ error: "IDs inválidos" });
  }
  const row = await svc.deleteUsuarioPerfil(usuarioId, perfilId);
  return res.status(200).json({
    relacionamento: row,
    message: "Relacionamento deletado com sucesso",
  });
}
