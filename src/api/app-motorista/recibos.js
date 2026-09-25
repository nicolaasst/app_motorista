import { consulta, rpc, tabela } from "./cliente";
import * as m from "./mappers";

export async function meusRecibos(limite = 60) {
  const q = tabela("app_motorista_recibos").select("*").is("deleted_at", null)
    .order("periodo_inicio", { ascending: false }).limit(limite);
  return (await consulta(q)).map(m.recibo);
}

/** Aceita o id (uuid) ou o código legível do recibo (links antigos usam o código). */
export async function recibo(idOuCodigo) {
  const ehUuid = /^[0-9a-f-]{36}$/i.test(idOuCodigo || "");
  const q = tabela("app_motorista_recibos").select("*").eq(ehUuid ? "id" : "codigo", idOuCodigo).maybeSingle();
  return m.recibo(await consulta(q));
}

export async function itensDoRecibo(reciboId) {
  const q = tabela("app_motorista_recibo_itens").select("*").eq("recibo_id", reciboId).order("created_at");
  return (await consulta(q)).map(m.reciboItem);
}

export async function rotasDoRecibo(reciboId) {
  const q = tabela("app_motorista_recibo_rotas").select("*").eq("recibo_id", reciboId).order("data");
  return (await consulta(q)).map(m.reciboRota);
}

export function assinarRecibo({ chave, reciboId, assinaturaId, posicao }) {
  return rpc("app_motorista_assinar_recibo", {
    p_chave: chave, p_recibo_id: reciboId, p_assinatura_id: assinaturaId,
    p_lat: posicao?.lat ?? null, p_lng: posicao?.lng ?? null,
  });
}
