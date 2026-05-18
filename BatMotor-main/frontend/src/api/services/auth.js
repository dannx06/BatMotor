/**
 * Autenticação: `loginRequest` chama `POST /auth/login` no modo remoto ou valida contra `mock/store`.
 * Resposta normalizada com `normalizeAuthSuccess` (token + utilizador + roles).
 * Erros HTTP são mapeados pela função local `apiErrorMessage`.
 */
import { api, getUseMock } from "../client.js";
import { mockDb, mockDelay } from "../mock/store.js";
import { normalizeAuthSuccess } from "../batmotorAdapters.js";

function apiErrorMessage(err) {
  const d = err?.response?.data;
  if (d && typeof d.error === "string") return d.error;
  if (d && typeof d.message === "string") return d.message;
  return null;
}

function mockRolesForUser(mockUser) {
  if (Array.isArray(mockUser.roles) && mockUser.roles.length) return mockUser.roles;
  if (mockUser.accountKind === "admin") return ["ADMIN"];
  return ["FUNCIONARIO"];
}

export async function loginRequest(email, password) {
  const emailNorm = String(email || "").trim().toLowerCase();
  if (getUseMock()) {
    await mockDelay();
    const mockUser = mockDb.users.find((u) => String(u.email || "").toLowerCase() === emailNorm);
    if (mockUser) {
      if (mockUser.password !== password) {
        throw new Error("Credenciais invalidas");
      }
      const roles = mockRolesForUser(mockUser);
      return normalizeAuthSuccess({
        token: "mock-token",
        user: {
          id: mockUser.id,
          nome: mockUser.name,
          email: mockUser.email,
          roles
        }
      });
    }
    throw new Error("Credenciais invalidas");
  }
  try {
    const { data } = await api.post("/auth/login", {
      email: emailNorm,
      senha: password
    });
    return normalizeAuthSuccess(data);
  } catch (e) {
    const msg = apiErrorMessage(e);
    const err = new Error(msg || e.message || "Falha no login");
    err.response = e.response;
    throw err;
  }
}
