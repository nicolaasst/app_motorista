import fs from 'node:fs/promises';
import path from 'node:path';

export function createMemoryStore(seed, options = {}) {
  let state = structuredClone(seed);
  const file = options.file;
  let writeQueue = Promise.resolve();

  async function persist() {
    if (!file) return;
    writeQueue = writeQueue.then(async () => {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, JSON.stringify(state, null, 2));
    });
    return writeQueue;
  }

  return {
    kind: file ? 'memory+json-snapshot' : 'memory',
    async get(key) { return structuredClone(state[key]); },
    async set(key, value) { state[key] = structuredClone(value); await persist(); return structuredClone(state[key]); },
    async update(key, updater) { const next = await updater(structuredClone(state[key])); state[key] = structuredClone(next); await persist(); return structuredClone(next); },
    async dump() { return structuredClone(state); },
  };
}

export function createRepository(store) {
  return {
    get: (key) => store.get(key),
    set: (key, value) => store.set(key, value),
    update: (key, updater) => store.update(key, updater),
    snapshot: () => store.dump(),
    persistence: store.kind,
  };
}
