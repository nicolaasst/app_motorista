import { base44 } from "@/api/base44Client";

// Fila local de pendências offline. Persiste no dispositivo e sobe para o
// backend quando a conexão volta. Uma ação nova sobre a mesma parada substitui
// a pendência anterior daquela parada em vez de duplicar.

const QUEUE_KEY = "ngs.offline.queue.v1";
const DB_NAME = "ngs-offline";
const STORE = "blobs";

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

export function subscribeQueue(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function readAll() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(items) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    /* storage cheio / indisponível */
  }
  emit();
}

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function getQueue() {
  return readAll();
}

export function pendingItems() {
  return readAll().filter((i) => i.status !== "ok");
}

export function pendingCount() {
  return pendingItems().length;
}

export function enqueue({
  kind,
  key,
  stop_id = null,
  route_id = null,
  payload = {},
  mergePoints = false,
}) {
  const items = readAll();
  const dedupeKey = key || `${kind}:${stop_id || route_id || uid()}`;
  const idx = items.findIndex((i) => i.key === dedupeKey && i.status !== "ok");

  if (idx >= 0) {
    const prev = items[idx];
    const merged = mergePoints
      ? {
          ...prev.payload,
          ...payload,
          points: [...(prev.payload?.points || []), ...(payload.points || [])],
        }
      : { ...payload };
    items[idx] = {
      ...prev,
      payload: merged,
      status: "pendente",
      last_error: null,
      updated_at: new Date().toISOString(),
    };
  } else {
    items.push({
      id: uid(),
      key: dedupeKey,
      kind,
      stop_id,
      route_id,
      payload,
      status: "pendente",
      attempts: 0,
      last_error: null,
      created_at: new Date().toISOString(),
    });
  }
  writeAll(items);
  return dedupeKey;
}

export function enqueueGpsPoints(routeId, points) {
  if (!routeId || !points?.length) return;
  enqueue({
    kind: "gps",
    key: `gps:${routeId}`,
    route_id: routeId,
    payload: { route_id: routeId, points },
    mergePoints: true,
  });
}

export function removeItem(id) {
  writeAll(readAll().filter((i) => i.id !== id));
}

export function clearQueue() {
  writeAll([]);
}

/* ---------- blobs (fotos tiradas sem conexão) ---------- */

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

// Fase 1: fotos/comprovantes primeiro. Fase 2: os dados que dependem delas.
async function uploadPhoto(item) {
  const p = item.payload || {};
  if (!p.blobKey || p.photoUri) return p;
  const blob = await getBlob(p.blobKey);
  if (!blob) return p;
  const file = new File([blob], p.blobName || "comprovante.jpg", {
    type: blob.type || "image/jpeg",
  });
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
  return { ...p, photoUri: file_uri };
}

async function applyItem(item) {
  const p = item.payload || {};

  if (item.kind === "delivery") {
    const photos = p.photoUri
      ? [{ url: p.photoUri, taken_at: p.delivered_at, lat: p.lat, lng: p.lng }]
      : [];
    await base44.entities.DeliveryProof.create({
      stop_id: item.stop_id,
      receiver_name: p.receiver_name,
      receiver_doc: p.receiver_doc,
      receiver_is_holder: !!p.receiver_is_holder,
      receiver_type: p.receiver_type,
      receiver_type_other: p.receiver_type_other,
      signature_png: "",
      signature_hash: "",
      photos,
      notes: p.notes || "",
      lat: p.lat,
      lng: p.lng,
      accuracy_m: p.accuracy_m ?? null,
      delivered_at: p.delivered_at,
      device_info: p.device_info,
      sync_status: "ok",
    });
    await base44.entities.Stop.update(item.stop_id, {
      status: "entregue",
      finished_at: p.delivered_at,
    });
    return;
  }

  if (item.kind === "failure") {
    const photos = p.photoUri
      ? [{ url: p.photoUri, taken_at: p.reported_at, lat: p.lat, lng: p.lng }]
      : [];
    await base44.entities.FailureReport.create({
      stop_id: item.stop_id,
      reason: p.reason,
      notes: p.notes || "",
      photos,
      contact_attempts: [],
      lat: p.lat,
      lng: p.lng,
      reported_at: p.reported_at,
      sync_status: "ok",
    });
    await base44.entities.Stop.update(item.stop_id, {
      status: "falha",
      finished_at: p.reported_at,
    });
    if (p.returnVolumes) {
      await base44.entities.Volume.updateMany(
        { stop_id: item.stop_id },
        { $set: { return_status: "devolver" } },
      );
    }
    return;
  }

  if (item.kind === "gps") {
    const routeId = p.route_id || item.route_id;
    if (!routeId) return;
    const route = await base44.entities.Route.get(routeId);
    const track = Array.isArray(route.gps_track) ? [...route.gps_track] : [];
    for (const pt of p.points || []) track.push(pt);
    await base44.entities.Route.update(routeId, { gps_track: track });
  }
}

export async function syncPending() {
  const all = readAll();
  const work = all.filter((i) => i.status === "pendente" || i.status === "erro");
  if (!work.length) return { ok: true, synced: 0, failed: 0 };
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { ok: false, offline: true, synced: 0, failed: 0 };
  }

  // Fase 1 — fotos e comprovantes
  for (const item of work) {
    if (item.payload?.blobKey && !item.payload.photoUri) {
      try {
        item.payload = await uploadPhoto(item);
      } catch {
        /* tenta novamente no item da fase 2 */
      }
    }
  }

  // Fase 2 — registros
  let synced = 0;
  let failed = 0;
  for (const item of work) {
    try {
      await applyItem(item);
      item.status = "ok";
      synced++;
      if (item.payload?.blobKey) deleteBlob(item.payload.blobKey);
    } catch (e) {
      item.status = "erro";
      item.attempts = (item.attempts || 0) + 1;
      item.last_error = String(e?.message || e);
      failed++;
    }
  }

  const byId = Object.fromEntries(work.map((i) => [i.id, i]));
  const remaining = readAll()
    .map((i) => byId[i.id] || i)
    .filter((i) => i.status !== "ok");
  writeAll(remaining);

  return { ok: failed === 0, synced, failed };
}