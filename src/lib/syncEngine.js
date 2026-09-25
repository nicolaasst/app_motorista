import { pendingCount, rejectedItems, subscribeQueue, syncPending } from "@/lib/offlineQueue";

// Motor de sincronização global: reage ao evento de conexão e reverifica a
// fila periodicamente (o navegador nem sempre dispara `online`).

const listeners = new Set();

let online = typeof navigator === "undefined" ? true : navigator.onLine;
let pending = 0;
let rejected = 0;
let status = "idle"; // idle | syncing | synced | error
let inflight = null;
let started = false;
let hideTimer = null;

function snapshot() {
  return { online, pending, rejected, status };
}

function emit() {
  const s = snapshot();
  listeners.forEach((fn) => {
    try {
      fn(s);
    } catch {
      /* noop */
    }
  });
}

export function getSyncState() {
  return snapshot();
}

export function subscribeSync(fn) {
  listeners.add(fn);
  fn(snapshot());
  return () => listeners.delete(fn);
}

async function doSync(forcar) {
  online = typeof navigator === "undefined" ? true : navigator.onLine;
  pending = pendingCount();
  rejected = rejectedItems().length;
  if (!online || !pending) {
    status = "idle";
    emit();
    return { ok: true, synced: 0, failed: 0 };
  }

  status = "syncing";
  emit();

  let res;
  try {
    res = await syncPending({ forcar });
  } catch {
    res = { ok: false, synced: 0, failed: 1 };
  }

  pending = pendingCount();
  rejected = rejectedItems().length;
  status = res.failed || res.rejected ? "error" : "synced";
  emit();

  if (!res.failed && !res.rejected) {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (status === "synced") {
        status = "idle";
        emit();
      }
    }, 3500);
  }
  return res;
}

// Aguarda a sincronização em andamento (usado antes de "Concluir Rota").
// `forcar` (padrão) ignora a espera entre tentativas; o timer periódico a respeita.
export function syncNow({ forcar = true } = {}) {
  if (!inflight) {
    inflight = doSync(forcar).finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

export function startSyncEngine() {
  if (started || typeof window === "undefined") return;
  started = true;

  online = navigator.onLine;
  pending = pendingCount();
  emit();

  window.addEventListener("online", () => {
    online = true;
    emit();
    // pequeno atraso para a conexão estabilizar
    setTimeout(syncNow, 2000);
  });
  window.addEventListener("offline", () => {
    online = false;
    emit();
  });

  subscribeQueue(() => {
    const p = pendingCount();
    const r = rejectedItems().length;
    if (p !== pending || r !== rejected) {
      pending = p;
      rejected = r;
      emit();
    }
  });

  setInterval(() => {
    online = navigator.onLine;
    const p = pendingCount();
    if (p !== pending) pending = p;
    emit();
    if (online) syncNow({ forcar: false });
  }, 30000);

  if (online && pending) setTimeout(syncNow, 3000);
}