/**
 * Dados para desenvolvimento: perfis ADMIN, GERENTE, FUNCIONARIO e usuários de exemplo.
 * Execute: `npx prisma db seed` (MySQL no ar + `.env`).
 */
import "dotenv/config";
import type { Role } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/utils/password";

const usuariosSeed = [
  {
    email: "admin@batmotor.com",
    senha: "adminbatmotor",
    nome: "Administrador BatMotor",
    cpf: "00000000191",
    role: "ADMIN" as Role,
  },
  {
    email: "gerente.dev@batmotor.local",
    senha: "gerentebatmotor",
    nome: "Gerente (dev)",
    cpf: "11144477735",
    role: "GERENTE" as Role,
  },
  {
    email: "funcionario.dev@batmotor.local",
    senha: "funcionariobatmotor",
    nome: "Funcionário Almoxarifado (dev)",
    cpf: "39053344705",
    role: "FUNCIONARIO" as Role,
  },
];

async function ensurePerfil(role: Role, descricao: string) {
  let p = await prisma.perfil.findFirst({ where: { role } });
  if (!p) {
    p = await prisma.perfil.create({
      data: { role, descricao },
    });
  }
  return p;
}

/** Cria ou atualiza usuário por e-mail; reaproveita linha se o CPF de dev já existir com outro e-mail. */
async function ensureUsuarioDev(input: {
  email: string;
  senhaPlain: string;
  nome: string;
  cpf: string;
}) {
  const senhaHash = await hashPassword(input.senhaPlain);
  const porEmail = await prisma.usuario.findUnique({
    where: { email: input.email },
  });
  const porCpf = await prisma.usuario.findUnique({
    where: { cpf: input.cpf },
  });

  /* Não repõe senha em utilizador já existente — permite correr seed em cada deploy sem apagar passwords em produção. */
  if (porEmail) {
    return prisma.usuario.update({
      where: { id: porEmail.id },
      data: { nome: input.nome, ativo: true },
    });
  }
  if (porCpf) {
    return prisma.usuario.update({
      where: { id: porCpf.id },
      data: {
        email: input.email,
        nome: input.nome,
        ativo: true,
      },
    });
  }
  return prisma.usuario.create({
    data: {
      email: input.email,
      nome: input.nome,
      senha: senhaHash,
      cpf: input.cpf,
      ativo: true,
    },
  });
}

async function vincularPerfil(usuarioId: number, perfilId: number) {
  const existe = await prisma.usuarioPerfil.findUnique({
    where: {
      usuario_id_perfil_id: { usuario_id: usuarioId, perfil_id: perfilId },
    },
  });
  if (!existe) {
    await prisma.usuarioPerfil.create({
      data: { usuario_id: usuarioId, perfil_id: perfilId },
    });
  }
}

async function main() {
  const perfilPorRole = new Map<Role, { id: number }>();

  for (const role of ["ADMIN", "GERENTE", "FUNCIONARIO"] as Role[]) {
    const p = await ensurePerfil(role, `Perfil ${role} (seed)`);
    perfilPorRole.set(role, p);
  }

  for (const u of usuariosSeed) {
    const usuario = await ensureUsuarioDev({
      email: u.email,
      senhaPlain: u.senha,
      nome: u.nome,
      cpf: u.cpf,
    });
    const perfil = perfilPorRole.get(u.role);
    if (perfil) await vincularPerfil(usuario.id, perfil.id);
  }

  const mpDev = await prisma.materiaPrima.findFirst({
    where: { nome: "Parafuso M8 zincado (dev)" },
  });
  if (!mpDev) {
    await prisma.materiaPrima.create({
      data: {
        nome: "Parafuso M8 zincado (dev)",
        categoria: "Fixação",
        unidade: "UN",
        estoque_minimo: 100,
        ativo: true,
      },
    });
    console.log(
      "[seed] Matéria-prima de exemplo criada (use o id retornado por GET /materia-prima ou o primeiro id após migrate).",
    );
  }

  console.log("[seed] Usuários de desenvolvimento (login → JWT por 8h ou o que estiver no .env):");
  for (const u of usuariosSeed) {
    console.log(`  • ${u.role.padEnd(12)} ${u.email} / ${u.senha}`);
  }
  console.log(
    "[seed] Funcionário: POST /movimentacao (entrada/saída). Gerente: fornecedores/matérias. Admin: tudo.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
