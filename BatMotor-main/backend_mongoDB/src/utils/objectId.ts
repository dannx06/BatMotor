/**
 * Helpers para **ids** vindos de rotas Express e validação de ObjectId MongoDB.
 *
 * Os parâmetros de rota (`req.params.id`) no Express 5 podem ser `string` ou `string[]`;
 * estes utilitários normalizam e validam antes de consultas Mongoose.
 */
import mongoose from "mongoose";

/**
 * Normaliza um parâmetro de rota para uma única string.
 *
 * - `undefined` → `undefined` (rota opcional ou parâmetro em falta).
 * - array (ex.: query duplicada) → primeiro elemento.
 */
export function paramId(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Indica se `id` é uma string não vazia e **aceite** por `mongoose.Types.ObjectId.isValid`.
 *
 * Nota: `isValid` pode ser verdadeiro para algumas strings de 12 caracteres que não são ObjectIds
 * reais; em rotas críticas convém ainda verificar existência do documento na base.
 */
export function isValidObjectId(id: string | undefined | null): id is string {
  return Boolean(id && mongoose.Types.ObjectId.isValid(id));
}
