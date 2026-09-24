// Fonte única de dados de exemplo, consumida por src/context/AppContext.jsx
// (modo mock) e server/seed.js (modo http). Antes da Fase 5 esses dois
// arquivos tinham cada um sua própria cópia quase idêntica — ver
// docs/PATTERN_INVENTORY.md e docs/DECISIONS.md. Este arquivo não importa
// nada de React/DOM (é elegível para extração para packages/core quando a
// Fase 9 for retomada — ver ADR-004 em docs/DECISIONS.md).
//
// Coordenadas: aproximadas manualmente a partir dos endereços de São Paulo
// já citados no texto das telas (não geocodificadas) — servem para
// demonstrar geofence com dados de exemplo plausíveis, não são precisas o
// suficiente para uso real. -23.5505,-46.6333 é o mesmo ponto de
// referência do centro de SP já hardcoded no mock de assinatura de
// B4ConfirmarEntrega.jsx.

const SAO_PAULO_CENTER = { lat: -23.5505, lng: -46.6333 };

const completedStops = Array.from({ length: 3 }, (_, index) => ({
  id: `stop-0${index + 1}`,
  number: index + 1,
  customer: `Parada concluída ${index + 1}`,
  address: 'São Paulo',
  location: SAO_PAULO_CENTER,
  window: '12:00 - 12:30',
  volumes: 1,
  invoice: `NF-890${index + 1}`,
  type: 'Comercial',
  status: 'delivered',
  deliveredAt: '13:42',
}));

const visibleStops = [
  {
    id: 'stop-05',
    number: 5,
    customer: 'Farmácia Santa Clara Ltda',
    address: 'Av. Paulista, 1230 - Bela Vista, São Paulo',
    location: { lat: -23.5613, lng: -46.6565 },
    window: '14:00 - 14:30',
    volumes: 3,
    invoice: 'NF-89122',
    type: 'Comercial',
    status: 'navigating',
  },
  {
    id: 'stop-06',
    number: 6,
    customer: 'Supermercado Central',
    address: 'Rua Augusta, 890 - Consolação',
    location: { lat: -23.5539, lng: -46.6579 },
    window: '14:45 - 15:15',
    volumes: 5,
    invoice: 'NF-89130',
    type: 'Comercial',
    status: 'pending',
  },
  {
    id: 'stop-07',
    number: 7,
    customer: 'Dra. Camila Torres',
    address: 'Alameda Santos, 450 - Cerqueira César',
    location: { lat: -23.5647, lng: -46.6558 },
    window: '15:30 - 16:00',
    volumes: 1,
    invoice: 'NF-89144',
    type: 'Residencial',
    status: 'pending',
  },
  {
    id: 'stop-08',
    number: 8,
    customer: 'Tech Solutions SP',
    address: 'Rua da Consolação, 2100 - Consolação',
    location: { lat: -23.5578, lng: -46.6626 },
    window: '16:20 - 16:50',
    volumes: 2,
    invoice: 'NF-89151',
    type: 'Comercial',
    status: 'delivered',
    deliveredAt: '13:42',
  },
];

const extraStops = Array.from({ length: 11 }, (_, index) => {
  const number = index + 9;
  return {
    id: `stop-${String(number).padStart(2, '0')}`,
    number,
    customer: `Cliente da rota ${number}`,
    address: 'São Paulo',
    location: SAO_PAULO_CENTER,
    window: '16:50 - 17:20',
    volumes: 1,
    invoice: `NF-89${number}`,
    type: 'Comercial',
    status: 'pending',
  };
});

export const fixtureStops = [...completedStops, ...visibleStops, ...extraStops];

export const fixtureRoute = {
  id: 'ROM-2024-88412',
  sector: 'Setor Paulista 03',
  date: 'Hoje, 24 de outubro',
  shift: 'Turno da tarde',
  distance: '42,5 km',
  estimate: '17:30',
  status: 'Em operação',
  stops: fixtureStops,
};

export const fixtureReceipts = [
  {
    id: 'receipt-88401',
    invoice: 'NF-89098',
    customer: 'Hospital Vida Nova',
    address: 'Av. Brasil, 560 - Jardim América',
    amount: 'R$ 1.280,00',
    date: '23 out. 2024',
    status: 'Entregue',
    recipient: 'Mariana Alves',
    signature: 'Mariana Alves',
    routeId: 'ROM-2024-88376',
  },
];

export const fixtureHistory = [
  {
    id: 'ROM-2024-88376',
    date: '23 out. 2024',
    sector: 'Setor Centro 02',
    stops: 16,
    delivered: 16,
    distance: '38,2 km',
    duration: '7h 12min',
    status: 'Concluída',
  },
  {
    id: 'ROM-2024-88322',
    date: '22 out. 2024',
    sector: 'Setor Moema 01',
    stops: 14,
    delivered: 13,
    distance: '31,8 km',
    duration: '6h 48min',
    status: 'Concluída com ocorrência',
  },
];

export const fixtureNotifications = [
  {
    id: 'notification-1',
    title: 'Rota sincronizada',
    body: 'Sua rota da tarde está pronta.',
    unread: true,
    deepLink: '/rota',
  },
  {
    id: 'notification-2',
    title: 'Janela de entrega',
    body: 'A próxima parada começa às 14:00.',
    unread: true,
    deepLink: '/rota/parada/stop-05',
  },
  {
    id: 'notification-3',
    title: 'Lembrete',
    body: 'Faça o checklist antes de sair.',
    unread: true,
    deepLink: '/checklist',
  },
];

// Itens do checklist de veículo/retorno com a flag `critico` (Fase 5, item
// 10). Reprovar um item crítico bloqueia o início/fechamento do turno —
// ver src/lib/checklist.js. Lista conservadora baseada nos 5 itens já
// existentes nas telas A3/B7; não há manual operacional disponível neste
// repositório para confirmar a lista oficial completa (ver
// docs/OPEN_QUESTIONS.md).
export const vehicleChecklistItems = [
  { key: 'pneus', label: '1. Pneus e Calibragem', critico: true },
  { key: 'luzes', label: '2. Luzes, Faróis e Setas', critico: true },
  { key: 'oleo', label: '3. Nível de Óleo e Combustível', critico: true },
  { key: 'documentacao', label: '4. Documentação e CRLV-e', critico: false },
  { key: 'lataria', label: '5. Lataria e Avarias Externas', critico: false },
];

export const returnChecklistItems = [
  { key: 'combustivel', label: '1. Combustível e Fluidos', critico: false },
  { key: 'lataria', label: '2. Lataria e Novas Avarias', critico: false },
  { key: 'pneus', label: '3. Pneus e Calibragem', critico: true },
  { key: 'limpeza', label: '4. Limpeza da Cabine e Baú', critico: false },
  { key: 'chaves', label: '5. Devolução de Chaves e CRLV', critico: true },
];
