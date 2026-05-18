/**
 * =============================================================================
 * relatorio.controller.ts — RELATÓRIOS E ALERTAS (stocks + gráficos)
 * =============================================================================
 * estoqueBaixo          → lista itens com quantidade < mínimo (service agrega Prisma).
 * movimentacoesPorDia   → query ?dias=N para o Recharts no dashboard.
 * estoqueBaixoEnviarEmail → envia e-mail (SMTP no .env); 503 se não configurado.
 *
 * Lógica pesada: relatorio.service.ts, alertaComprasEmail.service.ts, email.service.ts
 * Guia: docs/GUIA_PEDAGOGICO_BATMOTOR.md
 * =============================================================================
 */
import type { Request, Response } from "express";
import * as alertaEmail from "../services/alertaComprasEmail.service";
import { isAlertEmailConfigured } from "../services/email.service";
import * as svc from "../services/relatorio.service";

/** GET /relatorios/estoque-baixo — dados para relatório / alertas à equipe de compras. */
export async function estoqueBaixo(_req: Request, res: Response) {
  const rows = await svc.listEstoqueAbaixoMinimo();
  return res.status(200).json({
    gerado_em: new Date().toISOString(),
    total_alertas: rows.length,
    itens: rows,
  });
}

/** GET /relatorios/movimentacoes-por-dia?dias=14 — série real entrada/saída/ajuste para gráficos. */
export async function movimentacoesPorDia(req: Request, res: Response) {
  const diasRaw = req.query.dias;
  const dias =
    typeof diasRaw === "string"
      ? Number(diasRaw)
      : Array.isArray(diasRaw)
        ? Number(diasRaw[0])
        : undefined;
  const serie = await svc.movimentacoesPorDia(
    Number.isFinite(dias) ? dias : undefined,
  );
  return res.status(200).json({
    gerado_em: new Date().toISOString(),
    dias: serie.length,
    serie,
  });
}

/**
 * POST /relatorios/estoque-baixo/enviar-email
 * Dispara e-mail para ALERT_EMAIL_TO com lista de itens abaixo do mínimo (requisito Batmotor / compras).
 */
export async function estoqueBaixoEnviarEmail(_req: Request, res: Response) {
  if (!isAlertEmailConfigured()) {
    return res.status(503).json({
      error:
        "Envio de e-mail não configurado. Defina SMTP_HOST e ALERT_EMAIL_TO no .env (opcional: SMTP_USER, SMTP_PASS, SMTP_PORT, SMTP_FROM).",
      configurado: false,
    });
  }
  try {
    const result = await alertaEmail.enviarEmailAlertaCompras();
    return res.status(200).json({
      message: "E-mail de alerta enviado.",
      configurado: true,
      ...result,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha ao enviar e-mail.";
    return res.status(500).json({ error: msg, configurado: true });
  }
}
