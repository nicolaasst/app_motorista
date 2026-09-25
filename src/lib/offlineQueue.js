import {
  acionarEmergencia,
  confirmarEntrega,
  enviarArquivo,
  registrarGps,
  registrarInsucesso,
} from "@/api/app-motorista";

// Fila local de pendências offline (outbox). Persiste no aparelho e sobe quando
// a conexão volta.
//
// Garantias (docs/ARQUITETURA_APP_MOTORISTA.md §4):
//  * idempotência: o `id` do item é a chave enviada à RPC (p_chave); reenvio
//    depois de uma resposta perdida devolve o resultado já gravado, sem duplicar;
//  * anexos: fotos/assinatura ficam no IndexedDB e sobem antes do registro; o id
//    do documento é gravado no item logo após o upload (não sobe duas vezes);
//  * reenvio com espera crescente (5 s × 2^tentativas, máx. 10 min, ±20%);
//  * erro de rede/servidor → tenta de novo; recusa de regra de negócio →
//    "rejeitado" (não insiste; fica visível para o motorista);
//  * a fila é por motorista: outro login no mesmo aparelho não envia itens alheios;
//  * emergência sai sempre primeiro; GPS por último.

const PREFIXO_FILA = "ngs.offline.queue.v2:";
const FILA_ANTIGA = "ngs.offline.queue.v1";
const DB_NAME = "ngs-offline";
const STORE = "blobs";
const LOTE_GPS = 500;
const ESPERA_BASE_MS = 5000;
const ESPERA_MAX_MS = 10 * 60 * 1000;
const PRIORIDADE = { emergency: 0, delivery: 1, failure: 1, gps: 9 };

let usuario = null;
const listeners = new Set();

const emit = () => {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* noop */
    }
  });
};

/** Chamado pelo AuthContext: a fila passa a ser a do motorista logado (ou nenhuma). */
export function definirUsuarioFila(userId) {
  if (usuario === (userId || null)) return;
  usuario = userId || null;
  try {
    localStorage.removeItem(FILA_ANTIGA); // itens do Base44 apontam para ids que não existem mais
  } catch {
    /* noop */
  }
  emit();
}

export function subscribeQueue(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function readAll() {
  if (!usuario) return [];
  try {
    const raw = localStorage.getItem(PREFIXO_FILA + usuario);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(items) {
  if (!usuario) return;
  try {
    localStorage.setItem(PREFIXO_FILA + usuario, JSON.stringify(items));
  } catch {
    /* storage cheio / indisponível */
  }
  emit();
}

const novoId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16));

export function getQueue() {
  return readAll();
}

/** Itens que ainda vão subir (pendentes ou aguardando nova tentativa). */
export function pendingItems() {
  return readAll().filter((i) => i.status === "pendente" || i.status === "erro" || i.status === "enviando");
}

export function pendingCount() {
  return pendingItems().length;
}

/** Itens recusados pelo servidor (regra de negócio): não são reenviados sozinhos. */
export function rejectedItems() {
  return readAll().filter((i) => i.status === "rejeitado");
}

/**
 * Enfileira uma ação. `key` agrupa ações sobre o mesmo alvo: enquanto o item
 * nunca foi tentado, a nova ação substitui a anterior (mesmo id); depois da
 * primeira tentativa o id fica congelado (o servidor pode já tê-lo processado).
 * Devolve o id do item (ou null sem motorista logado).
 */
export function enqueue({ kind, key, stop_id = null, route_id = null, payload = {}, mergePoints = false }) {
  const items = readAll();
  const agora = new Date().toISOString();
  const dedupeKey = key || `${kind}:${stop_id || route_id || novoId()}`;
  const idx = items.findIndex((i) => i.key === dedupeKey && (i.status === "pendente" || i.status === "erro"));
  const podeFundir = idx >= 0 && (mergePoints || items[idx].attempts === 0);

  let idItem;
  if (podeFundir) {
    const prev = items[idx];
    idItem = prev.id;
    items[idx] = {
      ...prev,
      payload: mergePoints
        ? { ...prev.payload, ...payload, points: [...(prev.payload?.points || []), ...(payload.points || [])] }
        : { ...payload },
      status: "pendente",
      last_error: null,
      next_attempt_at: null,
      updated_at: agora,
    };
  } else {
    idItem = novoId();
    items.push({
      id: idItem,
      key: dedupeKey,
      kind,
      stop_id,
      route_id,
      payload,
      status: "pendente",
      attempts: 0,
      last_error: null,
      next_attempt_at: null,
      created_at: agora,
    });
  }
  writeAll(items);
  return usuario ? idItem : null;
}

export function enqueueGpsPoints(routeId, points) {
  if (!routeId || !points?.length) return;
  enqueue({ kind: "gps", key: `gps:${routeId}`, route_id: routeId, payload: { route_id: routeId, points }, mergePoints: true });
}

export function removeItem(id) {
  writeAll(readAll().filter((i) => i.id !== id));
}

export function clearQueue() {
  writeAll([]);
}

/** Reenfileira um item rejeitado (ex.: depois de a central corrigir o cadastro). */
export function retryItem(id) {
  writeAll(readAll().map((i) => (i.id === id ? { ...i, status: "pendente", next_attempt_at: null, last_error: null } : i)));
}

/* ---------- blobs (fotos/assinaturas capturadas sem conexão) ---------- */

function openDb() {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function putBlob(key, blob) {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = () => resolve(key);
    tx.onerror = () => resolve(null);
  });
}

export async function getBlob(key) {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });
}

export async function deleteBlob(key) {
  const db = await openDb();
  if (!db) return;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

/* ---------- sincronização ---------- */

export function proximaEspera(tentativas, aleatorio = Math.random) {
  const base = Math.min(ESPERA_BASE_MS * 2 ** Math.max(0, tentativas - 1), ESPERA_MAX_MS);
  return Math.round(base * (0.8 + aleatorio() * 0.4));
}

function atualizarItem(id, patch) {
  writeAll(readAll().map((i) => (i.id === id ? { ...i, ...patch } : i)));
}

/** Anexos do item: [{ campo, tipo, blobKey, documentoId? }]. Sobe o que falta e grava o id. */
async function enviarAnexos(item) {
  const anexos = item.payload?.anexos || [];
  let mudou = false;
  for (const anexo of anexos) {
    if (anexo.documentoId || !anexo.blobKey) continue;
    const blob = await getBlob(anexo.blobKey);
    if (!blob) continue; // blob perdido: a RPC decide se o anexo era obrigatório
    const { documentoId } = await enviarArquivo(blob, anexo.tipo);
    anexo.documentoId = documentoId;
    mudou = true;
    atualizarItem(item.id, { payload: item.payload }); // persiste já: não sobe de novo
  }
  return mudou;
}

const documentos = (item, campo) =>
  (item.payload?.anexos || []).filter((a) => a.campo === campo && a.documentoId).map((a) => a.documentoId);

async function applyItem(item) {
  const p = item.payload || {};

  if (item.kind === "delivery") {
    await confirmarEntrega({
      chave: item.id,
      paradaId: item.stop_id,
      recebedor: p.recebedor,
      assinaturaId: documentos(item, "assinatura")[0] || null,
      fotoIds: documentos(item, "foto"),
      posicao: p.posicao,
      entregueEm: p.delivered_at,
      dispositivo: p.dispositivo,
      observacoes: p.notes,
    });
    return;
  }

  if (item.kind === "failure") {
    await registrarInsucesso({
      chave: item.id,
      paradaId: item.stop_id,
      motivo: p.reason,
      observacoes: p.notes,
      fotoIds: documentos(item, "foto"),
      tentativas: p.contact_attempts,
      posicao: p.posicao,
      registradoEm: p.reported_at,
      devolverVolumes: p.returnVolumes,
    });
    return;
  }

  if (item.kind === "emergency") {
    await acionarEmergencia({ chave: item.id, tipo: p.tipo, posicao: p.posicao, acionadaEm: p.acionada_em, rotaId: item.route_id });
    return;
  }

  if (item.kind === "gps") {
    const pontos = (p.points || []).map((pt) => ({
      t: pt.t, lat: pt.lat, lng: pt.lng, speed: pt.speed ?? null, accuracy: pt.accuracy ?? null, heading: pt.heading ?? null,
    }));
    for (let i = 0; i < pontos.length; i += LOTE_GPS) {
      await registrarGps(item.route_id || p.route_id, pontos.slice(i, i + LOTE_GPS));
    }
    return;
  }

  throw Object.assign(new Error(`tipo de item desconhecido: ${item.kind}`), { transitorio: false });
}

function vencido(item, agora) {
  return !item.next_attempt_at || new Date(item.next_attempt_at).getTime() <= agora;
}

/**
 * Envia o que estiver pronto. `forcar` ignora a espera entre tentativas (ex.:
 * botão "sincronizar agora" / antes de concluir a rota).
 */
export async function syncPending({ forcar = false } = {}) {
  const agora = Date.now();
  const fila = readAll()
    .filter((i) => (i.status === "pendente" || i.status === "erro" || i.status === "enviando") && (forcar || vencido(i, agora)))
    .sort((a, b) => (PRIORIDADE[a.kind] ?? 5) - (PRIORIDADE[b.kind] ?? 5) || a.created_at.localeCompare(b.created_at));
  if (!fila.length) return { ok: true, synced: 0, failed: 0, rejected: 0 };
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { ok: false, offline: true, synced: 0, failed: 0, rejected: 0 };
  }

  let synced = 0;
  let failed = 0;
  let rejected = 0;
  for (const item of fila) {
    atualizarItem(item.id, { status: "enviando" });
    try {
      await enviarAnexos(item);
      await applyItem(item);
      for (const a of item.payload?.anexos || []) if (a.blobKey) deleteBlob(a.blobKey);
      removeItem(item.id);
      synced++;
    } catch (e) {
      const tentativas = (item.attempts || 0) + 1;
      if (e?.transitorio === false) {
        atualizarItem(item.id, { status: "rejeitado", attempts: tentativas, last_error: String(e?.message || e) });
        rejected++;
      } else {
        atualizarItem(item.id, {
          status: "erro",
          attempts: tentativas,
          last_error: String(e?.message || e),
          next_attempt_at: new Date(Date.now() + proximaEspera(tentativas)).toISOString(),
        });
        failed++;
        if (typeof navigator !== "undefined" && !navigator.onLine) break;
      }
    }
  }
  return { ok: failed === 0 && rejected === 0, synced, failed, rejected };
}
