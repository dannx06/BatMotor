/**
 * =============================================================================
 * token.ts — JWT (assinatura e verificação)
 * =============================================================================
 * O login bem-sucedido chama signToken({ sub: id, email, roles }).
 * Cada pedido protegido envia esse token no header; verifyToken reconstrói o payload
 * ou lança (middleware devolve 401).
 *
 * Segredo e expiração vêm de config/env.ts (JWT_SECRET, JWT_EXPIRES_IN).
 * Nunca coloque senha em claro dentro do JWT — só metadados necessários à autorização.
 * Guia: docs/GUIA_PEDAGOGICO_BATMOTOR.md
 * =============================================================================
 */
import jwt from "jsonwebtoken";
import type { Role } from "../generated/prisma/client";
import { env } from "../config/env";

/** Payload mínimo carregado no JWT após o login. */
export type JwtPayload = {
  sub: number;
  email: string;
  roles: Role[];
};

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (
    typeof decoded !== "object" ||
    decoded === null ||
    !("sub" in decoded) ||
    !("email" in decoded) ||
    !("roles" in decoded)
  ) {
    throw new Error("Token inválido");
  }
  const { sub, email, roles } = decoded as Record<string, unknown>;
  let subNum: number;
  if (typeof sub === "number" && Number.isFinite(sub)) subNum = sub;
  else if (typeof sub === "string" && /^\d+$/.test(sub)) subNum = Number(sub);
  else throw new Error("Token inválido");
  if (typeof email !== "string" || !Array.isArray(roles)) {
    throw new Error("Token inválido");
  }
  return { sub: subNum, email, roles: roles as Role[] };
}
