/**
 * Modelos Mongoose da API BatMotor: schemas, índices e exportação dos `Model`.
 *
 * - Todos os schemas usam `timestamps: false`; datas explícitas aparecem onde o domínio exige
 *   (ex.: `Usuario.data_atual`, `Movimentacao.data_atual`).
 * - `idJsonPlugin` padroniza a serialização JSON: expõe `id` (string) em vez de `_id`.
 * - Enums de domínio (`Role`, `TipoMovimentacao`) vêm de `types/domain` para alinhar com a API e o seed.
 */
import mongoose, { Schema } from "mongoose";
import { Role, TipoMovimentacao } from "../types/domain";

/**
 * Plugin reutilizável: configura `toJSON` com `virtuals: true`, remove `__v` e transforma `_id` → `id` string.
 * Assim as respostas HTTP ficam com `id` estável para o frontend sem alterar os nomes dos campos no schema.
 */
function idJsonPlugin(schema: Schema) {
  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      if (ret._id != null) {
        ret.id = String(ret._id);
        delete ret._id;
      }
      return ret;
    },
  });
}

/** Entidade de demonstração / testes de CRUD (não substitui o fluxo real de utilizadores). */
const testeSchema = new Schema(
  {
    nome: { type: String, required: true },
    email: { type: String, required: true },
    senha: { type: String, required: true },
  },
  { timestamps: false },
);
idJsonPlugin(testeSchema);

/**
 * Utilizador da aplicação: credenciais e dados cadastrais.
 * `senha` deve ser persistida como hash bcrypt (ver `utils/password`); `email` e `cpf` únicos.
 */
const usuarioSchema = new Schema(
  {
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    cpf: { type: String, required: true, unique: true },
    ativo: { type: Boolean, default: true },
    /** Atualizado quando o registo muda (uso em respostas de perfil). */
    data_atual: { type: Date, default: Date.now },
  },
  { timestamps: false },
);
idJsonPlugin(usuarioSchema);

/** Módulo funcional da aplicação (menus/áreas) para amarrar permissões. */
const moduloSchema = new Schema(
  {
    nome: { type: String, required: true },
    descricao: { type: String, default: null },
  },
  { timestamps: false },
);
idJsonPlugin(moduloSchema);

/**
 * Perfil de autorização: um documento por combinação `role` + descrição opcional.
 * Regra de negócio na API: apenas um perfil `GERENTE` pode ser criado (validado no serviço).
 */
const perfilSchema = new Schema(
  {
    role: {
      type: String,
      enum: Object.values(Role),
      required: true,
    },
    descricao: { type: String, default: null },
  },
  { timestamps: false },
);
idJsonPlugin(perfilSchema);

/**
 * Catálogo de insumos: preços e stock mínimo são referência; o saldo real está em `EstoqueAtual`.
 */
const materiaPrimaSchema = new Schema(
  {
    nome: { type: String, required: true },
    categoria: { type: String, required: true },
    unidade: { type: String, required: true },
    estoque_minimo: { type: Number, required: true },
    ativo: { type: Boolean, default: true },
    observacao: { type: String, default: null },
    preco_custo: { type: Number, default: null },
    preco_venda: { type: Number, default: null },
  },
  { timestamps: false },
);
idJsonPlugin(materiaPrimaSchema);

/**
 * Fornecedor: identificação fiscal única (`cnpj`); campos extra para cadastro comercial completo.
 */
const fornecedorSchema = new Schema(
  {
    nome: { type: String, required: true },
    cnpj: { type: String, required: true, unique: true },
    email: { type: String, default: null },
    telefone: { type: String, default: null },
    ativo: { type: Boolean, default: true },
    nome_contato: { type: String, default: null },
    endereco: { type: String, default: null },
    cidade: { type: String, default: null },
    estado: { type: String, default: null },
    categoria: { type: String, default: null },
    tipo_fornecedor: { type: String, default: null },
    data_inicio: { type: String, default: null },
    condicoes_pagamento: { type: String, default: null },
    observacoes: { type: String, default: null },
    /** Data URL da logomarca (PNG/JPEG/WebP); limite aplicado no controller. */
    logo_data_url: { type: String, default: null },
  },
  { timestamps: false },
);
idJsonPlugin(fornecedorSchema);

/**
 * Associação N:N utilizador ↔ perfil (um utilizador pode ter vários perfis).
 * Índice único composto impede duplicar o mesmo par.
 */
const usuarioPerfilSchema = new Schema(
  {
    usuario_id: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    perfil_id: {
      type: Schema.Types.ObjectId,
      ref: "Perfil",
      required: true,
    },
  },
  { timestamps: false },
);
usuarioPerfilSchema.index({ usuario_id: 1, perfil_id: 1 }, { unique: true });
idJsonPlugin(usuarioPerfilSchema);

/**
 * Liga matéria-prima a fornecedor (N:N). O “fornecedor principal” na API é o primeiro por `_id` (serviço).
 * Índice único: um par (matéria, fornecedor) não se repete.
 */
const materiaFornecedorSchema = new Schema(
  {
    materia_prima_id: {
      type: Schema.Types.ObjectId,
      ref: "MateriaPrima",
      required: true,
    },
    fornecedor_id: {
      type: Schema.Types.ObjectId,
      ref: "Fornecedor",
      required: true,
    },
  },
  { timestamps: false },
);
materiaFornecedorSchema.index(
  { materia_prima_id: 1, fornecedor_id: 1 },
  { unique: true },
);
idJsonPlugin(materiaFornecedorSchema);

/**
 * Permissões granulares: para cada par (perfil, módulo), flags CRUD booleanas.
 */
const permissaoModuloSchema = new Schema(
  {
    perfil_id: {
      type: Schema.Types.ObjectId,
      ref: "Perfil",
      required: true,
    },
    modulo_id: {
      type: Schema.Types.ObjectId,
      ref: "Modulo",
      required: true,
    },
    pode_ler: { type: Boolean, default: false },
    pode_criar: { type: Boolean, default: false },
    pode_atualizar: { type: Boolean, default: false },
    pode_excluir: { type: Boolean, default: false },
  },
  { timestamps: false },
);
idJsonPlugin(permissaoModuloSchema);

/**
 * Saldo agregado por matéria-prima: uma linha por `materia_prima_id` (unique).
 * Atualizado pelas movimentações e por ajustes no serviço de movimentação.
 */
const estoqueAtualSchema = new Schema(
  {
    materia_prima_id: {
      type: Schema.Types.ObjectId,
      ref: "MateriaPrima",
      required: true,
      unique: true,
    },
    quantidade: { type: Number, default: 0 },
  },
  { timestamps: false },
);
idJsonPlugin(estoqueAtualSchema);

/**
 * Histórico de entradas, saídas e ajustes; `usuario_id` é o operador registado.
 * `data_atual` default `Date.now` na criação.
 */
const movimentacaoSchema = new Schema(
  {
    materia_prima_id: {
      type: Schema.Types.ObjectId,
      ref: "MateriaPrima",
      required: true,
    },
    tipo: {
      type: String,
      enum: Object.values(TipoMovimentacao),
      required: true,
    },
    quantidade: { type: Number, required: true },
    motivo: { type: String, default: null },
    usuario_id: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    data_atual: { type: Date, default: Date.now },
  },
  { timestamps: false },
);
idJsonPlugin(movimentacaoSchema);

export const Teste = mongoose.model("Teste", testeSchema);
export const Usuario = mongoose.model("Usuario", usuarioSchema);
export const Modulo = mongoose.model("Modulo", moduloSchema);
export const Perfil = mongoose.model("Perfil", perfilSchema);
export const MateriaPrima = mongoose.model("MateriaPrima", materiaPrimaSchema);
export const Fornecedor = mongoose.model("Fornecedor", fornecedorSchema);
export const UsuarioPerfil = mongoose.model("UsuarioPerfil", usuarioPerfilSchema);
export const MateriaFornecedor = mongoose.model(
  "MateriaFornecedor",
  materiaFornecedorSchema,
);
export const PermissaoModulo = mongoose.model(
  "PermissaoModulo",
  permissaoModuloSchema,
);
export const EstoqueAtual = mongoose.model("EstoqueAtual", estoqueAtualSchema);
export const Movimentacao = mongoose.model("Movimentacao", movimentacaoSchema);
