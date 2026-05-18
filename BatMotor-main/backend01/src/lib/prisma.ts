/**
 * Prisma 7.6 + MySQL 8 (Docker ou nuvem).
 * O client exige um *driver adapter*; para MySQL a Prisma 7 expõe `@prisma/adapter-mariadb`.
 *
 * Ligação:
 * - Desenvolvimento: `DATABASE_HOST` + `DATABASE_PORT` + … (como no `.env` local).
 * - Produção (ex. Render): basta `DATABASE_URL` (`mysql://user:pass@host:port/db`) — o
 *   adapter passa a usar esses valores e deixa de depender de `localhost` errado.
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

type MysqlConn = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

function parseMysqlUrl(url: string): MysqlConn | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "mysql:") return null;
    const database = u.pathname.replace(/^\//, "").split("?")[0];
    if (!database) return null;
    return {
      host: u.hostname,
      port: u.port ? Number(u.port) : 3306,
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database,
    };
  } catch {
    return null;
  }
}

function resolveMysqlConn(): MysqlConn {
  /** Prioridade à URL: no deploy costuma ser a única variável certa; evita `DATABASE_HOST=localhost` copiado do `.env` local. */
  const fromUrl = parseMysqlUrl(process.env.DATABASE_URL ?? "");
  if (fromUrl) return fromUrl;

  const explicitHost = process.env.DATABASE_HOST?.trim();
  const explicitUser = process.env.DATABASE_USER;
  const explicitDb = process.env.DATABASE_NAME?.trim();
  if (explicitHost && explicitUser && explicitDb) {
    return {
      host: explicitHost,
      port: Number(process.env.DATABASE_PORT) || 3306,
      user: explicitUser,
      password: process.env.DATABASE_PASSWORD ?? "",
      database: explicitDb,
    };
  }
  throw new Error(
    "[prisma] Defina DATABASE_URL (mysql://user:pass@host:port/nome) ou DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD e DATABASE_NAME.",
  );
}

const conn = resolveMysqlConn();

const adapter = new PrismaMariaDb({
  host: conn.host,
  port: conn.port,
  user: conn.user,
  password: conn.password,
  database: conn.database,
  connectionLimit: 5,
  /** MySQL 8 + `caching_sha2_password`: sem isso o driver pode falhar com RSA public key e o pool fica em timeout. */
  allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({ adapter });

export { prisma };
