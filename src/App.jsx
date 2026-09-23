import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext.jsx';
import A1LoginDoMotorista from './pages/A1LoginDoMotorista.jsx';
import A2EsqueciMinhaSenhaOtp from './pages/A2EsqueciMinhaSenhaOtp.jsx';
import A3ChecklistDoVeCulo from './pages/A3ChecklistDoVeCulo.jsx';
import B1RotaDoDiaHome from './pages/B1RotaDoDiaHome.jsx';
import B2DetalheDaParada from './pages/B2DetalheDaParada.jsx';
import B3NavegaOAtAParada from './pages/B3NavegaOAtAParada.jsx';
import B4ConfirmarEntrega from './pages/B4ConfirmarEntrega.jsx';
import B5RegistrarFalha from './pages/B5RegistrarFalha.jsx';
import B6FimDeRota from './pages/B6FimDeRota.jsx';
import B7ChecklistDeRetorno from './pages/B7ChecklistDeRetorno.jsx';
import C1HistRicoDeRotas from './pages/C1HistRicoDeRotas.jsx';
import C2DetalheDeRotaConcluDa from './pages/C2DetalheDeRotaConcluDa.jsx';
import D1Recibos from './pages/D1Recibos.jsx';
import D2DetalheDoReciboComAssinatura from './pages/D2DetalheDoReciboComAssinatura.jsx';
import E1PerfilDoMotorista from './pages/E1PerfilDoMotorista.jsx';
import E2CentralDeSuporteEAjuda from './pages/E2CentralDeSuporteEAjuda.jsx';
import LogotipoRotaproDriver from './pages/LogotipoRotaproDriver.jsx';

function ProtectedRoutes() {
  const { isAuthenticated } = useApp();
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
}

function DevGallery() {
  const screens = [
    ['/', 'A1 Login'], ['/recuperar', 'A2 Recuperação'], ['/checklist', 'A3 Checklist'], ['/rota', 'B1 Rota'],
    ['/rota/parada/stop-05', 'B2 Parada'], ['/rota/parada/stop-05/navegar', 'B3 Navegação'], ['/rota/parada/stop-05/entrega', 'B4 Entrega'], ['/rota/parada/stop-05/falha', 'B5 Falha'],
    ['/rota/fim', 'B6 Fim'], ['/rota/retorno', 'B7 Retorno'], ['/historico', 'C1 Histórico'], ['/historico/ROM-2024-88376', 'C2 Detalhe'], ['/recibos', 'D1 Recibos'], ['/recibos/receipt-88401', 'D2 Recibo'], ['/perfil', 'E1 Perfil'], ['/suporte', 'E2 Suporte'],
  ];
  return <div style={{ padding: 24, fontFamily: 'Plus Jakarta Sans, sans-serif' }}><h1>Galeria de debug</h1><p>O produto real começa em <a href="/">/</a>.</p><div style={{ display: 'grid', gap: 8 }}>{screens.map(([to, label]) => <a key={to} href={to}>{label} — {to}</a>)}</div></div>;
}

function AppRoutes() {
  return <Routes>
    <Route path="/" element={<A1LoginDoMotorista />} />
    <Route path="/recuperar" element={<A2EsqueciMinhaSenhaOtp />} />
    <Route element={<ProtectedRoutes />}>
      <Route path="/checklist" element={<A3ChecklistDoVeCulo />} />
      <Route path="/rota" element={<B1RotaDoDiaHome />} />
      <Route path="/rota/parada/:stopId" element={<B2DetalheDaParada />} />
      <Route path="/rota/parada/:stopId/navegar" element={<B3NavegaOAtAParada />} />
      <Route path="/rota/parada/:stopId/entrega" element={<B4ConfirmarEntrega />} />
      <Route path="/rota/parada/:stopId/falha" element={<B5RegistrarFalha />} />
      <Route path="/rota/fim" element={<B6FimDeRota />} />
      <Route path="/rota/retorno" element={<B7ChecklistDeRetorno />} />
      <Route path="/historico" element={<C1HistRicoDeRotas />} />
      <Route path="/historico/:routeId" element={<C2DetalheDeRotaConcluDa />} />
      <Route path="/recibos" element={<D1Recibos />} />
      <Route path="/recibos/:receiptId" element={<D2DetalheDoReciboComAssinatura />} />
      <Route path="/perfil" element={<E1PerfilDoMotorista />} />
      <Route path="/suporte" element={<E2CentralDeSuporteEAjuda />} />
    </Route>
    <Route path="/dev" element={<DevGallery />} />
    <Route path="/logo" element={<LogotipoRotaproDriver />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}

export default function App() {
  return <BrowserRouter><AppProvider><AppRoutes /></AppProvider></BrowserRouter>;
}
