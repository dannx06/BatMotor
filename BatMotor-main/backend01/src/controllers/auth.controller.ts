/**
 * =============================================================================
 * auth.controller.ts — ENTRADA PÚBLICA (login)
 * =============================================================================
 * Única responsabilidade: ler email/senha do body, delegar auth.service.login,
 * devolver 200 + token ou deixar o erro propagar (errorHandler traduz status).
 * Não contém regra de negócio pesada — só validação mínima de campos obrigatórios.
 * =============================================================================
 */
import type { Request, Response } from "express";
import * as authService from "../services/auth.service";

/**
 * POST /auth/login — rota pública.
 * Corpo JSON: { "email": "...", "senha": "..." }
 * Resposta: { token, user } — o front guarda o token e envia Authorization: Bearer nas rotas protegidas.
 */
export async function login(req: Request, res: Response) {
  const { email, senha } = req.body ?? {};
  if (!email || !senha) {
    return res.status(400).json({ error: "Informe e-mail e senha" });
  }
  const result = await authService.login(String(email), String(senha));
  return res.status(200).json(result);
}
