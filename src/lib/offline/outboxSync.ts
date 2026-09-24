import type { OutboxItem, OutboxStore } from './types.js';

export type OutboxSender = (item: OutboxItem) => Promise<void>;

export interface OutboxSyncOptions {
  store: OutboxStore;
  send: OutboxSender;
  maxAttempts?: number;
  baseDelayMs?: number;
}

// Backoff exponencial simples: 2^attempts * baseDelayMs, com teto.
export function backoffDelayMs(attempts: number, baseDelayMs = 2000): number {
  return Math.min(baseDelayMs * 2 ** attempts, 60000);
}

// Sincroniza a fila de saída: cada item pendente ou com erro é reenviado
// (idempotente — mesma idempotencyKey em toda tentativa), nunca marcado
// como sincronizado sem confirmação real do servidor.
export function createOutboxSync({ store, send, maxAttempts = 5 }: OutboxSyncOptions) {
  let flushing = false;
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  async function flushOnce(): Promise<{ synced: number; failed: number; pending: number }> {
    const items = await store.list();
    const toSync = items.filter((item) => item.status === 'pendente' || item.status === 'erro');
    let synced = 0;
    let failed = 0;

    for (const item of toSync) {
      await store.update(item.id, { status: 'sincronizando' });
      try {
        await send(item);
        await store.remove(item.id);
        synced += 1;
      } catch (error) {
        const attempts = item.attempts + 1;
        const permanentlyFailed = attempts >= maxAttempts;
        await store.update(item.id, {
          status: 'erro',
          attempts,
          lastError: error instanceof Error ? error.message : String(error),
        });
        failed += 1;
        if (!permanentlyFailed) scheduleRetry(item.id, attempts);
      }
    }

    const remaining = await store.list();
    return { synced, failed, pending: remaining.length };
  }

  function scheduleRetry(id: string, attempts: number) {
    const existing = timers.get(id);
    if (existing) clearTimeout(existing);
    const delay = backoffDelayMs(attempts);
    const timer = setTimeout(() => {
      timers.delete(id);
      void flush();
    }, delay);
    timers.set(id, timer);
  }

  async function flush() {
    if (flushing) return;
    flushing = true;
    try {
      await flushOnce();
    } finally {
      flushing = false;
    }
  }

  function dispose() {
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
  }

  return { flush, dispose };
}
