import type { Request, Response } from "express";
import { Role, TipoMovimentacao } from "../generated/prisma/client";
import * as svc from "../services/movimentacao.service";

function parseLargeOutThreshold(): number {
  const n = Number(process.env.LARGE_OUT_THRESHOLD);
  if (Number.isFinite(n) && n > 0) return n;
  return 500;
}

function isTipoValido(t: unknown): t is TipoMovimentacao {
  return (
    t === TipoMovimentacao.ENTRADA ||
    t === TipoMovimentacao.SAIDA ||
    t === "AJUSTE"
  );
}

export async function create(req: Request, res: Response) {
  const { materia_prima_id, tipo, quantidade, motivo, usuario_id } =
    req.body ?? {};
  if (
    materia_prima_id == null ||
    tipo == null ||
    quantidade === undefined ||
    quantidade === null
  ) {
    return res.status(400).json({
      error:
        "Campos obrigatórios: materia_prima_id, tipo (ENTRADA|SAIDA|AJUSTE), quantidade",
    });
  }
  if (!isTipoValido(tipo)) {
    return res
      .status(400)
      .json({ error: "tipo deve ser ENTRADA, SAIDA ou AJUSTE" });
  }

  const authHeader = req.auth;
  let authCtx: { userId: number; roles: Role[] };

  if (authHeader) {
    const podeMovimentar =
      authHeader.roles.includes(Role.ADMIN) ||
      authHeader.roles.includes(Role.GERENTE) ||
      authHeader.roles.includes(Role.FUNCIONARIO);
    if (!podeMovimentar) {
      return res.status(403).json({
        error:
          "Com login JWT, apenas ADMIN, GERENTE ou FUNCIONARIO podem registrar movimentação.",
      });
    }
    const qtdNum = Number(quantidade);
    if (
      tipo === TipoMovimentacao.SAIDA &&
      qtdNum >= parseLargeOutThreshold()
    ) {
      const podeGrandeBaixa =
        authHeader.roles.includes(Role.ADMIN) ||
        authHeader.roles.includes(Role.GERENTE);
      if (!podeGrandeBaixa) {
        return res.status(403).json({
          error: `Saídas de ${parseLargeOutThreshold()} unidades ou mais exigem perfil GERENTE ou ADMIN (Batmotor: controle de baixas críticas).`,
        });
      }
    }
    authCtx = { userId: authHeader.userId, roles: authHeader.roles };
  } else {
    if (usuario_id == null || usuario_id === "") {
      return res.status(400).json({
        error:
          "Sem JWT: informe usuario_id (id numérico do funcionário cadastrado no sistema). " +
          "Alternativa: faça POST /auth/login e envie Authorization: Bearer <token> — aí não precisa de usuario_id para registrar em nome próprio.",
      });
    }
    const uid = Number(usuario_id);
    if (Number.isNaN(uid)) {
      return res.status(400).json({ error: "usuario_id inválido" });
    }
    const ok = await svc.usuarioEhFuncionarioAtivo(uid);
    if (!ok) {
      return res.status(403).json({
        error:
          "usuario_id deve ser de um usuário ativo com perfil FUNCIONARIO.",
      });
    }
    authCtx = { userId: uid, roles: [Role.FUNCIONARIO] };
  }

  const row = await svc.createMovimentacao(
    {
      materia_prima_id: Number(materia_prima_id),
      tipo,
      quantidade: Number(quantidade),
      motivo,
      usuario_id:
        authHeader?.roles.includes(Role.ADMIN) &&
        usuario_id != null &&
        usuario_id !== ""
          ? Number(usuario_id)
          : undefined,
    },
    authCtx,
  );
  return res.status(201).json(row);
}

export async function list(_req: Request, res: Response) {
  const rows = await svc.listMovimentacoes();
  return res.status(200).json(rows);
}

export async function getById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Id inválido" });
  }
  const row = await svc.findMovimentacao(id);
  if (!row) {
    return res.status(404).json({ error: "Movimentação não encontrada" });
  }
  return res.status(200).json(row);
}

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { materia_prima_id, tipo, quantidade, motivo, usuario_id } =
    req.body ?? {};
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Id inválido" });
  }
  if (tipo != null && !isTipoValido(tipo)) {
    return res
      .status(400)
      .json({ error: "tipo deve ser ENTRADA, SAIDA ou AJUSTE" });
  }
  const row = await svc.updateMovimentacao(id, {
    materia_prima_id:
      materia_prima_id != null ? Number(materia_prima_id) : undefined,
    tipo,
    quantidade:
      quantidade !== undefined && quantidade !== null
        ? Number(quantidade)
        : undefined,
    motivo,
    usuario_id:
      usuario_id != null && usuario_id !== ""
        ? Number(usuario_id)
        : undefined,
  });
  return res.status(200).json({
    movimentacao: row,
    message: "Movimentação atualizada",
  });
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Id inválido" });
  }
  const row = await svc.deleteMovimentacao(id);
  return res.status(200).json({
    movimentacao: row,
    message: "Movimentação deletada",
  });
}
