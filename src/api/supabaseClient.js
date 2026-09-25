import { createClient } from "@supabase/supabase-js";

// Mesmo projeto Supabase do TMS (rcweqbvdkskjtzjgpsnl): mesmas variáveis públicas.
// A chave publicável/anon é pública por natureza; o que protege os dados é a RLS.
const url = import.meta.env.VITE_SUPABASE_URL;
const chave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigurado = Boolean(url && chave);
export const SUPABASE_URL = url || "";
export const SUPABASE_CHAVE_PUBLICA = chave || "";

// "Lembrar de mim": sessão em localStorage (sobrevive ao fechar o app) ou em
// sessionStorage (encerra ao fechar). A escolha é gravada antes do login.
const CHAVE_LEMBRAR = "ngs.auth.lembrar";

function seguro(fn, padrao = null) {
  try {
    return fn();
  } catch {
    return padrao;
  }
}

export function definirLembrarLogin(lembrar) {
  seguro(() => localStorage.setItem(CHAVE_LEMBRAR, lembrar ? "1" : "0"));
}

export function lembrarLogin() {
  return seguro(() => localStorage.getItem(CHAVE_LEMBRAR), "1") !== "0";
}

const armazenamentoSessao = {
  getItem: (k) => seguro(() => (lembrarLogin() ? localStorage : sessionStorage).getItem(k)),
  setItem: (k, v) =>
    seguro(() => {
      const [usar, limpar] = lembrarLogin() ? [localStorage, sessionStorage] : [sessionStorage, localStorage];
      usar.setItem(k, v);
      limpar.removeItem(k);
    }),
  removeItem: (k) =>
    seguro(() => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    }),
};

export const supabase = supabaseConfigurado
  ? createClient(url, chave, {
      auth: {
        storage: armazenamentoSessao,
        storageKey: "ngs.driver.auth",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

/** Claims do JWT (só leitura para a interface; quem decide acesso é o banco). */
export function claimsDoToken(accessToken) {
  if (!accessToken) return null;
  try {
    const payload = accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "="))
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}
