import { beforeEach, describe, expect, it } from 'vitest';
import {
  createIndexedDbKeyValueStore,
  createIndexedDbOutboxStore,
  __resetDbForTests,
} from './indexedDbStore.js';
import { indexedDB } from 'fake-indexeddb';

beforeEach(async () => {
  await __resetDbForTests();
  // fake-indexeddb não expõe um "reset total" — apaga o banco entre testes
  // para garantir isolamento (cada teste começa com storage vazio). A
  // conexão anterior já foi fechada por __resetDbForTests, então
  // deleteDatabase não fica bloqueada esperando ela fechar.
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('rotapro-driver');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
});

describe('createIndexedDbKeyValueStore', () => {
  it('persists and retrieves a value', async () => {
    const store = createIndexedDbKeyValueStore();
    await store.set('session', { driverId: 'driver-demo' });
    const value = await store.get('session');
    expect(value).toEqual({ driverId: 'driver-demo' });
  });

  it('returns undefined for a missing key', async () => {
    const store = createIndexedDbKeyValueStore();
    expect(await store.get('nao-existe')).toBeUndefined();
  });

  it('deletes a value', async () => {
    const store = createIndexedDbKeyValueStore();
    await store.set('route', { id: 'ROM-2024-88412' });
    await store.delete('route');
    expect(await store.get('route')).toBeUndefined();
  });

  it('survives being reopened (simulates reload)', async () => {
    const store = createIndexedDbKeyValueStore();
    await store.set('session', { driverId: 'driver-demo' });
    await __resetDbForTests();
    const reopened = createIndexedDbKeyValueStore();
    expect(await reopened.get('session')).toEqual({ driverId: 'driver-demo' });
  });
});

describe('createIndexedDbOutboxStore', () => {
  it('enqueues an item with pendente status and a unique idempotency key', async () => {
    const store = createIndexedDbOutboxStore();
    const item = await store.enqueue('deliver', { stopId: 'stop-05' });
    expect(item.status).toBe('pendente');
    expect(item.idempotencyKey).toBeTruthy();
    expect(item.attempts).toBe(0);
  });

  it('lists enqueued items', async () => {
    const store = createIndexedDbOutboxStore();
    await store.enqueue('deliver', { stopId: 'stop-05' });
    await store.enqueue('fail', { stopId: 'stop-06' });
    const items = await store.list();
    expect(items).toHaveLength(2);
  });

  it('updates an item and keeps the same idempotency key', async () => {
    const store = createIndexedDbOutboxStore();
    const item = await store.enqueue('checklist', { type: 'vehicle' });
    const updated = await store.update(item.id, { status: 'sincronizando' });
    expect(updated?.status).toBe('sincronizando');
    expect(updated?.idempotencyKey).toBe(item.idempotencyKey);
  });

  it('removes an item', async () => {
    const store = createIndexedDbOutboxStore();
    const item = await store.enqueue('arrive', { stopId: 'stop-05' });
    await store.remove(item.id);
    expect(await store.list()).toHaveLength(0);
  });
});
