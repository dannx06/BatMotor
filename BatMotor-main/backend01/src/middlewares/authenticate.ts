/**
 * =============================================================================
 * authenticate.ts — IDENTIDADE DO PEDIDO HTTP (JWT)
 * =============================================================================
 * O Express não “sabe” quem é o utilizador: esse papel é do JWT emitido em
 * POST /auth/login (ver auth.service + token.signToken).
 *
 * DOIS EXPORTÁVEIS:
 *   • authenticate       — obriga header Authorization: Bearer <token> (ou token no body/query
 *                          em cenários de teste); se falhar → 401 JSON.
 *   • optionalAuthenticate — se houver token válido, preenche req.auth; se não houver,
 *                            segue sem erro (usado em POST /movimentacao para aceitar
 *                            funcionário sem sessão JWT desde que envie usuario_id).
 *
 * req.auth (tipagem em types/express.d.ts): { userId, email, roles }.
 * Documentação global: docs/GUIA_PEDAGOGICO_BATMOTOR.md
 * =============================================================================
 */
import type { RequestHandler } from "express";
import { verifyToken } from "../utils/token";

/**
 * Autenticação JWT: lê o token em
 * 1) `Authorization: Bearer <token>` (recomendado, padrão REST), ou
 * 2) campo string `token` no JSON do body (útil em testes rápidos no Postman na aba Body).
 *
 * O token é o valor retornado por POST /auth/login — não é a senha de login.
 */
const msgSemToken =
  "Falta o JWT. Envie Authorization: Bearer <token> ou o campo \"token\" no body/query. " +
  "No Postman: POST, Body → raw → JSON e header Content-Type: application/json; " +
  "ou Body → x-www-form-urlencoded com os campos (incluindo token). " +
  "O token vem de POST /auth/login — não use a senha no lugar do token.";

function readJwtFromRequest(req: Parameters<RequestHandler>[0]): string | null {
  const header = req.headers.authorization;
  if (header) {
    const m = /^Bearer\s+(\S+)/i.exec(header.trim());
    if (m?.[1]) return m[1].trim();
  }
  const q = req.query.token;
  if (typeof q === "string" && q.trim()) return q.trim();

  const body = req.body;
  if (
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    typeof (body as { token?: unknown }).token === "string"
  ) {
    const t = (body as { token: string }).token.trim();
    if (t) return t;
  }
  return null;
}

export const authenticate: RequestHandler = (req, res, next) => {
  const raw = readJwtFromRequest(req);
  if (!raw) {
    return res.status(401).json({ error: msgSemToken });
  }
  try {
    const payload = verifyToken(raw);
    req.auth = {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
};

/**
 * Se houver JWT válido, preenche `req.auth`; caso contrário segue sem erro (para rotas híbridas).
 */
export const optionalAuthenticate: RequestHandler = (req, res, next) => {
  const raw = readJwtFromRequest(req);
  if (!raw) {
    return next();
  }
  try {
    const payload = verifyToken(raw);
    req.auth = {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
};
