import { consulta, rpc, tabela } from "./cliente";
import * as m from "./mappers";

export async function meusChamados(limite = 30) {
  return ((await rpc("app_motorista_meus_chamados", { p_limite: limite })) || []).map(m.chamado);
}

/** Abre o chamado na Central de Atendimento do TMS. Devolve o código (CH-AAAA-NNNNN). */
export async function abrirChamado({ chave, categoria, assunto, descricao, rotaId = null, reciboId = null }) {
  const r = await rpc("app_motorista_abrir_chamado", {
    p_chave: chave, p_categoria: categoria, p_assunto: assunto, p_descricao: descricao,
    p_rota_id: rotaId, p_recibo_id: reciboId,
  });
  return r?.codigo;
}

export async function solicitarExclusaoConta({ chave }) {
  const r = await rpc("app_motorista_solicitar_exclusao_conta", { p_chave: chave });
  return r?.codigo;
}

export async function faq(limite = 30) {
  const q = tabela("app_motorista_faq").select("*").is("deleted_at", null).order("ordem").limit(limite);
  return (await consulta(q)).map(m.faq);
}

export async function notificacoes({ naoLidas = false, limite = 50 } = {}) {
  let q = tabela("app_motorista_notificacoes").select("*").is("deleted_at", null)
    .order("created_at", { ascending: false }).limit(limite);
  if (naoLidas) q = q.is("lida_em", null);
  return (await consulta(q)).map(m.notificacao);
}

export function marcarNotificacaoLida(id) {
  return rpc("app_motorista_marcar_notificacao_lida", { p_id: id });
}

/** Emergência: fluxo próprio (não é chamado). Devolve { emergencia_id, status, telefone_central, ja_estava_aberta }. */
export function acionarEmergencia({ chave, tipo, posicao, acionadaEm, rotaId = null }) {
  return rpc("app_motorista_acionar_emergencia", {
    p_chave: chave, p_tipo: tipo, p_lat: posicao?.lat ?? null, p_lng: posicao?.lng ?? null,
    p_precisao: posicao?.accuracy ?? null, p_acionada_em: acionadaEm, p_rota_id: rotaId,
  });
}
