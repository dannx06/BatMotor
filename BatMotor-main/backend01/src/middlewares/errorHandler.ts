/**
 * =============================================================================
 * errorHandler.ts — RESPOSTA JSON UNIFORME PARA ERROS
 * =============================================================================
 * Executado após todas as rotas (ver app.ts). Recebe err de next(err) ou throws
 * capturados pelo asyncHandler.
 *
 * Preferências de mapeamento:
 *   • err.status (400–599) → mesmo status + err.message
 *   • Prisma: P2002 duplicado, P2025 não encontrado, P2003 FK inválida
 *   • Caso contrário → 500 genérico (detalhe interno no console, não exposto).
 * =============================================================================
 */
import type { ErrorRequestHandler } from "express";

/**
 * Último middleware do Express: captura erros passados a `next(err)` ou não tratados.
 *
 * Observação didática: em handlers `async`, use `asyncHandler` para garantir que
 * `reject`/`throw` chegue aqui; caso contrário o cliente pode ficar pendurado.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("[error]", err);

  if (typeof err === "object" && err !== null && "status" in err) {
    const status = Number((err as { status: unknown }).status);
    const message =
      err instanceof Error ? err.message : "Erro na requisição";
    if (status >= 400 && status < 600) {
      return res.status(status).json({ error: message });
    }
  }

  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code: unknown }).code)
      : "";

  if (code === "P2002") {
    return res
      .status(409)
      .json({ error: "Registro duplicado (violação de campo único)" });
  }
  if (code === "P2025") {
    return res.status(404).json({ error: "Registro não encontrado" });
  }
  if (code === "P2003") {
    return res.status(400).json({ error: "Referência inválida (FK)" });
  }

  const status =
    typeof err === "object" && err !== null && "status" in err
      ? Number((err as { status: unknown }).status)
      : 500;
  const message =
    typeof err === "object" && err !== null && "message" in err
      ? String((err as { message: unknown }).message)
      : "Erro interno do servidor";

  if (status >= 400 && status < 600) {
    return res.status(status).json({ error: message });
  }

  return res.status(500).json({ error: "Erro interno do servidor" });
};
