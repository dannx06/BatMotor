/**
 * Extensão do tipo `Request` do Express para incluir o contexto de autenticação
 * preenchido pelo middleware `authenticate` após validar o JWT.
 *
 * Isto permite, nas rotas, usar `req.auth` com tipagem segura no TypeScript.
 */
import type { Role } from "../generated/prisma/client";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: number;
        email: string;
        roles: Role[];
      };
    }
  }
}

export {};
