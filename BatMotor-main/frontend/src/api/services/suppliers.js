/**
 * Fornecedores: `GET/POST/PUT/DELETE /fornecedores` (remoto) ou lista mock com normalização.
 */
import { api, getUseMock } from "../client.js";
import { mockDb, mockDelay } from "../mock/store.js";
import { mockNormalizeSupplier, mockNextSupplierCode } from "../mock/suppliers.js";
import { mapSupplierFromApi } from "../batmotorAdapters.js";

export async function fetchSuppliers() {
  if (getUseMock()) {
    await mockDelay();
    return mockDb.suppliers.map((s, i) => mockNormalizeSupplier(s, i));
  }
  const { data } = await api.get("/fornecedores");
  const list = Array.isArray(data) ? data : [];
  return list.map(mapSupplierFromApi);
}

export async function createSupplier(payload) {
  if (getUseMock()) {
    await mockDelay();
    const phone = payload.phone || payload.contact || "";
    const email = payload.email || "";
    let status = payload.status || "pending";
    if (payload.active === false) status = "inactive";
    else if (payload.active === true && status === "inactive") status = "active";

    const newRow = {
      id: `s${Date.now()}`,
      code: mockNextSupplierCode(),
      name: payload.name,
      cnpj: payload.cnpj ?? "",
      contactPerson: payload.contactPerson ?? "",
      email,
      phone,
      contact: phone || email || payload.contact || "",
      status,
      supplierType: payload.supplierType ?? "",
      category: payload.category ?? "",
      address: payload.address ?? "",
      city: payload.city ?? "",
      state: payload.state ?? "",
      since: payload.since ?? "",
      paymentTerms: payload.paymentTerms ?? "",
      notes: payload.notes ?? "",
      logoUrl: payload.logoUrl ?? "",
      active: payload.active !== false
    };
    mockDb.suppliers.unshift(newRow);
    return mockNormalizeSupplier(newRow, 0);
  }
  const digits = String(payload.cnpj || "").replace(/\D/g, "");
  const body = {
    nome: payload.name,
    cnpj: digits.length === 14 ? digits : String(payload.cnpj || "").trim(),
    email: payload.email || undefined,
    telefone: (payload.phone || payload.contact || "").replace(/\D/g, "") || undefined
  };
  if (payload.logoUrl !== undefined) {
    const u = payload.logoUrl;
    body.logo_data_url =
      u == null || String(u).trim() === "" ? null : String(u).trim();
  }
  if (payload.active !== undefined) body.ativo = Boolean(payload.active);
  const { data } = await api.post("/fornecedores", body);
  return mapSupplierFromApi(data);
}

export async function updateSupplier(id, payload) {
  if (getUseMock()) {
    await mockDelay();
    const i = mockDb.suppliers.findIndex((s) => s.id === id);
    if (i === -1) throw new Error("Fornecedor nao encontrado");
    const prev = mockDb.suppliers[i];
    const merged = mockNormalizeSupplier({ ...prev, ...payload, id }, i);
    if (payload.active === false) merged.status = "inactive";
    if (payload.active === true && merged.status === "inactive") merged.status = "active";
    mockDb.suppliers[i] = { ...merged };
    return merged;
  }
  const body = {};
  if (payload.name !== undefined) body.nome = payload.name;
  if (payload.email !== undefined) body.email = payload.email;
  if (payload.phone !== undefined || payload.contact !== undefined) {
    body.telefone = String(payload.phone || payload.contact || "").replace(/\D/g, "") || undefined;
  }
  if (payload.active !== undefined) body.ativo = Boolean(payload.active);
  if (payload.logoUrl !== undefined) {
    const u = payload.logoUrl;
    body.logo_data_url =
      u == null || String(u).trim() === "" ? null : String(u).trim();
  }
  const { data } = await api.put(`/fornecedores/${id}`, body);
  return mapSupplierFromApi(data);
}

export async function deleteSupplier(id) {
  if (getUseMock()) {
    await mockDelay();
    const i = mockDb.suppliers.findIndex((s) => s.id === id);
    if (i === -1) throw new Error("Fornecedor nao encontrado");
    mockDb.suppliers.splice(i, 1);
    mockDb.materials.forEach((m) => {
      if (m.supplierId === id) m.supplierId = null;
    });
    return { ok: true };
  }
  await api.delete(`/fornecedores/${id}`);
  return { ok: true };
}
