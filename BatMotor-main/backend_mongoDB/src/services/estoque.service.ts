/**
 * Leitura do estoque atual: agrega `EstoqueAtual` com dados da matéria-prima populada.
 * Trata matéria apagada (populate vazio) devolvendo `materia: null` e id como string.
 */
import mongoose from "mongoose";
import { EstoqueAtual } from "../models/index";

/** Forma esperada do documento populado em `materia_prima_id`. */
type MateriaPopulated = mongoose.FlattenMaps<{
  _id: mongoose.Types.ObjectId;
  nome: string;
  categoria: string;
  unidade: string;
  estoque_minimo: number;
  ativo: boolean;
}>;

/** Distingue ObjectId cru de documento populado com `_id`. */
function isPopulatedMateria(v: unknown): v is MateriaPopulated {
  return (
    v != null &&
    typeof v === "object" &&
    "_id" in v &&
    (v as { _id?: unknown })._id != null
  );
}

/**
 * Lista todas as linhas de estoque; cada item tem `id`, `materia_prima_id` string,
 * snapshot em `materia` ou `null` se a referência estiver órfã.
 */
export async function listEstoqueAtual() {
  const rows = await EstoqueAtual.find()
    .populate({ path: "materia_prima_id", options: { lean: true } })
    .lean();

  return rows.map((r) => {
    const { _id, materia_prima_id: mpRaw, ...rest } = r;
    const m = isPopulatedMateria(mpRaw) ? mpRaw : null;

    /** populate pode devolver `null`/vazio se a matéria-prima foi apagada (registo órfão em estoqueatuals). */
    const materia_prima_id = m ? String(m._id) : mpRaw != null ? String(mpRaw) : "";

    if (!m) {
      return {
        ...rest,
        id: String(_id),
        materia_prima_id,
        materia: null,
      };
    }

    return {
      ...rest,
      id: String(_id),
      materia_prima_id,
      materia: {
        id: String(m._id),
        nome: m.nome,
        categoria: m.categoria,
        unidade: m.unidade,
        estoque_minimo: m.estoque_minimo,
        ativo: m.ativo,
      },
    };
  });
}
