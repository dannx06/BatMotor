/**
 * Utilizadores: CRUD, unicidade e-mail/CPF, atribuição de perfil na criação (não-ADMIN),
 * e agregação de perfis para resposta JSON (`UsuarioComPerfisJson`).
 */
import mongoose from "mongoose";
import { Role } from "../types/domain";
import {
  Movimentacao,
  Perfil,
  Usuario,
  UsuarioPerfil,
} from "../models/index";
import { hashPassword } from "../utils/password";

/** Utilizador com lista de perfis (ids e roles) para a API. */
export type UsuarioComPerfisJson = {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  ativo: boolean;
  data_atual: Date;
  usuarioPerfis: {
    perfil_id: string;
    perfil: { id: string; role: Role };
  }[];
};

/** Carrega `UsuarioPerfil` populado e monta o DTO usado em list/find/create. */
async function shapeUsuarioComPerfis(
  u: mongoose.FlattenMaps<{
    _id: mongoose.Types.ObjectId;
    nome: string;
    email: string;
    cpf: string;
    ativo: boolean;
    data_atual: Date;
  }>,
): Promise<UsuarioComPerfisJson> {
  const ups = await UsuarioPerfil.find({ usuario_id: u._id })
    .populate<{ perfil_id: { _id: mongoose.Types.ObjectId; role: Role } }>({
      path: "perfil_id",
      select: "role",
      options: { lean: true },
    })
    .lean();

  const usuarioPerfis = ups.map((up) => {
    const p = up.perfil_id;
    const pid = p && typeof p === "object" && "_id" in p ? p._id : null;
    const role = p && typeof p === "object" && "role" in p ? p.role : Role.FUNCIONARIO;
    return {
      perfil_id: pid ? String(pid) : "",
      perfil: { id: pid ? String(pid) : "", role: role as Role },
    };
  });

  return {
    id: String(u._id),
    nome: u.nome,
    email: u.email,
    cpf: u.cpf,
    ativo: u.ativo,
    data_atual: u.data_atual,
    usuarioPerfis,
  };
}

/** Roles de todos os perfis do utilizador; perfil em falta assume FUNCIONARIO. */
export async function getRolesForUsuario(userId: string): Promise<Role[]> {
  if (!mongoose.Types.ObjectId.isValid(userId)) return [];
  const oid = new mongoose.Types.ObjectId(userId);
  const ups = await UsuarioPerfil.find({ usuario_id: oid })
    .populate<{ perfil_id: { role: Role } }>({
      path: "perfil_id",
      select: "role",
      options: { lean: true },
    })
    .lean();
  return ups.map((up) => {
    const p = up.perfil_id;
    if (p && typeof p === "object" && "role" in p) return p.role as Role;
    return Role.FUNCIONARIO;
  });
}

/** Erro HTTP 409 para e-mail/CPF duplicado. */
function conflictError(message: string) {
  const err = new Error(message) as Error & { status: number };
  err.status = 409;
  return err;
}

/** Garante unicidade de e-mail e CPF (opcionalmente excluindo um `_id` na edição). */
async function ensureUsuarioUniqueFields(data: {
  email?: string;
  cpf?: string;
  excludeId?: string;
}) {
  const { email, cpf, excludeId } = data;
  const excludeOid =
    excludeId && mongoose.Types.ObjectId.isValid(excludeId)
      ? new mongoose.Types.ObjectId(excludeId)
      : null;

  if (email !== undefined && email !== "") {
    const q: mongoose.FilterQuery<typeof Usuario> = { email };
    if (excludeOid) q._id = { $ne: excludeOid };
    const byEmail = await Usuario.findOne(q).select("_id ativo").lean();
    if (byEmail) {
      throw conflictError(
        `E-mail já utilizado por outro usuário (id ${String(byEmail._id)}${byEmail.ativo ? "" : ", inativo"})`,
      );
    }
  }

  if (cpf !== undefined && cpf !== "") {
    const q: mongoose.FilterQuery<typeof Usuario> = { cpf };
    if (excludeOid) q._id = { $ne: excludeOid };
    const byCpf = await Usuario.findOne(q).select("_id ativo").lean();
    if (byCpf) {
      throw conflictError(
        `CPF já utilizado por outro usuário (id ${String(byCpf._id)}${byCpf.ativo ? "" : ", inativo"})`,
      );
    }
  }
}

/** Todos os utilizadores ordenados por nome, cada um com perfis. */
export async function listUsuarios(): Promise<UsuarioComPerfisJson[]> {
  const rows = await Usuario.find().sort({ nome: 1 }).lean();
  const out: UsuarioComPerfisJson[] = [];
  for (const u of rows) {
    out.push(await shapeUsuarioComPerfis(u));
  }
  return out;
}

/** Detalhe por id ou `null` se inválido/inexistente. */
export async function findUsuario(
  id: string,
): Promise<UsuarioComPerfisJson | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const u = await Usuario.findById(id).lean();
  if (!u) return null;
  return shapeUsuarioComPerfis(u);
}

/**
 * Cria utilizador com hash de senha; opcionalmente liga perfil GERENTE ou FUNCIONARIO (seed necessário).
 * Não permite criar ADMIN por esta rota.
 */
export async function createUsuario(data: {
  nome: string;
  email: string;
  senha: string;
  cpf: string;
  ativo?: boolean;
  perfil_role?: Role;
}): Promise<UsuarioComPerfisJson> {
  await ensureUsuarioUniqueFields({ email: data.email, cpf: data.cpf });
  const senhaHash = await hashPassword(data.senha);

  if (data.perfil_role === Role.ADMIN) {
    const err = new Error(
      "Não é permitido criar outro administrador por esta rota.",
    ) as Error & { status: number };
    err.status = 400;
    throw err;
  }

  const created = await Usuario.create({
    nome: data.nome,
    email: data.email,
    senha: senhaHash,
    cpf: data.cpf,
    ativo: data.ativo ?? true,
  });

  if (data.perfil_role) {
    if (
      data.perfil_role !== Role.GERENTE &&
      data.perfil_role !== Role.FUNCIONARIO
    ) {
      const err = new Error("perfil_role deve ser GERENTE ou FUNCIONARIO") as Error & {
        status: number;
      };
      err.status = 400;
      throw err;
    }
    const perfil = await Perfil.findOne({ role: data.perfil_role }).lean();
    if (!perfil) {
      const err = new Error(
        `Perfil ${data.perfil_role} não encontrado. Execute npm run db:seed.`,
      ) as Error & { status: number };
      err.status = 400;
      throw err;
    }
    await UsuarioPerfil.create({
      usuario_id: created._id,
      perfil_id: perfil._id,
    });
  }

  const u = await Usuario.findById(created._id).lean();
  if (!u) throw new Error("Falha ao recarregar usuário");
  return shapeUsuarioComPerfis(u);
}

/** Atualiza dados e senha; valida unicidade; resposta sem lista de perfis. */
export async function updateUsuario(
  id: string,
  data: {
    nome?: string;
    email?: string;
    senha?: string;
    cpf?: string;
    ativo?: boolean;
  },
) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Id inválido") as Error & { status: number };
    err.status = 400;
    throw err;
  }
  await ensureUsuarioUniqueFields({
    email: data.email,
    cpf: data.cpf,
    excludeId: id,
  });

  const senha =
    data.senha !== undefined ? await hashPassword(data.senha) : undefined;
  const updated = await Usuario.findByIdAndUpdate(
    id,
    {
      $set: {
        ...(data.nome !== undefined ? { nome: data.nome } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.cpf !== undefined ? { cpf: data.cpf } : {}),
        ...(data.ativo !== undefined ? { ativo: data.ativo } : {}),
        ...(senha ? { senha } : {}),
      },
    },
    { new: true, runValidators: true },
  )
    .select("nome email cpf ativo data_atual")
    .lean();

  if (!updated) {
    const err = new Error("Usuário não encontrado") as Error & { status: number };
    err.status = 404;
    throw err;
  }
  return {
    id: String(updated._id),
    nome: updated.nome,
    email: updated.email,
    cpf: updated.cpf,
    ativo: updated.ativo,
    data_atual: updated.data_atual,
  };
}

/** Apaga movimentações e vínculos de perfil deste utilizador, depois o `Usuario`. */
export async function deleteUsuario(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error("Id inválido") as Error & { status: number };
    err.status = 400;
    throw err;
  }
  const oid = new mongoose.Types.ObjectId(id);
  await Movimentacao.deleteMany({ usuario_id: oid });
  await UsuarioPerfil.deleteMany({ usuario_id: oid });
  const removed = await Usuario.findByIdAndDelete(id).lean();
  if (!removed) {
    const err = new Error("Usuário não encontrado") as Error & { status: number };
    err.status = 404;
    throw err;
  }
  return removed;
}
