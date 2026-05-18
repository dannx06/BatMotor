/**
 * Movimentações de estoque (entrada/saída/ajuste), atualização de `EstoqueAtual` e regras de permissão.
 * Respostas expõem `usuario` normalizado (populate pode falhar se o utilizador foi apagado).
 */
import mongoose from "mongoose";
import {
  EstoqueAtual,
  MateriaPrima,
  Movimentacao,
  Usuario,
  UsuarioPerfil,
} from "../models/index";
import { Role, TipoMovimentacao } from "../types/domain";

/** Payload de criação; admin pode indicar `usuario_id` operador diferente do token. */
export type MovimentacaoCreateInput = {
  materia_prima_id: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  motivo?: string | null;
  usuario_id?: string;
};

/** Populate de `usuario_id` pode ser `null` (utilizador apagado; referência órfã). */
function usuarioFromPopulate(
  raw: unknown,
): { id: string; nome: string; email: string } | null {
  if (raw == null || typeof raw !== "object") return null;
  const u = raw as { _id?: unknown; nome?: unknown; email?: unknown };
  if (u._id == null) return null;
  return {
    id: String(u._id),
    nome: typeof u.nome === "string" ? u.nome : "—",
    email: typeof u.email === "string" ? u.email : "",
  };
}

/**
 * Atualiza ou cria linha em `EstoqueAtual`: AJUSTE soma ao atual com piso 0;
 * ENTRADA/SAÍDA usa `$inc` (saída já validada antes para não ficar negativa).
 */
async function aplicarEstoque(
  materiaId: mongoose.Types.ObjectId,
  tipo: TipoMovimentacao,
  qtd: number,
) {
  if (tipo === TipoMovimentacao.AJUSTE) {
    const est = await EstoqueAtual.findOne({
      materia_prima_id: materiaId,
    }).lean();
    const atual = est?.quantidade ?? 0;
    const novo = Math.max(0, atual + qtd);
    await EstoqueAtual.findOneAndUpdate(
      { materia_prima_id: materiaId },
      { $set: { quantidade: novo } },
      { upsert: true },
    );
    return;
  }
  const inc = tipo === TipoMovimentacao.ENTRADA ? qtd : -qtd;
  await EstoqueAtual.findOneAndUpdate(
    { materia_prima_id: materiaId },
    { $inc: { quantidade: inc } },
    { upsert: true, setDefaultsOnInsert: true },
  );
}

/**
 * Regista movimentação, aplica estoque, devolve registo com matéria e utilizador.
 * Erros com `.status` 400/404 para o middleware HTTP.
 */
export async function createMovimentacao(
  body: MovimentacaoCreateInput,
  auth: { userId: string; roles: Role[] },
) {
  const qtd = Number(body.quantidade);
  const materiaIdStr = String(body.materia_prima_id);

  if (!mongoose.Types.ObjectId.isValid(materiaIdStr)) {
    const err = new Error("materia_prima_id inválido");
    (err as Error & { status: number }).status = 400;
    throw err;
  }
  const materiaOid = new mongoose.Types.ObjectId(materiaIdStr);

  let usuarioIdStr = auth.userId;
  if (auth.roles.includes(Role.ADMIN) && body.usuario_id != null) {
    const u = String(body.usuario_id).trim();
    if (u && mongoose.Types.ObjectId.isValid(u)) usuarioIdStr = u;
  }
  if (!mongoose.Types.ObjectId.isValid(usuarioIdStr)) {
    const err = new Error("Usuário (operador) inválido para esta movimentação.");
    (err as Error & { status: number }).status = 400;
    throw err;
  }
  const usuarioOid = new mongoose.Types.ObjectId(usuarioIdStr);

  const materiaExiste = await MateriaPrima.findById(materiaOid)
    .select("_id")
    .lean();
  if (!materiaExiste) {
    const err = new Error(
      "Matéria-prima não encontrada. Cadastre uma matéria-prima ou use um materia_prima_id válido (GET /materia-prima).",
    );
    (err as Error & { status: number }).status = 400;
    throw err;
  }

  const usuarioExiste = await Usuario.findById(usuarioOid).select("_id").lean();
  if (!usuarioExiste) {
    const err = new Error("Usuário (operador) não encontrado para esta movimentação.");
    (err as Error & { status: number }).status = 400;
    throw err;
  }

  if (body.tipo === TipoMovimentacao.SAIDA) {
    const estoque = await EstoqueAtual.findOne({
      materia_prima_id: materiaOid,
    }).lean();
    if (!estoque || estoque.quantidade < qtd) {
      const err = new Error("Estoque insuficiente para essa saída.");
      (err as Error & { status: number }).status = 400;
      throw err;
    }
  }

  const registro = await Movimentacao.create({
    materia_prima_id: materiaOid,
    tipo: body.tipo,
    quantidade: qtd,
    motivo: body.motivo ?? null,
    usuario_id: usuarioOid,
  });

  await aplicarEstoque(materiaOid, body.tipo, qtd);

  const populated = await Movimentacao.findById(registro._id)
    .populate({
      path: "materia_prima_id",
      select: "nome categoria unidade estoque_minimo ativo",
      options: { lean: true },
    })
    .populate({
      path: "usuario_id",
      select: "nome email",
      options: { lean: true },
    })
    .lean();

  if (!populated) {
    return { id: String(registro._id), ...registro.toObject() };
  }
  const u = usuarioFromPopulate(populated.usuario_id);
  const { _id, usuario_id, ...rest } = populated;
  return {
    ...rest,
    id: String(_id),
    usuario: u ?? { id: "", nome: "—", email: "" },
  };
}

/** Indica se o utilizador está ativo e tem perfil FUNCIONARIO (via `UsuarioPerfil`). */
export async function usuarioEhFuncionarioAtivo(
  usuarioId: string,
): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(usuarioId)) return false;
  const u = await Usuario.findById(usuarioId).lean();
  if (!u?.ativo) return false;
  const ups = await UsuarioPerfil.find({ usuario_id: u._id })
    .populate<{ perfil_id: { role: Role } }>({
      path: "perfil_id",
      select: "role",
      options: { lean: true },
    })
    .lean();
  return ups.some((up) => {
    const p = up.perfil_id;
    return p && typeof p === "object" && p.role === Role.FUNCIONARIO;
  });
}

/** Lista ordenada por data (mais recente primeiro), com matéria e `usuario` normalizado. */
export async function listMovimentacoes() {
  const rows = await Movimentacao.find()
    .populate({
      path: "materia_prima_id",
      select: "nome categoria unidade estoque_minimo ativo",
      options: { lean: true },
    })
    .populate({
      path: "usuario_id",
      select: "nome email",
      options: { lean: true },
    })
    .sort({ data_atual: -1 })
    .lean();

  return rows.map((r) => {
    const u = usuarioFromPopulate(r.usuario_id);
    const { _id, usuario_id, ...rest } = r;
    return {
      ...rest,
      id: String(_id),
      usuario: u ?? { id: "", nome: "—", email: "" },
    };
  });
}

/** Uma movimentação por id ou `null` se inválida/inexistente. */
export async function findMovimentacao(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const r = await Movimentacao.findById(id)
    .populate({
      path: "materia_prima_id",
      select: "nome categoria unidade estoque_minimo ativo",
      options: { lean: true },
    })
    .populate({
      path: "usuario_id",
      select: "nome email",
      options: { lean: true },
    })
    .lean();
  if (!r) return null;
  const u = usuarioFromPopulate(r.usuario_id);
  const { usuario_id, ...rest } = r;
  return {
    ...rest,
    id: String(r._id),
    usuario: u ?? { id: "", nome: "—", email: "" },
  };
}

/** Atualização parcial; lança 400/404 conforme validação e existência. */
export async function updateMovimentacao(
  id: string,
  data: {
    materia_prima_id?: string;
    tipo?: TipoMovimentacao;
    quantidade?: number;
    motivo?: string | null;
    usuario_id?: string;
  },
) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Id inválido") as Error & { status: number };
    err.status = 400;
    throw err;
  }
  const set: Record<string, unknown> = {};
  if (data.materia_prima_id !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(data.materia_prima_id)) {
      const err = new Error("materia_prima_id inválido") as Error & {
        status: number;
      };
      err.status = 400;
      throw err;
    }
    set.materia_prima_id = new mongoose.Types.ObjectId(data.materia_prima_id);
  }
  if (data.tipo !== undefined) set.tipo = data.tipo;
  if (data.quantidade !== undefined) set.quantidade = data.quantidade;
  if (data.motivo !== undefined) set.motivo = data.motivo;
  if (data.usuario_id !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(data.usuario_id)) {
      const err = new Error("usuario_id inválido") as Error & { status: number };
      err.status = 400;
      throw err;
    }
    set.usuario_id = new mongoose.Types.ObjectId(data.usuario_id);
  }
  const row = await Movimentacao.findByIdAndUpdate(id, { $set: set }, { new: true })
    .populate({
      path: "materia_prima_id",
      select: "nome categoria unidade estoque_minimo ativo",
      options: { lean: true },
    })
    .populate({
      path: "usuario_id",
      select: "nome",
      options: { lean: true },
    })
    .lean();
  if (!row) {
    const err = new Error("Não encontrado") as Error & { status: number };
    err.status = 404;
    throw err;
  }
  const u = usuarioFromPopulate(row.usuario_id);
  const { _id, usuario_id, ...rest } = row;
  return {
    ...rest,
    id: String(_id),
    usuario: u ?? { id: "", nome: "—", email: "" },
  };
}

/** Remove o documento; 400 se id inválido, 404 se não existir. */
export async function deleteMovimentacao(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Id inválido") as Error & { status: number };
    err.status = 400;
    throw err;
  }
  const row = await Movimentacao.findByIdAndDelete(id).lean();
  if (!row) {
    const err = new Error("Não encontrado") as Error & { status: number };
    err.status = 404;
    throw err;
  }
  return row;
}
