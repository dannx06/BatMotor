/**
 * Inicialização e encerramento da ligação **MongoDB** via **Mongoose**.
 *
 * - Carrega variáveis de ambiente com `dotenv/config` (o `.env` na raiz do `backend_mongoDB` deve definir `MONGODB_URI`).
 * - `connectDb` é chamado no arranque do servidor (`main.ts` / `app.ts`); `disconnectDb` pode ser usado em shutdown gracioso ou testes.
 * - A URI completa é registada em consola com credenciais **mascaradas** (evita vazar password em logs).
 */
import "dotenv/config";
import mongoose from "mongoose";

/**
 * Abre a ligação default do Mongoose à base indicada por `process.env.MONGODB_URI`.
 *
 * @throws {Error} Se `MONGODB_URI` estiver vazia ou ausente.
 *
 * Exemplos de URI: `mongodb://127.0.0.1:27017/batmotor` ou
 * `mongodb+srv://user:pass@cluster.mongodb.net/batmotor` (user/pass na string).
 */
export async function connectDb(): Promise<void> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error(
      "[mongo] Defina MONGODB_URI no .env (ex.: mongodb://127.0.0.1:27017/batmotor)",
    );
  }
  await mongoose.connect(uri);
  /** Substitui `user:password@` por `user:****@` em URIs com credenciais (não altera o host nem a base). */
  console.log("[mongo] ligado a", uri.replace(/:[^:@/]+@/, ":****@"));
}

/**
 * Fecha sockets e liberta recursos do driver; útil antes de sair do processo ou entre suites de teste
 * que levantam o servidor várias vezes.
 */
export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
