import { fixtureRoute, fixtureReceipts, fixtureHistory, fixtureNotifications } from '../src/lib/fixtures.js';

export const seed = {
  drivers: [{ id: 'driver-demo', identifier: '12345678900', registration: 'MTR-2048', name: 'Lucas Almeida', initials: 'LA', role: 'driver', password: '1234', vehicle: 'Fiorino • FRT-2048', preferences: { navigation: 'rotapro' } }],
  sessions: [], refreshTokens: [], otpRequests: [],
  routes: [{ ...fixtureRoute, driverId: 'driver-demo' }],
  history: fixtureHistory,
  receipts: fixtureReceipts,
  checklists: [], tickets: [], notifications: fixtureNotifications, pushSubscriptions: [], idempotency: {}, audit: [], uploads: [],
};

export function createEventBus() {
  const listeners = new Set();
  return { publish(event) { for (const listener of listeners) listener(event); }, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); } };
}
