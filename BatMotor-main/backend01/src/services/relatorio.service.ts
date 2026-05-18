import { prisma } from "../lib/prisma";

function labelDiaPt(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

/**
 * Série diária de quantidades movimentadas (entrada vs saída vs ajuste) para gráficos do painel.
 * @param diasParam número de dias até hoje (7–90, padrão 14)
 */
export async function movimentacoesPorDia(diasParam?: number) {
  const dias = Math.min(90, Math.max(7, Number(diasParam) || 14));
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(end.getDate() - (dias - 1));
  start.setHours(0, 0, 0, 0);

  const movs = await prisma.movimentacao.findMany({
    where: { data_atual: { gte: start } },
    select: { tipo: true, quantidade: true, data_atual: true },
    orderBy: { data_atual: "asc" },
  });

  const map = new Map<
    string,
    { entrada: number; saida: number; ajuste: number }
  >();
  for (let i = 0; i < dias; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    map.set(key, { entrada: 0, saida: 0, ajuste: 0 });
  }

  for (const m of movs) {
    const key = m.data_atual.toISOString().slice(0, 10);
    const cell = map.get(key);
    if (!cell) continue;
    if (m.tipo === "ENTRADA") cell.entrada += m.quantidade;
    else if (m.tipo === "SAIDA") cell.saida += m.quantidade;
    else if (m.tipo === "AJUSTE") cell.ajuste += m.quantidade;
  }

  return Array.from(map.entries()).map(([data_iso, v]) => ({
    data_iso,
    label: labelDiaPt(data_iso),
    entrada: v.entrada,
    saida: v.saida,
    ajuste: v.ajuste,
  }));
}

/**
 * Insumos ativos com saldo abaixo do mínimo de segurança (alerta para compras / reabastecimento).
 */
export async function listEstoqueAbaixoMinimo() {
  const materias = await prisma.materiaPrima.findMany({
    where: { ativo: true },
    include: { estoque: true },
    orderBy: { nome: "asc" },
  });

  return materias
    .map((m) => {
      const quantidade_atual = m.estoque?.quantidade ?? 0;
      return {
        materia_prima_id: m.id,
        nome: m.nome,
        categoria: m.categoria,
        unidade: m.unidade,
        estoque_minimo: m.estoque_minimo,
        quantidade_atual,
        deficit: m.estoque_minimo - quantidade_atual,
      };
    })
    .filter((r) => r.quantidade_atual < r.estoque_minimo);
}
