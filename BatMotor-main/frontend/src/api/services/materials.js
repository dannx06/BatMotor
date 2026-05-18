/**
 * Matérias-prima e estoque: junta `GET /materia-prima` com `GET /estoque-atual` no remoto;
 * CRUD mapeado com `batmotorAdapters` (`mapMaterialFromApi`).
 */
import { api, getUseMock } from "../client.js";
import { mockDb, mockDelay } from "../mock/store.js";
import { mapMaterialFromApi } from "../batmotorAdapters.js";

async function fetchMaterialsRemote(params = {}) {
  const query = {};
  if (params.categoria) query.categoria = params.categoria;
  if (params.busca) query.busca = params.busca;
  if (params.ativo === true) query.ativo = "true";
  if (params.ativo === false) query.ativo = "false";
  const { data: materias } = await api.get("/materia-prima", {
    params: Object.keys(query).length ? query : undefined
  });
  const { data: estoqueRows } = await api.get("/estoque-atual");
  const list = Array.isArray(materias) ? materias : [];
  const saldoByMateria = Object.fromEntries(
    (Array.isArray(estoqueRows) ? estoqueRows : []).map((r) => [r.materia_prima_id, r.quantidade])
  );
  return list.map((row) => mapMaterialFromApi(row, Number(saldoByMateria[row.id]) || 0));
}

export async function fetchMaterials(params = {}) {
  if (getUseMock()) {
    await mockDelay();
    const term = String(params.search || "").toLowerCase();
    if (!term) return [...mockDb.materials];
    return mockDb.materials.filter(
      (m) => m.name.toLowerCase().includes(term) || m.category.toLowerCase().includes(term)
    );
  }
  const all = await fetchMaterialsRemote(params);
  const term = String(params.search || "").toLowerCase();
  if (!term) return all;
  return all.filter(
    (m) => m.name.toLowerCase().includes(term) || m.category.toLowerCase().includes(term)
  );
}

export async function createMaterial(payload) {
  if (getUseMock()) {
    await mockDelay();
    const newItem = {
      id: `m${Date.now()}`,
      name: payload.name,
      category: payload.category,
      unit: payload.unit || "kg",
      minStock: Number(payload.minStock) || 0,
      currentStock: Number(payload.currentStock) || 0,
      supplierId: payload.supplierId || null,
      active: payload.active !== false
    };
    mockDb.materials.unshift(newItem);
    return newItem;
  }
  const body = {
    nome: payload.name,
    categoria: payload.category,
    unidade: payload.unit || "kg",
    estoque_minimo: Number(payload.minStock) || 0,
    ativo: payload.active !== false
  };
  const { data } = await api.post("/materia-prima", body);
  let saldo = 0;
  try {
    const { data: estoqueRows } = await api.get("/estoque-atual");
    const row = (Array.isArray(estoqueRows) ? estoqueRows : []).find((r) => r.materia_prima_id === data.id);
    if (row) saldo = Number(row.quantidade) || 0;
  } catch {
    /* sem linha em estoque ainda */
  }
  return mapMaterialFromApi(data, saldo);
}

export async function updateMaterial(id, payload) {
  if (getUseMock()) {
    await mockDelay();
    const m = mockDb.materials.find((x) => String(x.id) === String(id));
    if (!m) throw new Error("not found");
    m.name = payload.name;
    m.category = payload.category;
    m.unit = payload.unit || "kg";
    m.minStock = Number(payload.minStock) || 0;
    if (payload.currentStock !== undefined) m.currentStock = Number(payload.currentStock) || 0;
    if (payload.supplierId !== undefined) m.supplierId = payload.supplierId || null;
    if (payload.active !== undefined) m.active = Boolean(payload.active);
    return { ...m };
  }
  const body = {
    nome: payload.name,
    categoria: payload.category,
    unidade: payload.unit || "kg",
    estoque_minimo: Number(payload.minStock) || 0
  };
  if (payload.active !== undefined) body.ativo = Boolean(payload.active);
  const { data } = await api.put(`/materia-prima/${id}`, body);
  const updated = data?.materia ?? data;
  let saldo = 0;
  try {
    const { data: estoqueRows } = await api.get("/estoque-atual");
    const row = (Array.isArray(estoqueRows) ? estoqueRows : []).find(
      (r) => r.materia_prima_id === updated.id
    );
    if (row) saldo = Number(row.quantidade) || 0;
  } catch {
    /* ignore */
  }
  return mapMaterialFromApi(updated, saldo);
}

export async function deleteMaterial(id) {
  if (getUseMock()) {
    await mockDelay();
    const idx = mockDb.materials.findIndex((x) => String(x.id) === String(id));
    if (idx === -1) throw new Error("not found");
    mockDb.materials.splice(idx, 1);
    return { removido: true };
  }
  await api.delete(`/materia-prima/${id}`);
  return { removido: true };
}
