import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, apiMode } from '../api/index.js';
import {
  fixtureRoute,
  fixtureReceipts,
  fixtureHistory,
  fixtureNotifications,
  vehicleChecklistItems,
  returnChecklistItems,
} from '../lib/fixtures.js';
import { evaluateChecklist } from '../lib/domain/checklist.ts';
import { checkCanFinishRoute } from '../lib/domain/route.ts';
import { createIndexedDbKeyValueStore, createIndexedDbOutboxStore } from '../lib/offline/indexedDbStore.ts';
import { createOutboxSync } from '../lib/offline/outboxSync.ts';

const AppContext = createContext(null);
const PERSISTED_STATE_KEY = 'app-state';
const emptyChecklist = { completed: false, approved: false, items: {}, syncStatus: null };

export function AppProvider({ children }) {
  const [driver, setDriver] = useState(null);
  const [vehicleChecklist, setVehicleChecklist] = useState(emptyChecklist);
  const [returnChecklist, setReturnChecklist] = useState(emptyChecklist);
  const [route, setRoute] = useState(fixtureRoute);
  const [receipts, setReceipts] = useState(fixtureReceipts);
  const [history, setHistory] = useState(fixtureHistory);
  const [notifications, setNotifications] = useState(fixtureNotifications);
  const [toast, setToast] = useState(null);
  const hydratedRef = useRef(false);
  const [hydrated, setHydrated] = useState(false);
  const kvStore = useMemo(() => createIndexedDbKeyValueStore(), []);
  const outboxStore = useMemo(() => createIndexedDbOutboxStore(), []);

  const showToast = (message, tone = 'success') => { setToast({ message, tone, id: Date.now() }); window.setTimeout(() => setToast(null), 3400); };

  // Persistência real da jornada: sessão, rota do dia, checklists, recibos,
  // histórico e notificações sobrevivem a recarregar/fechar o app (Fase 5).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await kvStore.get(PERSISTED_STATE_KEY);
      if (cancelled) return;
      if (stored) {
        if (stored.driver) setDriver(stored.driver);
        if (stored.vehicleChecklist) setVehicleChecklist(stored.vehicleChecklist);
        if (stored.returnChecklist) setReturnChecklist(stored.returnChecklist);
        if (stored.route) setRoute(stored.route);
        if (stored.receipts) setReceipts(stored.receipts);
        if (stored.history) setHistory(stored.history);
        if (stored.notifications) setNotifications(stored.notifications);
      }
      hydratedRef.current = true;
      setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, [kvStore]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    kvStore.set(PERSISTED_STATE_KEY, { driver, vehicleChecklist, returnChecklist, route, receipts, history, notifications });
  }, [kvStore, driver, vehicleChecklist, returnChecklist, route, receipts, history, notifications]);

  // Fila de saída offline-first: checklist/chegada/entrega/ocorrência
  // gravam local primeiro (estado "pendente"), depois tentam sincronizar
  // com o backend. Nunca marca "sincronizado" sem confirmação real do
  // servidor — ver src/lib/offline/outboxSync.ts.
  const outboxSync = useMemo(() => createOutboxSync({
    store: outboxStore,
    send: async (item) => {
      const payload = { ...item.payload, idempotencyKey: item.idempotencyKey };
      if (item.operation === 'checklist') {
        await api.checklist(payload);
        return;
      }
      const { stopId, ...rest } = payload;
      if (item.operation === 'arrive') await api.arrive(stopId, rest);
      if (item.operation === 'deliver') { const result = await api.deliver(stopId, rest); applyDeliverResult(stopId, result); }
      if (item.operation === 'fail') await api.fail(stopId, rest);
      markStopSynced(stopId, item.operation);
    },
  }), [outboxStore]);

  useEffect(() => {
    const handleOnline = () => outboxSync.flush();
    window.addEventListener('online', handleOnline);
    outboxSync.flush();
    return () => { window.removeEventListener('online', handleOnline); outboxSync.dispose(); };
  }, [outboxSync]);

  function markStopSynced(stopId, operation) {
    if (operation !== 'deliver' && operation !== 'fail') return;
    setRoute((current) => ({ ...current, stops: current.stops.map((stop) => stop.id === stopId ? { ...stop, syncStatus: 'sincronizado' } : stop) }));
  }

  function applyDeliverResult(stopId, result) {
    if (result?.receipt) setReceipts((current) => [result.receipt, ...current.filter((receipt) => receipt.invoice !== result.receipt.invoice)]);
  }

  async function enqueueAndSync(operation, payload) {
    if (apiMode !== 'http') return; // modo mock não tem backend real para sincronizar
    await outboxStore.enqueue(operation, payload);
    outboxSync.flush();
  }

  const login = async ({ identifier, password }) => { try { const result = await api.login({ identifier: identifier?.trim(), password: password?.trim() }); setDriver(result.driver); if (apiMode === 'http') { const data = await api.today(); if (data.route) setRoute(data.route); const receiptsData = await api.receipts(); if (receiptsData.receipts) setReceipts(receiptsData.receipts); const notificationsData = await api.notifications(); if (notificationsData.notifications) setNotifications(notificationsData.notifications); } showToast('Login realizado. Vamos preparar seu turno.'); return { ok: true }; } catch (error) { return { ok: false, message: error.message }; } };

  const logout = async () => { await api.logout(); setDriver(null); setVehicleChecklist(emptyChecklist); setReturnChecklist(emptyChecklist); };

  const updateChecklist = async (kind, items, metadata = {}) => {
    const definitions = kind === 'vehicle' ? vehicleChecklistItems : returnChecklistItems;
    const evaluation = evaluateChecklist(definitions, items);
    const nextState = { completed: evaluation.complete, approved: evaluation.approved, items, failedCriticalKeys: evaluation.failedCriticalKeys, syncStatus: apiMode === 'http' ? 'pendente' : null };
    if (kind === 'vehicle') setVehicleChecklist(nextState); else setReturnChecklist(nextState);
    await enqueueAndSync('checklist', { type: kind, items, ...metadata });
    return evaluation.approved;
  };

  const startNavigation = async (stopId) => { setRoute((current) => ({ ...current, stops: current.stops.map((stop) => stop.id === stopId && ['pending', 'navigating'].includes(stop.status) ? { ...stop, status: 'navigating' } : stop) })); await enqueueAndSync('arrive', { stopId, phase: 'navigation' }); };

  const confirmDelivery = async (stopId, delivery) => {
    const stop = route.stops.find((item) => item.id === stopId);
    if (!stop) return false;
    const deliveredAt = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const syncStatus = apiMode === 'http' ? 'pendente' : 'sincronizado';
    const updatedStop = { ...stop, ...delivery, status: 'delivered', deliveredAt, syncStatus };
    setRoute((current) => ({ ...current, stops: current.stops.map((item) => item.id === stopId ? updatedStop : item) }));
    if (apiMode === 'http') {
      await enqueueAndSync('deliver', { stopId, ...delivery });
    } else {
      setReceipts((current) => [{ id: `receipt-${stop.invoice}`, invoice: stop.invoice, customer: stop.customer, address: stop.address, amount: `R$ ${(stop.volumes * 420 + 320).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, date: '24 out. 2024', status: 'Entregue', recipient: delivery.recipient, signature: delivery.signature, routeId: route.id, deliveredAt }, ...current.filter((receipt) => receipt.invoice !== stop.invoice)]);
    }
    setNotifications((current) => [{ id: `notification-${Date.now()}`, title: 'Entrega confirmada', body: `${stop.customer} recebeu ${stop.volumes} volume(s).`, unread: true }, ...current]);
    showToast(`Entrega da parada #${stop.number} confirmada.`);
    return true;
  };

  const registerFailure = async (stopId, occurrence) => {
    const stop = route.stops.find((item) => item.id === stopId);
    if (!stop) return false;
    const syncStatus = apiMode === 'http' ? 'pendente' : 'sincronizado';
    const updatedStop = { ...stop, status: 'failed', failure: occurrence, failedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), syncStatus };
    setRoute((current) => ({ ...current, stops: current.stops.map((item) => item.id === stopId ? updatedStop : item) }));
    await enqueueAndSync('fail', { stopId, ...occurrence });
    setNotifications((current) => [{ id: `notification-${Date.now()}`, title: 'Ocorrência registrada', body: `${stop.customer}: ${occurrence.reason}.`, unread: true }, ...current]);
    showToast('Ocorrência registrada. Sincronizando com a central...', 'warning');
    return true;
  };

  const finishRoute = () => {
    const check = checkCanFinishRoute(route);
    if (!check.canFinish) {
      if (check.reason === 'ja-encerrada') showToast('Esta rota já foi encerrada.', 'warning');
      else showToast(`Conclua as ${check.pendingStopIds.length} parada(s) restante(s) antes de encerrar a rota.`, 'warning');
      return false;
    }
    setRoute((current) => ({ ...current, status: 'Concluída' }));
    setHistory((current) => [{ id: route.id, date: route.date, sector: route.sector, stops: route.stops.length, delivered: route.stops.filter((stop) => stop.status === 'delivered').length, distance: route.distance, duration: '7h 30min', status: route.stops.some((stop) => stop.status === 'failed') ? 'Concluída com ocorrência' : 'Concluída' }, ...current.filter((item) => item.id !== route.id)]);
    setVehicleChecklist(emptyChecklist);
    setReturnChecklist(emptyChecklist);
    showToast('Rota encerrada. Faça o checklist de retorno.');
    return true;
  };

  const markNotificationsRead = () => { setNotifications((current) => current.map((item) => ({ ...item, unread: false }))); if (apiMode === 'http') notifications.filter((item) => item.unread).forEach((item) => api.readNotification?.(item.id)); };

  const createTicket = async (payload) => { if (apiMode === 'http') await api.createTicket(payload); showToast('Chamado enviado para análise.'); return true; };

  const value = useMemo(() => ({ driver, route, receipts, history, notifications, toast, vehicleChecklist, returnChecklist, isAuthenticated: Boolean(driver), apiMode, hydrated, login, logout, updateChecklist, startNavigation, confirmDelivery, registerFailure, finishRoute, markNotificationsRead, createTicket, showToast }), [driver, route, receipts, history, notifications, toast, vehicleChecklist, returnChecklist, hydrated]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp() { const context = useContext(AppContext); if (!context) throw new Error('useApp precisa ser usado dentro de AppProvider'); return context; }
