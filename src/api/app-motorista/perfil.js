import { rpc } from "./cliente";
import * as m from "./mappers";

// Perfil, preferências e parâmetros do tenant numa chamada só; guardado em
// memória para as várias telas que precisam do motorista atual.
let cache = null;

export function limparContexto() {
  cache = null;
}

export async function contexto({ recarregar = false } = {}) {
  if (!cache || recarregar) {
    cache = rpc("app_motorista_contexto").then((c) => ({
      perfil: m.perfil(c?.perfil),
      preferencias: m.preferencias(c?.preferencias),
      config: c?.config || {},
    }));
    cache.catch(() => {
      cache = null;
    });
  }
  return cache;
}

/** Compatível com o antigo getDriver(): { driver, driverId }. */
export async function motoristaAtual() {
  const { perfil } = await contexto();
  return { driver: perfil, driverId: perfil?.user_id || null };
}

export async function atualizarPerfil({ phone, email_personal, address, emergency_contact }) {
  const p = await rpc("app_motorista_atualizar_perfil", {
    p_telefone: phone ?? null,
    p_email_pessoal: email_personal ?? null,
    p_endereco: address ?? null,
    p_contato_emergencia: emergency_contact ?? null,
  });
  limparContexto();
  return m.perfil(p);
}

export async function definirAvatar(documentoId) {
  await rpc("app_motorista_definir_avatar", { p_documento_id: documentoId || null });
  limparContexto();
}

export async function atualizarPreferencias(patch) {
  const p = await rpc("app_motorista_atualizar_preferencias", { p_preferencias: m.preferenciasParaBanco(patch) });
  limparContexto();
  return m.preferencias(p);
}

export async function meusDocumentos() {
  return ((await rpc("app_motorista_meus_documentos")) || []).map(m.documentoPessoal);
}

export async function minhasContas() {
  return ((await rpc("app_motorista_minhas_contas")) || []).map(m.contaBancaria);
}
