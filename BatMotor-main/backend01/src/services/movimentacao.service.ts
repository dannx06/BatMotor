import { prisma } from "../lib/prisma";
import { Role, TipoMovimentacao } from "../generated/prisma/client";

export type MovimentacaoCreateInput = {
  materia_prima_id: number;
  tipo: TipoMovimentacao;
  quantidade: number;
  motivo?: string | null;
  /** Opcional: só administrador pode registrar em nome de outro usuário. */
  usuario_id?: number;
};

/**
 * Registra movimento no histórico e atualiza `EstoqueAtual` (padrão do projeto dos colegas).
 *
 * Regras:
 * - SAÍDA bloqueada se não houver quantidade suficiente em estoque.
 * - `usuario_id` efetivo: corpo da requisição só se `authRoles` contiver ADMIN;
 *   caso contrário usa sempre o usuário logado (evita funcionário “forjar” operador).
 */
export async function createMovimentacao(
  body: MovimentacaoCreateInput,
  auth: { userId: number; roles: Role[] },
) {
  const qtd = Number(body.quantidade);
  const materiaId = Number(body.materia_prima_id);

  const usuarioId =
    auth.roles.includes(Role.ADMIN) && body.usuario_id != null
      ? Number(body.usuario_id)
      : auth.userId;

  const materiaExiste = await prisma.materiaPrima.findUnique({
    where: { id: materiaId },
    select: { id: true },
  });
  if (!materiaExiste) {
    const err = new Error(
      "Matéria-prima não encontrada. Cadastre uma matéria-prima ou use um materia_prima_id válido (ex.: liste GET /materia-prima).",
    );
    (err as Error & { status: number }).status = 400;
    throw err;
  }

  const usuarioExiste = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true },
  });
  if (!usuarioExiste) {
    const err = new Error("Usuário (operador) não encontrado para esta movimentação.");
    (err as Error & { status: number }).status = 400;
    throw err;
  }

  if (body.tipo === TipoMovimentacao.SAIDA) {
    const estoque = await prisma.estoqueAtual.findUnique({
      where: { materia_prima_id: materiaId },
    });
    if (!estoque || estoque.quantidade < qtd) {
      const err = new Error("Estoque insuficiente para essa saída.");
      (err as Error & { status: number }).status = 400;
      throw err;
    }
  }

  const registro = await prisma.movimentacao.create({
    data: {
      materia_prima_id: materiaId,
      tipo: body.tipo,
      quantidade: qtd,
      motivo: body.motivo ?? null,
      usuario_id: usuarioId,
    },
    include: {
      materia: true,
      usuario: { select: { id: true, nome: true, email: true } },
    },
  });

  if (body.tipo === TipoMovimentacao.AJUSTE) {
    const estoque = await prisma.estoqueAtual.findUnique({
      where: { materia_prima_id: materiaId },
    });
    const atual = estoque?.quantidade ?? 0;
    const novo = Math.max(0, atual + qtd);
    await prisma.estoqueAtual.upsert({
      where: { materia_prima_id: materiaId },
      update: { quantidade: novo },
      create: { materia_prima_id: materiaId, quantidade: novo },
    });
  } else {
    await prisma.estoqueAtual.upsert({
      where: { materia_prima_id: materiaId },
      update: {
        quantidade:
          body.tipo === TipoMovimentacao.ENTRADA
            ? { increment: qtd }
            : { decrement: qtd },
      },
      create: {
        materia_prima_id: materiaId,
        quantidade: body.tipo === TipoMovimentacao.ENTRADA ? qtd : 0,
      },
    });
  }

  return registro;
}

/** Para `POST /movimentacao` sem JWT: só aceita id de usuário ativo com papel FUNCIONARIO. */
export async function usuarioEhFuncionarioAtivo(usuarioId: number): Promise<boolean> {
  const u = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: {
      usuarioPerfis: { include: { perfil: { select: { role: true } } } },
    },
  });
  if (!u?.ativo) return false;
  return u.usuarioPerfis.some((up) => up.perfil.role === Role.FUNCIONARIO);
}

export function listMovimentacoes() {
  return prisma.movimentacao.findMany({
    include: {
      materia: true,
      usuario: { select: { id: true, nome: true, email: true } },
    },
    orderBy: { data_atual: "desc" },
  });
}

export function findMovimentacao(id: number) {
  return prisma.movimentacao.findUnique({
    where: { id },
    include: {
      materia: true,
      usuario: { select: { id: true, nome: true, email: true } },
    },
  });
}

/**
 * ATENÇÃO didática: atualizar movimentação sem recalcular todo o estoque
 * pode deixar `EstoqueAtual` inconsistente. Mantido para compatibilidade com a API antiga;
 * em produção real normalmente proíbe edição ou reprocessa movimentos via job transacional.
 */
export function updateMovimentacao(
  id: number,
  data: {
    materia_prima_id?: number;
    tipo?: TipoMovimentacao;
    quantidade?: number;
    motivo?: string | null;
    usuario_id?: number;
  },
) {
  return prisma.movimentacao.update({
    where: { id },
    data: {
      materia_prima_id: data.materia_prima_id,
      tipo: data.tipo,
      quantidade: data.quantidade,
      motivo: data.motivo,
      usuario_id: data.usuario_id,
    },
    include: {
      materia: true,
      usuario: { select: { id: true, nome: true } },
    },
  });
}

export function deleteMovimentacao(id: number) {
  return prisma.movimentacao.delete({ where: { id } });
}
