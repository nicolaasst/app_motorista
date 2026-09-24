import { useEffect, useState } from 'react';
import ScreenFrame from '../lib/ScreenFrame.jsx';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { captureCurrentPosition, GeolocationCaptureError } from '../lib/device/geolocation.ts';
import { evaluateGeofence } from '../lib/domain/geofence.ts';

export default function B3NavegaOAtAParada() {
  const navigate = useNavigate();
  const { stopId = 'stop-05' } = useParams();
  const { route, confirmArrival, showToast } = useApp();
  const [confirmingArrival, setConfirmingArrival] = useState(false);
  useEffect(() => { document.title = 'RotaPro Driver'; }, []);

  const handleArrival = async () => {
    setConfirmingArrival(true);
    try {
      let location;
      try {
        const captured = await captureCurrentPosition();
        location = captured.point;
      } catch (error) {
        const reason = error instanceof GeolocationCaptureError ? error.reason : 'unavailable';
        showToast(reason === 'permission-denied' ? 'Permissão de localização negada. Chegada registrada sem geo.' : 'Não foi possível capturar sua localização. Chegada registrada sem geo.', 'warning');
      }
      if (location) {
        const expectedLocation = route.stops.find((stop) => stop.id === stopId)?.location;
        if (expectedLocation) {
          const geofence = evaluateGeofence(location, expectedLocation);
          if (!geofence.withinRange) {
            showToast(`Você está a ${Math.round(geofence.distanceMeters)}m do endereço esperado.`, 'warning');
          }
        }
      }
      await confirmArrival(stopId, location);
      navigate(`/rota/parada/${stopId}/entrega`);
    } finally {
      setConfirmingArrival(false);
    }
  };
  return (
    <ScreenFrame screenId="b.3_navega_o_at_a_parada">
      <div>
  <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl pt-safe"><div className="h-16 px-margin flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="flex items-center gap-space-sm"><img alt="Logotipo RotaPro Driver" className="h-8 w-auto object-contain" src="/screens/logotipo_rotapro_driver.png" /><div className="flex flex-col"><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">RotaPro</span><span className="font-headline-sm text-headline-sm text-on-surface leading-tight">Rota</span></div></div><div className="flex items-center gap-space-sm"><button aria-label="Notificações" className="relative w-11 h-11 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"><span className="material-symbols-outlined text-[24px]">notifications</span><span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-container text-on-primary font-label-sm text-[10px] ring-2 ring-surface">3</span></button><div className="relative flex items-center justify-center"><img alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20" src="/screens/logotipo_rotapro_driver.png" /><span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary-container ring-1 ring-surface" /></div></div></div></header><main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface px-margin"><div className="flex flex-col w-full relative select-none">
      {/* Interactive GPS Canvas Container */}
      <div className="relative w-full h-[calc(100vh-8.5rem)] overflow-hidden rounded-lg shadow-xl bg-surface-container-low">
        {/* Interactive Tactical Map Canvas */}
        <div className="absolute inset-0 w-full h-full bg-cover bg-center" data-location="Avenida Paulista 1230, Bela Vista, Sao Paulo" style={{backgroundImage: 'url("/screens/logotipo_rotapro_driver.png")'}}>
          {/* Vector Navigation Overlay Elements (Tactical GPS Look) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" fill="none" viewBox="0 0 390 700" xmlns="http://www.w3.org/2000/svg">
            {/* Route Shadow / Ambient Glow */}
            <path d="M 195 520 L 195 380 Q 195 330 240 330 L 310 330 Q 345 330 345 270 L 345 130" opacity="0.25" stroke="#00B000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="14" />
            {/* Main Route Path (Vivid Green Logistics Grade) */}
            <path d="M 195 520 L 195 380 Q 195 330 240 330 L 310 330 Q 345 330 345 270 L 345 130" id="active-route-path" stroke="#00B000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="8" />
            {/* Live Traffic Indicator Line (Green High-Flow) */}
            <path d="M 195 515 L 195 390" opacity="0.9" stroke="#77ff61" strokeLinecap="round" strokeWidth="3" />
            <path d="M 235 330 L 305 330" opacity="0.9" stroke="#77ff61" strokeLinecap="round" strokeWidth="3" />
            {/* Target Destination Stop 05 */}
            <g transform="translate(345, 125)">
              <circle cx="0" cy="0" fill="#131313" r="22" />
              <circle cx="0" cy="0" fill="#00B000" r="18" />
              <text fill="#FFFFFF" fontFamily="Plus Jakarta Sans" fontSize="13" fontWeight="800" textAnchor="middle" x="0" y="5">05</text>
              {/* Destination Pulse Ring */}
              <circle className="animate-ping" cx="0" cy="0" opacity="0.5" r="26" stroke="#00B000" strokeWidth="2" style={{animationDuration: '2.5s'}} />
            </g>
            {/* Driver Van Tactical Position */}
            <g transform="translate(195, 470)">
              {/* Dynamic Directional Beam */}
              <path d="M -24 -48 L 0 0 L 24 -48 Z" fill="url(#directional-glow)" opacity="0.5" />
              {/* Pulse Halo */}
              <circle className="animate-pulse" cx="0" cy="0" fill="#00B000" opacity="0.2" r="28" />
              {/* Chassis Base */}
              <circle cx="0" cy="0" fill="#131313" r="18" stroke="#FFFFFF" strokeWidth="3" />
              {/* Delivery Van Glyph */}
              <path d="M -6 -7 L 6 -7 L 8 -1 L 8 6 L -8 6 L -8 -1 Z" fill="#77ff61" />
              <circle cx={-4} cy="6" fill="#FFFFFF" r="2" />
              <circle cx="4" cy="6" fill="#FFFFFF" r="2" />
              <rect fill="#131313" height="4" rx="1" width="10" x={-5} y={-5} />
            </g>
            <defs>
              <linearGradient gradientUnits="userSpaceOnUse" id="directional-glow" x1="0" x2="0" y1="0" y2={-48}>
                <stop offset="0%" stopColor="#00B000" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#77ff61" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        {/* Live Traffic & Network Status Pip */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#131313]/90 backdrop-blur-md shadow-md">
          <span className="w-2 h-2 rounded-full bg-primary-fixed animate-ping" />
          <span className="w-2 h-2 rounded-full bg-[#88EF1B] -ml-3" />
          <span className="font-label-sm text-label-sm text-surface-bright tracking-wider uppercase">Tráfego Livre</span>
        </div>
        {/* 1. Turn-by-Turn GPS Command Topbar (Tactical Onyx Card) */}
        <div className="absolute top-12 inset-x-3 z-30 flex flex-col bg-[#131313] text-surface-bright rounded-[20px] shadow-2xl p-4 overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            {/* Turn Direction Symbol Box */}
            <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-primary-container text-on-primary flex-shrink-0 shadow-[0_4px_16px_rgba(0,176,0,0.4)]">
              <span className="material-symbols-outlined text-[36px] leading-none">turn_right</span>
              <span className="font-code-sm text-code-sm leading-none mt-0.5 text-on-primary-container">250m</span>
            </div>
            {/* Maneuver Navigation Directives */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-baseline gap-2">
                <span className="font-headline-md text-headline-md text-surface-bright truncate tracking-tight">Rua Augusta</span>
              </div>
              <p className="font-body-sm text-body-sm text-secondary-fixed-dim truncate mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#88EF1B]">straight</span>
                Depois siga em frente por 800 metros
              </p>
            </div>
            {/* Audio Alerts Toggle */}
            <button aria-label="Alternar alertas de voz" className="w-10 h-10 rounded-full bg-inverse-surface flex items-center justify-center text-surface-bright active:scale-95 transition-transform flex-shrink-0" id="audio-toggle-btn">
              <span className="material-symbols-outlined text-[20px]" id="audio-icon">volume_up</span>
            </button>
          </div>
          {/* Speed & Compliance Monitor Band */}
          <div className="flex items-center justify-between mt-3 pt-3 bg-[#1B1C1C] rounded-xl px-3 py-2">
            <div className="flex items-center gap-3">
              {/* Speed Limit Signboard */}
              <div className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-inner">
                <span className="font-code-sm text-code-sm text-error font-bold tracking-tighter">50</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-secondary-fixed-dim leading-none">Velocidade Atual</span>
                <span className="font-code-md text-code-md text-primary-fixed leading-tight mt-0.5">42 <span className="text-[10px] text-secondary-fixed-dim">KM/H</span></span>
              </div>
            </div>
            {/* Telemetry Pill */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container/10">
              <span className="material-symbols-outlined text-[16px] text-[#88EF1B]">satellite_alt</span>
              <span className="font-code-sm text-code-sm text-surface-bright">GPS OK</span>
            </div>
          </div>
        </div>
        {/* 2. Floating Quick Action Controls (Right Rail Ergonomics) */}
        <div className="absolute right-3 top-56 z-30 flex flex-col gap-2.5">
          {/* Recenter Viewport */}
          <button className="w-12 h-12 rounded-full bg-surface-container-lowest text-on-surface shadow-lg flex items-center justify-center active:bg-surface-container transition-transform active:scale-95" id="recenter-btn" title="Recentralizar Rota">
            <span className="material-symbols-outlined text-[24px] text-primary">my_location</span>
          </button>
          {/* 2D / 3D Perspective Toggle */}
          <button className="w-12 h-12 rounded-full bg-surface-container-lowest text-on-surface shadow-lg flex items-center justify-center active:bg-surface-container transition-transform active:scale-95" id="view-mode-btn" title="Alternar visão 2D/3D">
            <span className="font-code-sm text-code-sm text-on-surface font-bold">3D</span>
          </button>
          {/* External Navigation Handoff (Waze / Google Maps) */}
          <button className="w-12 h-12 rounded-full bg-[#131313] text-surface-bright shadow-lg flex items-center justify-center active:scale-95 transition-transform" id="external-maps-btn" title="Abrir em Navegador Externo">
            <span className="material-symbols-outlined text-[22px] text-[#88EF1B]">navigation</span>
          </button>
          {/* Road Hazard Report Hazard Trigger */}
          <button className="w-12 h-12 rounded-full bg-surface-container-lowest text-error shadow-lg flex items-center justify-center active:bg-error-container transition-transform active:scale-95" id="hazard-btn" title="Reportar Obstáculo na Via">
            <span className="material-symbols-outlined text-[24px]">report_problem</span>
          </button>
        </div>
        {/* 3. Bottom Operational Sliding Sheet (Pure White Card) */}
        <div className="absolute inset-x-0 bottom-0 z-40 bg-surface-container-lowest rounded-t-[24px] shadow-[0_-8px_30px_rgba(19,19,19,0.18)] p-4 flex flex-col">
          {/* Drag affordance pill */}
          <div className="w-12 h-1.5 rounded-full bg-surface-container-highest mx-auto mb-3" />
          {/* Stop Sequence & Recipient Destination */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#131313] text-[#88EF1B] font-code-sm text-code-sm">PARADA #05</span>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">Comercial</span>
              </div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface truncate mt-1">Farmácia Santa Clara Ltda</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Av. Paulista, 1230 • Bela Vista, São Paulo</p>
            </div>
            {/* Phone Recipient Quick Dial */}
            <a aria-label="Ligar para o cliente recebedor" className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center text-on-surface active:bg-surface-container-high transition-colors flex-shrink-0" href="tel:11987654321">
              <span className="material-symbols-outlined text-[20px] text-primary">call</span>
            </a>
          </div>
          {/* Mission Telemetry Metric Grid */}
          <div className="grid grid-cols-3 gap-2 my-3 p-2.5 rounded-2xl bg-surface-container-low">
            {/* ETA */}
            <div className="flex flex-col items-center justify-center py-1">
              <span className="font-label-sm text-label-sm text-secondary tracking-tight">Chegada</span>
              <span className="font-code-lg text-code-lg text-primary-container mt-0.5">14:18</span>
            </div>
            {/* Time Left */}
            <div className="flex flex-col items-center justify-center py-1">
              <span className="font-label-sm text-label-sm text-secondary tracking-tight">Tempo</span>
              <span className="font-code-lg text-code-lg text-on-surface mt-0.5">8 <span className="font-body-sm text-body-sm text-secondary">min</span></span>
            </div>
            {/* Distance Left */}
            <div className="flex flex-col items-center justify-center py-1">
              <span className="font-label-sm text-label-sm text-secondary tracking-tight">Distância</span>
              <span className="font-code-lg text-code-lg text-on-surface mt-0.5">2.4 <span className="font-body-sm text-body-sm text-secondary">km</span></span>
            </div>
          </div>
          {/* Heavy-Duty Operational Primary CTA Button (Glove-Friendly Touch Area) */}
          <button className="w-full h-[60px] rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,176,0,0.38)] active:bg-primary transition-all active:scale-[0.98] disabled:opacity-60" disabled={confirmingArrival} id="arrival-btn" onClick={handleArrival} type="button">
            <span className="material-symbols-outlined text-[26px]">pin_drop</span>
            <span>{confirmingArrival ? 'Confirmando chegada...' : 'Cheguei no Local da Entrega'}</span>
          </button>
          {/* Waybill & Package Details Expand Trigger */}
          <button className="mt-2.5 py-1 flex items-center justify-center gap-1 text-on-surface-variant active:text-primary transition-colors" id="toggle-details-btn">
            <span className="font-body-sm text-body-sm">Ver detalhes dos <strong className="font-bold text-on-surface">3 volumes</strong> da <span className="font-code-sm text-code-sm">NF-89122</span></span>
            <span className="material-symbols-outlined text-[16px] transition-transform" id="details-arrow">expand_more</span>
          </button>
          {/* Expandable Freight Details Drawer (Hidden by Default) */}
          <div className="hidden flex-col gap-2 mt-2 pt-2 bg-surface-container-lowest" id="freight-details-panel">
            <div className="flex items-center justify-between p-2 rounded-xl bg-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-secondary">inventory_2</span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface">Caixa Térmica Medicamentos #1</span>
                  <span className="font-code-sm text-code-sm text-secondary">VOL-89122-A • 4.2 kg</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#BFEBBF]/60 text-primary font-label-sm text-label-sm">Sensível</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-secondary">inventory_2</span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface">Fardo Materiais Hospitalares #2</span>
                  <span className="font-code-sm text-code-sm text-secondary">VOL-89122-B • 8.1 kg</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">Seco</span>
            </div>
          </div>
        </div>
      </div>
      {/* Toast Notification Template for Driver Confirmation */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#131313] text-surface-bright font-label-sm text-label-sm shadow-xl flex items-center gap-2 transition-all duration-300 opacity-0 pointer-events-none transform -translate-y-2" id="status-toast">
        <span className="material-symbols-outlined text-[18px] text-[#88EF1B]" id="toast-icon">check_circle</span>
        <span id="toast-msg">Mensagem rápida</span>
      </div>
    </div>
  </main><nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#131313] shadow-[0_-4px_16px_rgba(0,0,0,0.22)]" data-active-classes="text-primary-container font-label-md"><div className="flex justify-around items-center h-[72px] px-space-xs"><Link aria-current="page" className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] transition-colors group text-primary-container font-label-md" to="/rota"><span className="material-symbols-outlined text-[24px]">local_shipping</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Rota</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></Link><Link className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" to="/historico"><span className="material-symbols-outlined text-[24px]">history</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Histórico</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></Link><Link className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" to="/recibos"><span className="material-symbols-outlined text-[24px]">receipt_long</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Recibos</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></Link><Link className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" to="/perfil"><span className="material-symbols-outlined text-[24px]">account_circle</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Perfil</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></Link></div></nav>
</div>
    </ScreenFrame>
  );
}
