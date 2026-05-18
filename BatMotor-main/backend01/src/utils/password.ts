import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

/**
 * Gera hash bcrypt para persistir `Usuario.senha` no banco.
 * Regra de negócio: nunca armazenar senha em texto puro.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * Compara senha informada no login com o valor salvo no banco.
 *
 * Compatibilidade: registros antigos em texto puro ainda funcionam uma vez;
 * o ideal é migrar todos para bcrypt (redefinição de senha ou script pontual).
 */
export async function verifyPassword(
  plain: string,
  stored: string,
): Promise<boolean> {
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$")) {
    return bcrypt.compare(plain, stored);
  }
  return plain === stored;
}
