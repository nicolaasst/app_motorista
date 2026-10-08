// Páginas públicas de privacidade, termos e exclusão de conta ficam no site do TMS (mesmo domínio do portal).
// A base vem de VITE_LEGAL_BASE_URL; sem ela os links não aparecem (nunca aponta para endereço inventado).
const base = (import.meta.env.VITE_LEGAL_BASE_URL || "").trim().replace(/\/+$/, "");

const montar = (caminho) => (/^https:\/\//.test(base) ? `${base}${caminho}` : null);

export const LINKS_LEGAIS = Object.freeze({
  privacidade: montar("/privacidade"),
  termos: montar("/termos"),
  exclusao: montar("/exclusao-de-conta"),
});
