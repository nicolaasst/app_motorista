import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  useRouteError,
} from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext.jsx';

const A1LoginDoMotorista = lazy(() => import('./features/auth/pages/A1LoginDoMotorista.tsx'));
const A2EsqueciMinhaSenhaOtp = lazy(
  () => import('./features/auth/pages/A2EsqueciMinhaSenhaOtp.tsx'),
);
const A3ChecklistDoVeiculo = lazy(() => import('./features/auth/pages/A3ChecklistDoVeiculo.tsx'));
const B1RotaDoDiaHome = lazy(() => import('./pages/B1RotaDoDiaHome.jsx'));
const B2DetalheDaParada = lazy(() => import('./pages/B2DetalheDaParada.jsx'));
const B3NavegaOAtAParada = lazy(() => import('./pages/B3NavegaOAtAParada.jsx'));
const B4ConfirmarEntrega = lazy(() => import('./pages/B4ConfirmarEntrega.jsx'));
const B5RegistrarFalha = lazy(() => import('./pages/B5RegistrarFalha.jsx'));
const B6FimDeRota = lazy(() => import('./pages/B6FimDeRota.jsx'));
const B7ChecklistDeRetorno = lazy(() => import('./pages/B7ChecklistDeRetorno.jsx'));
const C1HistRicoDeRotas = lazy(() => import('./pages/C1HistRicoDeRotas.jsx'));
const C2DetalheDeRotaConcluDa = lazy(() => import('./pages/C2DetalheDeRotaConcluDa.jsx'));
const D1Recibos = lazy(() => import('./pages/D1Recibos.jsx'));
const D2DetalheDoReciboComAssinatura = lazy(
  () => import('./pages/D2DetalheDoReciboComAssinatura.jsx'),
);
const E1PerfilDoMotorista = lazy(() => import('./pages/E1PerfilDoMotorista.jsx'));
const E2CentralDeSuporteEAjuda = lazy(() => import('./pages/E2CentralDeSuporteEAjuda.jsx'));
const LogotipoRotaproDriver = lazy(() => import('./pages/LogotipoRotaproDriver.jsx'));
const DesignSystemShowcase = lazy(() => import('./dev/DesignSystemShowcase.tsx'));

function ProtectedRoutes() {
  const { isAuthenticated, hydrated } = useApp();
  // Enquanto a sessão persistida (IndexedDB) ainda está sendo carregada,
  // não decide — decidir cedo demais redireciona para "/" mesmo quando
  // existe uma sessão salva, perdendo a rota atual a cada recarregamento.
  if (!hydrated) return <RouteFallback />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
}

function RouteFallback() {
  return (
    <div style={{ padding: 24, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#1c1b1b' }}>
      Carregando…
    </div>
  );
}

function RouteErrorBoundary() {
  const error = useRouteError();
  if (import.meta.env.DEV) console.error(error);
  return (
    <div style={{ padding: 24, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#1c1b1b' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Algo deu errado</h1>
      <p style={{ marginBottom: 16 }}>
        Não foi possível carregar esta tela. Tente voltar para a rota do dia.
      </p>
      <a href="/rota" style={{ color: '#006800', fontWeight: 600 }}>
        Voltar para a Rota
      </a>
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ padding: 24, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#1c1b1b' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Página não encontrada</h1>
      <p style={{ marginBottom: 16 }}>O endereço acessado não existe no RotaPro Driver.</p>
      <a href="/" style={{ color: '#006800', fontWeight: 600 }}>
        Voltar para o início
      </a>
    </div>
  );
}

function DevGallery() {
  const screens = [
    ['/', 'A1 Login'],
    ['/recuperar', 'A2 Recuperação'],
    ['/checklist', 'A3 Checklist'],
    ['/rota', 'B1 Rota'],
    ['/rota/parada/stop-05', 'B2 Parada'],
    ['/rota/parada/stop-05/navegar', 'B3 Navegação'],
    ['/rota/parada/stop-05/entrega', 'B4 Entrega'],
    ['/rota/parada/stop-05/falha', 'B5 Falha'],
    ['/rota/fim', 'B6 Fim'],
    ['/rota/retorno', 'B7 Retorno'],
    ['/historico', 'C1 Histórico'],
    ['/historico/ROM-2024-88412', 'C2 Detalhe'],
    ['/recibos', 'D1 Recibos'],
    ['/recibos/receipt-88401', 'D2 Recibo'],
    ['/perfil', 'E1 Perfil'],
    ['/suporte', 'E2 Suporte'],
    ['/design-system', 'Design System (Fase 4)'],
  ];
  return (
    <div style={{ padding: 24, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <h1>Galeria de debug</h1>
      <p>
        O produto real começa em <a href="/">/</a>.
      </p>
      <div style={{ display: 'grid', gap: 8 }}>
        {screens.map(([to, label]) => (
          <a key={to} href={to}>
            {label} — {to}
          </a>
        ))}
      </div>
    </div>
  );
}

function RootLayout() {
  return (
    <AppProvider>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </AppProvider>
  );
}

const devOnlyRoutes = import.meta.env.DEV
  ? [
      { path: '/dev', element: <DevGallery /> },
      { path: '/logo', element: <LogotipoRotaproDriver /> },
      { path: '/design-system', element: <DesignSystemShowcase /> },
    ]
  : [];

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/', element: <A1LoginDoMotorista /> },
      { path: '/recuperar', element: <A2EsqueciMinhaSenhaOtp /> },
      {
        element: <ProtectedRoutes />,
        children: [
          { path: '/checklist', element: <A3ChecklistDoVeiculo /> },
          { path: '/rota', element: <B1RotaDoDiaHome /> },
          { path: '/rota/parada/:stopId', element: <B2DetalheDaParada /> },
          { path: '/rota/parada/:stopId/navegar', element: <B3NavegaOAtAParada /> },
          { path: '/rota/parada/:stopId/entrega', element: <B4ConfirmarEntrega /> },
          { path: '/rota/parada/:stopId/falha', element: <B5RegistrarFalha /> },
          { path: '/rota/fim', element: <B6FimDeRota /> },
          { path: '/rota/retorno', element: <B7ChecklistDeRetorno /> },
          { path: '/historico', element: <C1HistRicoDeRotas /> },
          { path: '/historico/:routeId', element: <C2DetalheDeRotaConcluDa /> },
          { path: '/recibos', element: <D1Recibos /> },
          { path: '/recibos/:receiptId', element: <D2DetalheDoReciboComAssinatura /> },
          { path: '/perfil', element: <E1PerfilDoMotorista /> },
          { path: '/suporte', element: <E2CentralDeSuporteEAjuda /> },
        ],
      },
      ...devOnlyRoutes,
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
