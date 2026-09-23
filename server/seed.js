const completedStops = Array.from({ length: 3 }, (_, index) => ({ id: `stop-0${index + 1}`, number: index + 1, customer: `Parada concluída ${index + 1}`, address: 'São Paulo', window: '12:00 - 12:30', volumes: 1, invoice: `NF-890${index + 1}`, type: 'Comercial', status: 'delivered', deliveredAt: '13:42' }));
const visibleStops = [
  { id: 'stop-05', number: 5, customer: 'Farmácia Santa Clara Ltda', address: 'Av. Paulista, 1230 - Bela Vista, São Paulo', window: '14:00 - 14:30', volumes: 3, invoice: 'NF-89122', type: 'Comercial', status: 'navigating' },
  { id: 'stop-06', number: 6, customer: 'Supermercado Central', address: 'Rua Augusta, 890 - Consolação', window: '14:45 - 15:15', volumes: 5, invoice: 'NF-89130', type: 'Comercial', status: 'pending' },
  { id: 'stop-07', number: 7, customer: 'Dra. Camila Torres', address: 'Alameda Santos, 450 - Cerqueira César', window: '15:30 - 16:00', volumes: 1, invoice: 'NF-89144', type: 'Residencial', status: 'pending' },
  { id: 'stop-08', number: 8, customer: 'Tech Solutions SP', address: 'Rua da Consolação, 2100 - Consolação', window: '16:20 - 16:50', volumes: 2, invoice: 'NF-89151', type: 'Comercial', status: 'delivered', deliveredAt: '13:42' },
];
const extraStops = Array.from({ length: 11 }, (_, index) => { const number = index + 9; return { id: `stop-${String(number).padStart(2, '0')}`, number, customer: `Cliente da rota ${number}`, address: 'São Paulo', window: '16:50 - 17:20', volumes: 1, invoice: `NF-89${number}`, type: 'Comercial', status: 'pending' }; });

export const seed = {
  drivers: [{ id: 'driver-demo', identifier: '12345678900', registration: 'MTR-2048', name: 'Lucas Almeida', initials: 'LA', role: 'driver', password: '1234', vehicle: 'Fiorino • FRT-2048', preferences: { navigation: 'rotapro' } }],
  sessions: [], refreshTokens: [], otpRequests: [],
  routes: [{ id: 'ROM-2024-88412', driverId: 'driver-demo', sector: 'Setor Paulista 03', date: 'Hoje, 24 de outubro', shift: 'Turno da tarde', distance: '42,5 km', estimate: '17:30', status: 'Em operação', stops: [...completedStops, ...visibleStops, ...extraStops] }],
  history: [{ id: 'ROM-2024-88376', date: '23 out. 2024', sector: 'Setor Centro 02', stops: 16, delivered: 16, distance: '38,2 km', duration: '7h 12min', status: 'Concluída' }, { id: 'ROM-2024-88322', date: '22 out. 2024', sector: 'Setor Moema 01', stops: 14, delivered: 13, distance: '31,8 km', duration: '6h 48min', status: 'Concluída com ocorrência' }],
  receipts: [{ id: 'receipt-88401', invoice: 'NF-89098', customer: 'Hospital Vida Nova', address: 'Av. Brasil, 560 - Jardim América', amount: 'R$ 1.280,00', date: '23 out. 2024', status: 'Entregue', recipient: 'Mariana Alves', signature: 'Mariana Alves', routeId: 'ROM-2024-88376' }],
  checklists: [], tickets: [], notifications: [{ id: 'notification-1', title: 'Rota sincronizada', body: 'Sua rota da tarde está pronta.', unread: true, deepLink: '/rota' }, { id: 'notification-2', title: 'Janela de entrega', body: 'A próxima parada começa às 14:00.', unread: true, deepLink: '/rota/parada/stop-05' }, { id: 'notification-3', title: 'Lembrete', body: 'Faça o checklist antes de sair.', unread: true, deepLink: '/checklist' }], pushSubscriptions: [], idempotency: {}, audit: [], uploads: [],
};

export function createEventBus() {
  const listeners = new Set();
  return { publish(event) { for (const listener of listeners) listener(event); }, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); } };
}
