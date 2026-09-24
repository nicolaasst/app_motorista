import { describe, expect, it, vi } from 'vitest';
import { createOutboxSync, backoffDelayMs } from './outboxSync.js';
import type { OutboxItem, OutboxStore } from './types.js';

function createFakeStore(initial: OutboxItem[] = []): OutboxStore {
  const items = new Map(initial.map((item) => [item.id, item]));
  return {
    async enqueue(operation, payload) {
      const now = new Date().toISOString();
      const item: OutboxItem = {
        id: `id-${items.size + 1}`,
        operation,
        idempotencyKey: `key-${items.size + 1}`,
        payload,
        status: 'pendente',
        attempts: 0,
        createdAt: now,
        updatedAt: now,
      };
      items.set(item.id, item);
      return item;
    },
    async list() {
      return [...items.values()];
    },
    async update(id, patch) {
      const current = items.get(id);
      if (!current) return undefined;
      const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
      items.set(id, next);
      return next;
    },
    async remove(id) {
      items.delete(id);
    },
  };
}

describe('backoffDelayMs', () => {
  it('grows exponentially and caps at 60s', () => {
    expect(backoffDelayMs(0, 1000)).toBe(1000);
    expect(backoffDelayMs(1, 1000)).toBe(2000);
    expect(backoffDelayMs(2, 1000)).toBe(4000);
    expect(backoffDelayMs(10, 1000)).toBe(60000);
  });
});

describe('createOutboxSync', () => {
  it('removes an item from the queue only after a real confirmed send', async () => {
    const store = createFakeStore();
    await store.enqueue('deliver', { stopId: 'stop-05' });
    const send = vi.fn().mockResolvedValue(undefined);
    const sync = createOutboxSync({ store, send });

    await sync.flush();

    expect(send).toHaveBeenCalledTimes(1);
    expect(await store.list()).toHaveLength(0);
  });

  it('never removes an item when send fails — marks it erro and keeps it queued', async () => {
    const store = createFakeStore();
    await store.enqueue('deliver', { stopId: 'stop-05' });
    const send = vi.fn().mockRejectedValue(new Error('rede indisponível'));
    const sync = createOutboxSync({ store, send });

    await sync.flush();

    const items = await store.list();
    expect(items).toHaveLength(1);
    const [item] = items;
    expect(item?.status).toBe('erro');
    expect(item?.attempts).toBe(1);
    expect(item?.lastError).toBe('rede indisponível');
    sync.dispose();
  });

  it('retries a failed item using the exact same idempotency key', async () => {
    const store = createFakeStore();
    const enqueued = await store.enqueue('deliver', { stopId: 'stop-05' });
    let callCount = 0;
    const receivedKeys: string[] = [];
    const send = vi.fn().mockImplementation(async (item) => {
      receivedKeys.push(item.idempotencyKey);
      callCount += 1;
      if (callCount === 1) throw new Error('timeout');
    });
    const sync = createOutboxSync({ store, send });

    await sync.flush();
    await sync.flush();

    expect(receivedKeys).toEqual([enqueued.idempotencyKey, enqueued.idempotencyKey]);
    expect(await store.list()).toHaveLength(0);
    sync.dispose();
  });

  it('does not run two flushes concurrently', async () => {
    const store = createFakeStore();
    await store.enqueue('deliver', { stopId: 'stop-05' });
    let concurrentCalls = 0;
    let maxConcurrent = 0;
    const send = vi.fn().mockImplementation(async () => {
      concurrentCalls += 1;
      maxConcurrent = Math.max(maxConcurrent, concurrentCalls);
      await new Promise((resolve) => setTimeout(resolve, 10));
      concurrentCalls -= 1;
    });
    const sync = createOutboxSync({ store, send });

    await Promise.all([sync.flush(), sync.flush()]);

    expect(maxConcurrent).toBe(1);
    sync.dispose();
  });
});
