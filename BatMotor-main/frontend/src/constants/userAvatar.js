/**
 * Avatares em PNG: coloque os arquivos em frontend/public/assets/avatars/
 * Nome do arquivo = id do perfil (igual ao cadastro) + .png
 *
 * Ex.: gerente.png, encarregado.png, almoxarife_operacional.png, auxiliar_almoxarifado.png
 * Opcional: default.png — usado quando não há profileRole ou o arquivo do perfil não existe.
 *
 * Foto do usuário (perfil): localStorage "batmotor-user-avatar" (data URL). Tem precedência sobre o PNG do cargo.
 */
const BASE = "/assets/avatars";

export const USER_AVATAR_STORAGE_KEY = "batmotor-user-avatar";

export function resolveAvatarUrl(profileRole) {
  const slug = profileRole && String(profileRole).trim() ? profileRole.trim() : "default";
  return `${BASE}/${slug}.png`;
}

/** URL exibida no avatar: foto do perfil ou imagem do cargo. */
export function resolveDisplayAvatarUrl(profileRole, userPhotoDataUrl) {
  const custom = userPhotoDataUrl && String(userPhotoDataUrl).trim();
  if (custom) return custom;
  return resolveAvatarUrl(profileRole);
}


