// Interfaces abstratas (sem implementação de plataforma) — a implementação
// web usa IndexedDB (indexedDbStore.ts); quando a Fase 9 for retomada, uma
// implementação nativa (expo-sqlite/MMKV) satisfaz a mesma interface sem
// exigir mudança em quem a consome (AppContext).

export type OutboxOperation = 'checklist' | 'arrive' | 'deliver' | 'fail';

export type OutboxStatus = 'pendente' | 'sincronizando' | 'sincronizado' | 'erro';

export interface OutboxItem {
  id: string;
  operation: OutboxOperation;
  idempotencyKey: string;
  payload: Record<string, unknown>;
  status: OutboxStatus;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  lastError?: string;
}

export interface OutboxStore {
  enqueue(operation: OutboxOperation, payload: Record<string, unknown>): Promise<OutboxItem>;
  list(): Promise<OutboxItem[]>;
  update(id: string, patch: Partial<OutboxItem>): Promise<OutboxItem | undefined>;
  remove(id: string): Promise<void>;
}

export interface KeyValueStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
}
