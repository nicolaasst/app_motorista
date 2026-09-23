import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './app.js';

test('API em memória autentica e expõe a rota do dia', async (t) => {
  const { app } = createApp();
  t.after(() => app.close());
  const login = await app.inject({ method: 'POST', url: '/v1/auth/login', payload: { identifier: '12345678900', password: '1234' } });
  assert.equal(login.statusCode, 200);
  const { accessToken } = login.json();
  const today = await app.inject({ method: 'GET', url: '/v1/routes/today', headers: { authorization: `Bearer ${accessToken}` } });
  assert.equal(today.statusCode, 200);
  assert.equal(today.json().route.id, 'ROM-2024-88412');
  assert.equal(today.json().route.stops.length, 18);
});

test('entrega é idempotente e cria recibo', async (t) => {
  const { app } = createApp();
  t.after(() => app.close());
  const login = await app.inject({ method: 'POST', url: '/v1/auth/login', payload: { identifier: '12345678900', password: '1234' } });
  const auth = { authorization: `Bearer ${login.json().accessToken}`, 'idempotency-key': 'delivery-test-1' };
  const payload = { recipient: 'Roberto Silveira', signature: 'Roberto Silveira', document: '28.914.302-8' };
  const first = await app.inject({ method: 'POST', url: '/v1/stops/stop-05/deliver', headers: auth, payload });
  const second = await app.inject({ method: 'POST', url: '/v1/stops/stop-05/deliver', headers: auth, payload });
  assert.equal(first.statusCode, 200); assert.deepEqual(second.json(), first.json());
  const receipts = await app.inject({ method: 'GET', url: '/v1/receipts', headers: { authorization: auth.authorization } });
  assert.equal(receipts.json().receipts.some((item) => item.invoice === 'NF-89122'), true);
});
