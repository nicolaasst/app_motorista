import { consulta, rpc, tabela } from "./cliente";
import * as m from "./mappers";

// Leituras: a RLS já restringe às linhas do motorista logado; os filtros aqui
// são para usar os índices e trazer só o necessário.

export async function minhasRotas({ status, limite = 5 } = {}) {
  let q = tabela("app_motorista_rotas").select("*").is("deleted_at", null)
    .order("data", { ascending: false }).order("created_at", { ascending: false }).limit(limite);
  if (status) q = Array.isArray(status) ? q.in("status", status) : q.eq("status", status);
  return (await consulta(q)).map(m.rota);
}

export async function rota(id) {
  const r = await consulta(tabela("app_motorista_rotas").select("*").eq("id", id).maybeSingle());
  return m.rota(r);
}

export async function rotasPorIds(ids) {
  if (!ids?.length) return [];
  return (await consulta(tabela("app_motorista_rotas").select("*").in("id", ids))).map(m.rota);
}

export async function paradasDaRota(rotaId, limite = 200) {
  const q = tabela("app_motorista_paradas").select("*").eq("rota_id", rotaId).is("deleted_at", null)
    .order("sequencia", { ascending: true }).limit(limite);
  return (await consulta(q)).map(m.parada);
}

/** Paradas de várias rotas (histórico/análise). */
export async function paradasDasRotas(rotaIds, limite = 2000) {
  if (!rotaIds?.length) return [];
  const q = tabela("app_motorista_paradas").select("*").in("rota_id", rotaIds).is("deleted_at", null)
    .order("sequencia", { ascending: true }).limit(limite);
  return (await consulta(q)).map(m.parada);
}

export async function parada(id) {
  return m.parada(await consulta(tabela("app_motorista_paradas").select("*").eq("id", id).maybeSingle()));
}

export async function volumesDaRota(rotaId, limite = 400) {
  const q = tabela("app_motorista_volumes").select("*").eq("rota_id", rotaId).is("deleted_at", null)
    .order("created_at", { ascending: false }).limit(limite);
  return (await consulta(q)).map(m.volume);
}

export async function volumesDaParada(paradaId, limite = 50) {
  const q = tabela("app_motorista_volumes").select("*").eq("parada_id", paradaId).is("deleted_at", null)
    .order("created_at", { ascending: true }).limit(limite);
  return (await consulta(q)).map(m.volume);
}

export async function comprovantesDasRotas(rotaIds, limite = 2000) {
  if (!rotaIds?.length) return [];
  const q = tabela("app_motorista_comprovantes").select("*").in("rota_id", rotaIds).is("deleted_at", null)
    .order("created_at", { ascending: true }).limit(limite);
  return (await consulta(q)).map(m.comprovante);
}

export async function insucessosDasRotas(rotaIds, limite = 2000) {
  if (!rotaIds?.length) return [];
  const q = tabela("app_motorista_insucessos").select("*").in("rota_id", rotaIds).is("deleted_at", null)
    .order("created_at", { ascending: true }).limit(limite);
  return (await consulta(q)).map(m.insucesso);
}

export async function meuVeiculo(rotaId = null) {
  return m.veiculo(await rpc("app_motorista_meu_veiculo", { p_rota_id: rotaId }));
}

export function atualizarPolyline(rotaId, polyline) {
  return rpc("app_motorista_atualizar_polyline", { p_rota_id: rotaId, p_polyline: polyline });
}

/** Itens do checklist da tela → formato gravado ({key, label, ok, note}). */
function itensChecklist(itens) {
  return (itens || []).map((i) => ({ key: i.key, label: i.label, ok: i.ok === true, note: i.note ?? null }));
}

export function iniciarRota({ chave, rotaId, itens, odometro, fotoOdometroId = null, concluidoEm = new Date().toISOString() }) {
  return rpc("app_motorista_iniciar_rota", {
    p_chave: chave, p_rota_id: rotaId, p_itens: itensChecklist(itens), p_odometro: odometro,
    p_foto_odometro_id: fotoOdometroId, p_concluido_em: concluidoEm,
  });
}

export function concluirRota({ chave, rotaId }) {
  return rpc("app_motorista_concluir_rota", { p_chave: chave, p_rota_id: rotaId });
}

export function encerrarTurno({ chave, rotaId, itens, odometro, fotoOdometroId = null, concluidoEm = new Date().toISOString() }) {
  return rpc("app_motorista_encerrar_turno", {
    p_chave: chave, p_rota_id: rotaId, p_itens: itensChecklist(itens), p_odometro: odometro,
    p_foto_odometro_id: fotoOdometroId, p_concluido_em: concluidoEm,
  });
}

export function biparVolumes({ chave, paradaId, volumeIds, lidoEm = new Date().toISOString() }) {
  return rpc("app_motorista_bipar_volumes", {
    p_chave: chave, p_parada_id: paradaId, p_volume_ids: volumeIds, p_lido_em: lidoEm,
  });
}

export function confirmarEntrega({ chave, paradaId, recebedor, assinaturaId, fotoIds, posicao, entregueEm, dispositivo, observacoes }) {
  return rpc("app_motorista_confirmar_entrega", {
    p_chave: chave, p_parada_id: paradaId, p_recebedor: recebedor, p_assinatura_id: assinaturaId,
    p_fotos: fotoIds || [], p_lat: posicao?.lat ?? null, p_lng: posicao?.lng ?? null,
    p_precisao: posicao?.accuracy ?? null, p_entregue_em: entregueEm, p_dispositivo: dispositivo || {},
    p_observacoes: observacoes || null,
  });
}

export function registrarInsucesso({ chave, paradaId, motivo, observacoes, fotoIds, tentativas, posicao, registradoEm, devolverVolumes }) {
  return rpc("app_motorista_registrar_insucesso", {
    p_chave: chave, p_parada_id: paradaId, p_motivo: motivo, p_observacoes: observacoes || null,
    p_fotos: fotoIds || [], p_tentativas: tentativas || [], p_lat: posicao?.lat ?? null,
    p_lng: posicao?.lng ?? null, p_precisao: posicao?.accuracy ?? null, p_registrado_em: registradoEm,
    p_devolver_volumes: !!devolverVolumes,
  });
}

export function registrarGps(rotaId, pontos) {
  return rpc("app_motorista_registrar_gps", { p_rota_id: rotaId, p_pontos: pontos });
}

/** Trilha GPS já gravada da rota (para redesenhar ao reabrir o app). */
export async function trilhaDaRota(rotaId, limite = 5000) {
  const q = tabela("app_motorista_gps_pontos").select("registrado_em, lat, lng, velocidade_kmh")
    .eq("rota_id", rotaId).order("registrado_em", { ascending: true }).limit(limite);
  return (await consulta(q)).map((p) => ({ lat: Number(p.lat), lng: Number(p.lng), t: p.registrado_em, speed: p.velocidade_kmh }));
}
