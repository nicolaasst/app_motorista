// Declaração de tipos manual para AppContext.jsx (arquivo legado, ainda não
// convertido para TS — isso acontece tela a tela na Fase 6). Sem isso, TS
// infere o retorno de useApp() como `never` (contexto criado com
// createContext(null) e estreitado por um `throw` dentro da função), o que
// quebra qualquer novo componente .tsx que a consuma. Mantida em sincronia
// manual com o formato real do value do AppContext.Provider.
import type { ReactNode } from 'react';

export interface Driver {
  id: string;
  identifier?: string;
  registration?: string;
  name: string;
  initials?: string;
  role?: string;
  vehicle?: string;
  preferences?: Record<string, unknown>;
}

export interface Stop {
  id: string;
  number: number;
  customer: string;
  address: string;
  window: string;
  volumes: number;
  invoice: string;
  type: string;
  status: 'pending' | 'navigating' | 'arrived' | 'delivered' | 'failed';
  deliveredAt?: string;
  failedAt?: string;
  recipient?: string;
  signature?: string;
  failure?: { reason: string; notes: string };
}

export interface Route {
  id: string;
  sector: string;
  date: string;
  shift: string;
  distance: string;
  estimate: string;
  status: string;
  stops: Stop[];
}

export interface Receipt {
  id: string;
  invoice: string;
  customer: string;
  address: string;
  amount: string;
  date: string;
  status: string;
  recipient?: string;
  signature?: string;
  routeId: string;
  deliveredAt?: string;
}

export interface HistoryEntry {
  id: string;
  date: string;
  sector: string;
  stops: number;
  delivered: number;
  distance: string;
  duration: string;
  status: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  unread: boolean;
  deepLink?: string;
}

export interface Toast {
  message: string;
  tone: 'success' | 'warning';
  id: number;
}

export interface ChecklistState {
  completed: boolean;
  items: Record<string, boolean>;
}

export interface AppContextValue {
  driver: Driver | null;
  route: Route;
  receipts: Receipt[];
  history: HistoryEntry[];
  notifications: AppNotification[];
  toast: Toast | null;
  vehicleChecklist: ChecklistState;
  returnChecklist: ChecklistState;
  isAuthenticated: boolean;
  apiMode: 'mock' | 'http';
  login: (payload: { identifier?: string; password?: string }) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateChecklist: (
    kind: 'vehicle' | 'return',
    items: Record<string, boolean>,
    metadata?: Record<string, unknown>,
  ) => Promise<boolean>;
  startNavigation: (stopId: string) => Promise<void>;
  confirmDelivery: (stopId: string, delivery: { recipient: string; signature: string }) => Promise<boolean>;
  registerFailure: (stopId: string, occurrence: { reason: string; notes: string }) => Promise<boolean>;
  finishRoute: () => void;
  markNotificationsRead: () => void;
  createTicket: (payload: { category: string; description: string }) => Promise<boolean>;
  showToast: (message: string, tone?: 'success' | 'warning') => void;
}

export declare function AppProvider(props: { children: ReactNode }): JSX.Element;
export declare function useApp(): AppContextValue;
