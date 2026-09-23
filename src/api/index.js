const mode = import.meta.env.VITE_API_MODE || 'mock';
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const tokenKey = 'rotapro.accessToken';

const jsonFetch = async (path, options = {}) => {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const accessToken = localStorage.getItem(tokenKey);
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(body.message || body.error || 'Falha na API'); error.status = response.status; throw error; }
  return body;
};

const http = {
  async login(payload) { const result = await jsonFetch('/v1/auth/login', { method: 'POST', body: JSON.stringify(payload) }); localStorage.setItem(tokenKey, result.accessToken); if (result.refreshToken) localStorage.setItem('rotapro.refreshToken', result.refreshToken); return result; },
  async logout() { try { await jsonFetch('/v1/auth/logout', { method: 'POST' }); } finally { localStorage.removeItem(tokenKey); localStorage.removeItem('rotapro.refreshToken'); } },
  today: () => jsonFetch('/v1/routes/today'),
  history: () => jsonFetch('/v1/routes/history'),
  receipts: () => jsonFetch('/v1/receipts'),
  notifications: () => jsonFetch('/v1/notifications'),
  readNotification: (id) => jsonFetch(`/v1/notifications/${id}/read`, { method: 'POST' }),
  checklist: (payload) => jsonFetch('/v1/checklists', { method: 'POST', body: JSON.stringify(payload) }),
  arrive: (stopId, payload = {}) => jsonFetch(`/v1/stops/${stopId}/arrive`, { method: 'POST', headers: { 'Idempotency-Key': payload.idempotencyKey || crypto.randomUUID() }, body: JSON.stringify(payload) }),
  deliver: (stopId, payload) => jsonFetch(`/v1/stops/${stopId}/deliver`, { method: 'POST', headers: { 'Idempotency-Key': payload.idempotencyKey || crypto.randomUUID() }, body: JSON.stringify(payload) }),
  fail: (stopId, payload) => jsonFetch(`/v1/stops/${stopId}/fail`, { method: 'POST', headers: { 'Idempotency-Key': payload.idempotencyKey || crypto.randomUUID() }, body: JSON.stringify(payload) }),
  createTicket: (payload) => jsonFetch('/v1/tickets', { method: 'POST', body: JSON.stringify(payload) }),
};

const mock = {
  async login({ identifier, password }) { if (!identifier?.trim() || !password?.trim() || password.length < 4) throw new Error('CPF, matrícula ou senha inválidos.'); return { driver: { id: identifier, name: 'Lucas Almeida', initials: 'LA', vehicle: 'Fiorino • FRT-2048' } }; },
  async logout() {},
  async today() { return {}; }, async history() { return {}; }, async receipts() { return {}; }, async notifications() { return {}; },
  async checklist(payload) { return { checklist: payload }; }, async arrive(stopId, payload) { return { stop: { id: stopId, ...payload, status: 'arrived' } }; }, async deliver(stopId, payload) { return { stop: { id: stopId, ...payload, status: 'delivered' } }; }, async fail(stopId, payload) { return { stop: { id: stopId, ...payload, status: 'failed' } }; }, async createTicket(payload) { return { ticket: payload }; },
};

export const api = mode === 'http' ? http : mock;
export const apiMode = mode;
