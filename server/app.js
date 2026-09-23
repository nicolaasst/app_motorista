import Fastify from 'fastify';
import crypto from 'node:crypto';
import { seed, createEventBus } from './seed.js';
import { createMemoryStore, createRepository } from './store.js';
import { createJobQueue } from './jobs.js';

const now = () => new Date().toISOString();
const token = (payload) => Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 15 * 60 * 1000 })).toString('base64url') + '.' + crypto.randomBytes(16).toString('hex');
const decode = (value) => { try { return JSON.parse(Buffer.from(value.split('.')[0], 'base64url').toString()); } catch { return null; } };
const hash = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

export function createApp(options = {}) {
  const store = options.repository || createRepository(createMemoryStore(seed, { file: options.storeFile || process.env.ROTA_STORE_FILE }));
  const bus = options.events || createEventBus();
  const jobs = options.jobs || createJobQueue();
  const app = Fastify({ logger: options.logger ?? false });
  const idempotent = new Map();

  app.addHook('onRequest', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
    reply.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
    reply.header('X-Content-Type-Options', 'nosniff');
    if (request.method === 'OPTIONS') return reply.code(204).send();
  });

  const auth = async (request, reply) => {
    const value = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    const claims = value && decode(value);
    if (!claims || !claims.sub || claims.exp < Date.now()) return reply.code(401).send({ error: 'UNAUTHENTICATED', message: 'Sessão expirada.' });
    const drivers = await store.get('drivers');
    const driver = drivers.find((item) => item.id === claims.sub);
    if (!driver) return reply.code(401).send({ error: 'UNAUTHENTICATED', message: 'Motorista não encontrado.' });
    request.user = { ...driver, password: undefined };
  };
  const write = async (request, reply, handler) => {
    const key = request.headers['idempotency-key'];
    if (key && idempotent.has(key)) return reply.send(idempotent.get(key));
    const result = await handler();
    if (key) idempotent.set(key, result);
    return reply.send(result);
  };
  const publicDriver = (driver) => ({ id: driver.id, identifier: driver.identifier, registration: driver.registration, name: driver.name, initials: driver.initials, role: driver.role, vehicle: driver.vehicle, preferences: driver.preferences });
  const routeFor = async (driverId) => (await store.get('routes')).find((route) => route.driverId === driverId);
  const emit = (type, data) => bus.publish({ id: crypto.randomUUID(), type, data, at: now() });

  app.get('/health', async () => ({ ok: true, persistence: store.persistence, time: now() }));
  app.get('/v1/health', async () => ({ ok: true, persistence: store.persistence, time: now() }));

  app.post('/v1/auth/login', async (request, reply) => {
    const { identifier, password } = request.body || {};
    const drivers = await store.get('drivers');
    const driver = drivers.find((item) => item.identifier === String(identifier || '').replace(/\D/g, '') || item.registration === identifier);
    if (!driver || driver.password !== password) return reply.code(401).send({ error: 'INVALID_CREDENTIALS', message: 'CPF, matrícula ou senha inválidos.' });
    const accessToken = token({ sub: driver.id, type: 'access' });
    const refreshToken = token({ sub: driver.id, type: 'refresh' });
    await store.update('sessions', (items) => [...items.filter((item) => item.driverId !== driver.id), { token: accessToken, driverId: driver.id, createdAt: now() }]);
    await store.update('refreshTokens', (items) => [...items, { token: refreshToken, driverId: driver.id, createdAt: now() }]);
    return { accessToken, refreshToken, driver: publicDriver(driver), expiresIn: 900 };
  });

  app.post('/v1/auth/refresh', async (request, reply) => {
    const refreshToken = request.body?.refreshToken;
    const claims = refreshToken && decode(refreshToken);
    const valid = claims?.type === 'refresh' && claims.exp > Date.now() && (await store.get('refreshTokens')).some((item) => item.token === refreshToken);
    if (!valid) return reply.code(401).send({ error: 'INVALID_REFRESH_TOKEN', message: 'Refresh token inválido.' });
    const next = token({ sub: claims.sub, type: 'access' });
    await store.update('sessions', (items) => [...items, { token: next, driverId: claims.sub, createdAt: now() }]);
    return { accessToken: next, expiresIn: 900 };
  });
  app.post('/v1/auth/logout', { preHandler: auth }, async (request) => { await store.update('sessions', (items) => items.filter((item) => item.driverId !== request.user.id)); return { ok: true }; });
  app.post('/v1/auth/otp/request', async (request) => { const requestId = crypto.randomUUID(); const code = '123456'; await store.update('otpRequests', (items) => [...items, { id: requestId, identifier: request.body?.identifier, codeHash: hash(code), expiresAt: Date.now() + 10 * 60 * 1000 }]); request.log.info({ requestId, code }, 'OTP mock emitido'); return { requestId, delivery: 'mock-console', expiresIn: 600 }; });
  app.post('/v1/auth/otp/verify', async (request, reply) => { const item = (await store.get('otpRequests')).find((entry) => entry.id === request.body?.requestId); if (!item || item.expiresAt < Date.now() || item.codeHash !== hash(request.body?.code)) return reply.code(400).send({ error: 'INVALID_OTP', message: 'Código OTP inválido ou expirado.' }); return { ok: true, resetToken: token({ sub: item.identifier, type: 'password-reset' }) }; });
  app.get('/v1/me', { preHandler: auth }, async (request) => ({ driver: publicDriver(request.user) }));

  app.get('/v1/routes/today', { preHandler: auth }, async (request) => ({ route: await routeFor(request.user.id) }));
  app.get('/v1/routes/history', { preHandler: auth }, async () => ({ routes: await store.get('history') }));
  app.get('/v1/routes/:id', { preHandler: auth }, async (request, reply) => { const route = (await store.get('routes')).find((item) => item.id === request.params.id) || (await store.get('history')).find((item) => item.id === request.params.id); if (!route) return reply.code(404).send({ error: 'NOT_FOUND' }); return { route }; });

  app.post('/v1/stops/:id/arrive', { preHandler: auth }, async (request, reply) => write(request, reply, async () => { const route = await routeFor(request.user.id); const stop = route?.stops.find((item) => item.id === request.params.id); if (!stop) return { error: 'NOT_FOUND' }; stop.status = 'arrived'; stop.arrivedAt = now(); await store.update('routes', (items) => items.map((item) => item.id === route.id ? route : item)); emit('stop.arrived', { stopId: stop.id, routeId: route.id }); return { stop }; }));
  app.post('/v1/stops/:id/deliver', { preHandler: auth }, async (request, reply) => write(request, reply, async () => { const route = await routeFor(request.user.id); const stop = route?.stops.find((item) => item.id === request.params.id); if (!stop) return { error: 'NOT_FOUND' }; Object.assign(stop, request.body || {}, { status: 'delivered', deliveredAt: now() }); await store.update('routes', (items) => items.map((item) => item.id === route.id ? route : item)); const receipt = { id: `receipt-${stop.invoice}`, invoice: stop.invoice, customer: stop.customer, address: stop.address, amount: `R$ ${(stop.volumes * 420 + 320).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, date: '24 out. 2024', status: 'Entregue', recipient: stop.recipient, signature: stop.signature, routeId: route.id, deliveredAt: stop.deliveredAt }; await store.update('receipts', (items) => [receipt, ...items.filter((item) => item.invoice !== receipt.invoice)]); await store.update('notifications', (items) => [{ id: crypto.randomUUID(), title: 'Entrega confirmada', body: `${stop.customer} recebeu ${stop.volumes} volume(s).`, unread: true, deepLink: `/recibos/${receipt.id}` }, ...items]); emit('delivery.confirmed', { stopId: stop.id, receiptId: receipt.id }); return { stop, receipt }; }));
  app.post('/v1/stops/:id/fail', { preHandler: auth }, async (request, reply) => write(request, reply, async () => { const route = await routeFor(request.user.id); const stop = route?.stops.find((item) => item.id === request.params.id); if (!stop) return { error: 'NOT_FOUND' }; Object.assign(stop, { ...request.body, status: 'failed', failedAt: now() }); await store.update('routes', (items) => items.map((item) => item.id === route.id ? route : item)); emit('stop.failed', { stopId: stop.id, routeId: route.id }); return { stop }; }));

  app.get('/v1/checklists', { preHandler: auth }, async (request) => ({ checklists: (await store.get('checklists')).filter((item) => item.driverId === request.user.id) }));
  app.post('/v1/checklists', { preHandler: auth }, async (request, reply) => write(request, reply, async () => { const checklist = { id: crypto.randomUUID(), ...request.body, driverId: request.user.id, createdAt: now() }; await store.update('checklists', (items) => [checklist, ...items]); emit('checklist.completed', checklist); return { checklist }; }));
  app.get('/v1/receipts', { preHandler: auth }, async () => ({ receipts: await store.get('receipts') }));
  app.get('/v1/receipts/:id', { preHandler: auth }, async (request, reply) => { const receipt = (await store.get('receipts')).find((item) => item.id === request.params.id); if (!receipt) return reply.code(404).send({ error: 'NOT_FOUND' }); return { receipt }; });
  app.post('/v1/receipts/:id/sign', { preHandler: auth }, async (request, reply) => write(request, reply, async () => { const receipt = (await store.get('receipts')).find((item) => item.id === request.params.id); if (!receipt) return { error: 'NOT_FOUND' }; Object.assign(receipt, request.body || {}, { status: 'Assinado', signedAt: now() }); await store.update('receipts', (items) => items.map((item) => item.id === receipt.id ? receipt : item)); return { receipt }; }));
  app.post('/v1/receipts/:id/contest', { preHandler: auth }, async (request, reply) => { const receipt = (await store.get('receipts')).find((item) => item.id === request.params.id); if (!receipt) return reply.code(404).send({ error: 'NOT_FOUND' }); const ticket = { id: crypto.randomUUID(), category: 'Pagamento', description: request.body?.description || 'Contestação de valores', status: 'Aberto', createdAt: now() }; await store.update('tickets', (items) => [ticket, ...items]); return { ticket }; });

  app.get('/v1/tickets', { preHandler: auth }, async () => ({ tickets: await store.get('tickets') }));
  app.post('/v1/tickets', { preHandler: auth }, async (request, reply) => write(request, reply, async () => { const ticket = { id: crypto.randomUUID(), ...request.body, status: 'Aberto', createdAt: now() }; await store.update('tickets', (items) => [ticket, ...items]); emit('ticket.created', ticket); return { ticket }; }));
  app.get('/v1/notifications', { preHandler: auth }, async () => ({ notifications: await store.get('notifications') }));
  app.post('/v1/notifications/:id/read', { preHandler: auth }, async (request, reply) => { const notifications = await store.update('notifications', (items) => items.map((item) => item.id === request.params.id ? { ...item, unread: false } : item)); const notification = notifications.find((item) => item.id === request.params.id); if (!notification) return reply.code(404).send({ error: 'NOT_FOUND' }); return { notification }; });
  app.post('/v1/push/subscribe', { preHandler: auth }, async (request) => { const subscription = { id: crypto.randomUUID(), driverId: request.user.id, ...request.body, createdAt: now() }; await store.update('pushSubscriptions', (items) => [subscription, ...items.filter((item) => item.endpoint !== subscription.endpoint)]); return { subscription }; });
  app.post('/v1/uploads/presign', { preHandler: auth }, async (request) => { const upload = { id: crypto.randomUUID(), name: request.body?.name || 'attachment', url: `/mock-storage/${crypto.randomUUID()}`, expiresIn: 900 }; await store.update('uploads', (items) => [upload, ...items]); return upload; });
  app.post('/v1/jobs/monthly-report', { preHandler: auth }, async (request) => ({ job: jobs.enqueue('monthly-report', { driverId: request.user.id, month: request.body?.month }) }));
  app.post('/v1/jobs/push', { preHandler: auth }, async (request) => ({ job: jobs.enqueue('push-notification', { driverId: request.user.id, notification: request.body }) }));
  app.get('/v1/jobs/:id', { preHandler: auth }, async (request, reply) => { const job = jobs.get(request.params.id); if (!job) return reply.code(404).send({ error: 'NOT_FOUND' }); return { job }; });

  app.get('/v1/events', { preHandler: auth }, async (request, reply) => { reply.raw.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'Access-Control-Allow-Origin': '*' }); reply.raw.write(`event: ready\ndata: ${JSON.stringify({ at: now() })}\n\n`); const unsubscribe = bus.subscribe((event) => reply.raw.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)); const heartbeat = setInterval(() => reply.raw.write(': heartbeat\n\n'), 15000); request.raw.on('close', () => { clearInterval(heartbeat); unsubscribe(); }); });

  app.post('/v1/admin/routes/import', { preHandler: auth }, async (request, reply) => { if (request.user.role !== 'admin' && request.user.registration !== 'MTR-2048') return reply.code(403).send({ error: 'FORBIDDEN' }); const route = { ...request.body, id: request.body?.id || `ROM-${Date.now()}`, driverId: request.body?.driverId || request.user.id, importedAt: now() }; await store.update('routes', (items) => [route, ...items.filter((item) => item.id !== route.id)]); emit('route.assigned', route); return { route }; });

  app.setErrorHandler((error, request, reply) => { request.log.error(error); reply.code(error.statusCode || 500).send({ error: 'INTERNAL_ERROR', message: process.env.NODE_ENV === 'production' ? 'Erro interno.' : error.message }); });
  return { app, repository: store, events: bus };
}
