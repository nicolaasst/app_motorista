import { openDB, type IDBPDatabase } from 'idb';
import type { KeyValueStore, OutboxItem, OutboxOperation, OutboxStore } from './types.js';

const DB_NAME = 'rotapro-driver';
const DB_VERSION = 1;
const KV_STORE = 'kv';
const OUTBOX_STORE = 'outbox';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(KV_STORE)) db.createObjectStore(KV_STORE);
        if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
          db.createObjectStore(OUTBOX_STORE, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export function createIndexedDbKeyValueStore(): KeyValueStore {
  return {
    async get<T>(key: string): Promise<T | undefined> {
      const db = await getDb();
      return db.get(KV_STORE, key);
    },
    async set<T>(key: string, value: T): Promise<void> {
      const db = await getDb();
      await db.put(KV_STORE, value, key);
    },
    async delete(key: string): Promise<void> {
      const db = await getDb();
      await db.delete(KV_STORE, key);
    },
  };
}

function generateId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `outbox-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createIndexedDbOutboxStore(): OutboxStore {
  return {
    async enqueue(
      operation: OutboxOperation,
      payload: Record<string, unknown>,
    ): Promise<OutboxItem> {
      const db = await getDb();
      const now = new Date().toISOString();
      const item: OutboxItem = {
        id: generateId(),
        operation,
        idempotencyKey: generateId(),
        payload,
        status: 'pendente',
        attempts: 0,
        createdAt: now,
        updatedAt: now,
      };
      await db.put(OUTBOX_STORE, item);
      return item;
    },
    async list(): Promise<OutboxItem[]> {
      const db = await getDb();
      return db.getAll(OUTBOX_STORE);
    },
    async update(id: string, patch: Partial<OutboxItem>): Promise<OutboxItem | undefined> {
      const db = await getDb();
      const current = await db.get(OUTBOX_STORE, id);
      if (!current) return undefined;
      const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
      await db.put(OUTBOX_STORE, next);
      return next;
    },
    async remove(id: string): Promise<void> {
      const db = await getDb();
      await db.delete(OUTBOX_STORE, id);
    },
  };
}

// Só para testes: fecha a conexão aberta (deleteDatabase trava
// indefinidamente com uma conexão ainda aberta, mesmo com onblocked) e
// solta o singleton, para que o próximo getDb() abra uma conexão nova.
export async function __resetDbForTests(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
  }
  dbPromise = null;
}
