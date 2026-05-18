/**
 * Centralização de variáveis de ambiente usadas pela API.
 *
 * Motivo: evita espalhar `process.env` pelo código; facilita revisão e documentação
 * do que o projeto realmente precisa para subir (JWT, porta, etc.).
 */
import "dotenv/config";

const JWT_DEFAULT_DEV =
  "DEV_JWT_SECRET_SUBSTITUA_EM_PRODUCAO_MINIMO_32_CARACTERES";

export const env = {
  /** Porta HTTP do Express (ex.: 3000). */
  port: Number(process.env.PORT) || 3000,
  /**
   * Segredo para assinar o JWT. Em produção deve ser longo e aleatório.
   * Em desenvolvimento, se faltar no .env, usamos um valor fixo só para não travar a equipe,
   * mas o aviso no console lembra de configurar corretamente.
   */
  jwtSecret: process.env.JWT_SECRET?.trim() || JWT_DEFAULT_DEV,
  /** Tempo de validade do token (ex.: "8h", "15m"). */
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
} as const;

if (!process.env.JWT_SECRET?.trim()) {
  console.warn(
    "[config] JWT_SECRET não definido no .env — usando segredo de desenvolvimento. " +
      "Defina JWT_SECRET antes de colocar em produção.",
  );
}
