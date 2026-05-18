/**
 * Relatórios agregados: movimentações por dia (janela configurável) e itens abaixo do estoque mínimo.
 */
import { EstoqueAtual, MateriaPrima, Movimentacao } from "../models/index";

/** Formata `YYYY-MM-DD` para rótulo `DD/MM` (exibição em PT). */
function labelDiaPt(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

/**
 * Soma entradas/saídas/ajustes por dia num intervalo [hoje − (dias−1), hoje].
 * `dias` é limitado entre 7 e 90 (default 14).
 */
export async function movimentacoesPorDia(diasParam?: number) {
  const dias = Math.min(90, Math.max(7, Number(diasParam) || 14));
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(end.getDate() - (dias - 1));
  start.setHours(0, 0, 0, 0);

  const movs = await Movimentacao.find({
    data_atual: { $gte: start },
  })
    .select("tipo quantidade data_atual")
    .sort({ data_atual: 1 })
    .lean();

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
    const key = new Date(m.data_atual).toISOString().slice(0, 10);
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
 * Matérias ativas cuja quantidade em `EstoqueAtual` (ou 0) está abaixo de `estoque_minimo`.
 */
export async function listEstoqueAbaixoMinimo() {
  const materias = await MateriaPrima.find({ ativo: true })
    .sort({ nome: 1 })
    .lean();

  const out: {
    materia_prima_id: string;
    nome: string;
    categoria: string;
    unidade: string;
    estoque_minimo: number;
    quantidade_atual: number;
    deficit: number;
  }[] = [];

  for (const m of materias) {
    const est = await EstoqueAtual.findOne({
      materia_prima_id: m._id,
    }).lean();
    const quantidade_atual = est?.quantidade ?? 0;
    const row = {
      materia_prima_id: String(m._id),
      nome: m.nome,
      categoria: m.categoria,
      unidade: m.unidade,
      estoque_minimo: m.estoque_minimo,
      quantidade_atual,
      deficit: m.estoque_minimo - quantidade_atual,
    };
    if (row.quantidade_atual < row.estoque_minimo) out.push(row);
  }
  return out;
}
