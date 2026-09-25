import { pendingCount, subscribeQueue, syncPending } from "@/lib/offlineQueue";

// Motor de sincronização global: reage ao evento de conexão e reverifica a
// fila periodicamente (o navegador nem sempre dispara `online`).

const listeners = new Set();

let online = typeof navigator === "undefined" ? true : navigator.onLine;
let pending = 0;
let status = "idle"; // idle | syncing | synced | error
let inflight = null;
let started = false;
let hideTimer = null;

function snapshot() {
  return { online, pending, status };
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

async function doSync() {
  online = typeof navigator === "undefined" ? true : navigator.onLine;
  pending = pendingCount();
  if (!online || !pending) {
    status = "idle";
    emit();
    return { ok: true, synced: 0, failed: 0 };
  }

  status = "syncing";
  emit();

  let res;
  try {
    res = await syncPending();
  } catch {
    res = { ok: false, synced: 0, failed: 1 };
  }

  pending = pendingCount();
  status = res.failed ? "error" : "synced";
  emit();

  if (!res.failed) {
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
export function syncNow() {
  if (!inflight) {
    inflight = doSync().finally(() => {
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
    if (p !== pending) {
      pending = p;
      emit();
    }
  });

  setInterval(() => {
    online = navigator.onLine;
    const p = pendingCount();
    if (p !== pending) pending = p;
    emit();
    if (online) syncNow();
  }, 30000);

  if (online && pending) setTimeout(syncNow, 3000);
}