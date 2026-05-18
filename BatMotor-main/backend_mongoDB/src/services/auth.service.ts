/**
 * Autenticação: valida credenciais, perfis (`UsuarioPerfil` + `Perfil`) e emite JWT (`signToken`).
 */
import mongoose from "mongoose";
import { verifyPassword } from "../utils/password";
import { signToken } from "../utils/token";
import type { Role } from "../types/domain";
import { Usuario, UsuarioPerfil } from "../models/index";

/**
 * Login por e-mail/senha. 401 credenciais, 403 inativo; token inclui `roles` agregadas.
 */
export async function login(email: string, senha: string) {
  const usuario = await Usuario.findOne({ email }).lean();
  if (!usuario) {
    const err = new Error("E-mail ou senha inválidos");
    (err as Error & { status: number }).status = 401;
    throw err;
  }

  if (!usuario.ativo) {
    const err = new Error("Usuário inativo");
    (err as Error & { status: number }).status = 403;
    throw err;
  }

  const ok = await verifyPassword(senha, usuario.senha);
  if (!ok) {
    const err = new Error("E-mail ou senha inválidos");
    (err as Error & { status: number }).status = 401;
    throw err;
  }

  const ups = await UsuarioPerfil.find({ usuario_id: usuario._id })
    .populate<{ perfil_id: { role: Role } }>({
      path: "perfil_id",
      select: "role",
      options: { lean: true },
    })
    .lean();

  const roles: Role[] = ups.map((up) => {
    const p = up.perfil_id;
    if (p && typeof p === "object" && "role" in p) return p.role as Role;
    return "FUNCIONARIO" as Role;
  });

  const idStr = String(usuario._id);
  const token = signToken({
    sub: idStr,
    email: usuario.email,
    roles,
  });

  return {
    token,
    user: {
      id: idStr,
      nome: usuario.nome,
      email: usuario.email,
      roles,
    },
  };
}
