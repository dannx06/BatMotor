/**
 * =============================================================================
 * asyncHandler.ts — PROMESSES NAS CONTROLLERS EXPRESS
 * =============================================================================
 * Handlers async que fazem `throw` ou `return Promise.reject` SEM este wrapper
 * podem deixar o cliente sem resposta (erro “não visto” pelo Express).
 *
 * Padrão nas rotas: asyncHandler(controllerFn) — qualquer rejeição passa a next(err)
 * e cai em middlewares/errorHandler.ts.
 *
 * Guia: docs/GUIA_PEDAGOGICO_BATMOTOR.md
 * =============================================================================
 */
import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Aceita handlers que retornem `res.json()` (Promise com valor) ou `void`;
 * o TypeScript usa Promise<unknown> para compatibilidade com ambos.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
}
