import { useEffect } from 'react';
import ScreenFrame from '../lib/ScreenFrame.jsx';
import PageRuntime from '../lib/PageRuntime.jsx';

export default function B2DetalheDaParada() {
  useEffect(() => { document.title = 'RotaPro Driver'; }, []);
  return (
    <ScreenFrame screenId="b.2_detalhe_da_parada"><PageRuntime screenId="b.2_detalhe_da_parada">
      <div>
  <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl pt-safe"><div className="h-16 px-margin flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="flex items-center gap-space-sm"><img alt="Logotipo RotaPro Driver" className="h-8 w-auto object-contain" src="/screens/logotipo_rotapro_driver.png" /><div className="flex flex-col"><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">RotaPro</span><span className="font-headline-sm text-headline-sm text-on-surface leading-tight">Rota</span></div></div><div className="flex items-center gap-space-sm"><button aria-label="Notificações" className="relative w-11 h-11 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"><span className="material-symbols-outlined text-[24px]">notifications</span><span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-container text-on-primary font-label-sm text-[10px] ring-2 ring-surface">3</span></button><div className="relative flex items-center justify-center"><img alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20" src="/screens/logotipo_rotapro_driver.png" /><span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary-container ring-1 ring-surface" /></div></div></div></header><main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface px-margin"><div className="flex flex-col w-full pb-32">
      {/* Top Navigation & Quick Actions Bar */}
      <div className="flex items-center justify-between py-space-sm mb-space-sm">
        <a aria-label="Voltar para rota do dia" className="w-11 h-11 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 transition-all" href="#">
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </a>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-space-xs">
            <span className="font-headline-sm text-headline-sm text-on-surface">Parada #05</span>
            <span className="font-body-sm text-body-sm text-secondary">de 18</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant mt-0.5">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
            <span className="font-label-sm text-label-sm">Em Atendimento</span>
          </div>
        </div>
        <button aria-label="Opções e suporte da parada" className="w-11 h-11 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 transition-all" id="btnOptions">
          <span className="material-symbols-outlined text-[24px]">more_vert</span>
        </button>
      </div>
      {/* Map Visualizer Compact Anchor */}
      <div className="relative w-full h-[168px] rounded-[20px] overflow-hidden shadow-sm bg-surface-container-high mb-space-md">
        <div className="w-full h-full bg-cover bg-center" data-location="Av. Paulista 1230, São Paulo, SP, Brasil" style={{backgroundImage: 'url("/screens/logotipo_rotapro_driver.png")'}} />
        {/* Map Elements & Traffic Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />
        {/* Live ETA Tag */}
        <div className="absolute top-3 left-3 bg-[#131313]/85 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-on-primary">
          <span className="material-symbols-outlined text-primary-container text-[18px]">traffic</span>
          <span className="font-label-sm text-label-sm">Trânsito Livre • 800m</span>
        </div>
        {/* Floating Pin Indicator Badge */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
          <div className="bg-primary-container text-on-primary font-headline-sm text-headline-sm px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">local_shipping</span>
            <span>05</span>
          </div>
          <div className="w-2 h-2 bg-primary rotate-45 -mt-1" />
        </div>
        {/* Waze / Maps Direct Operational Trigger */}
        <a className="absolute bottom-3 right-3 h-10 px-4 rounded-full bg-primary-container hover:bg-primary text-on-primary shadow-md flex items-center gap-1.5 font-label-md text-label-md active:scale-95 transition-transform" href="https://maps.google.com/?q=Av.+Paulista+1230+Bela+Vista+Sao+Paulo" rel="noopener" target="_blank">
          <span className="material-symbols-outlined text-[20px]">near_me</span>
          <span>Navegar no Waze / Maps</span>
        </a>
      </div>
      {/* Primary Recipient Card */}
      <div className="bg-surface-container-lowest rounded-[24px] p-space-md shadow-sm mb-space-md flex flex-col gap-3">
        <div className="flex items-start justify-between gap-space-sm">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-secondary text-label-sm font-label-sm mb-1">
              <span className="material-symbols-outlined text-[14px]">domain</span>
              <span>Ponto Comercial</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface truncate">Farmácia Santa Clara Ltda</h2>
            <p className="font-code-sm text-code-sm text-secondary tracking-wider mt-0.5">CNPJ: 14.829.102/0001-45</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-[28px]">storefront</span>
          </div>
        </div>
        {/* Address Box with Rapid Copy Action */}
        <div className="bg-surface-container-low rounded-xl p-3 flex items-center justify-between gap-space-sm">
          <div className="flex items-start gap-2 min-w-0">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px] shrink-0 mt-0.5">pin_drop</span>
            <div className="flex flex-col min-w-0">
              <p className="font-body-md text-body-md text-on-surface leading-tight">Av. Paulista, 1230 - Bela Vista</p>
              <p className="font-body-sm text-body-sm text-secondary truncate">São Paulo - SP, 01310-100</p>
            </div>
          </div>
          <button className="h-9 px-3 rounded-full bg-surface-container-lowest text-on-surface shadow-xs font-label-sm text-label-sm flex items-center gap-1 shrink-0 active:bg-surface-container-highest transition-colors" id="btnCopyAddress" title="Copiar endereço">
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            <span>Copiar</span>
          </button>
        </div>
        {/* Time Window Schedule Info */}
        <div className="flex items-center justify-between px-1 py-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Janela de Entrega:</span>
          </div>
          <span className="font-code-md text-code-md text-on-surface bg-surface-container-low px-2.5 py-1 rounded-full">14:00 - 14:30</span>
        </div>
        {/* Contact Person & Operational Triggers */}
        <div className="mt-1 pt-3 bg-surface-container-lowest rounded-2xl flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-label-md text-on-surface truncate">Roberto Silveira</span>
              <span className="font-body-sm text-body-sm text-secondary truncate">Gerente de Recebimento</span>
            </div>
          </div>
          {/* Thumb Zone Dual Callouts */}
          <div className="grid grid-cols-2 gap-space-sm pt-1">
            <a className="h-[52px] rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-transform" href="https://wa.me/5511987654321?text=Ola%20Roberto,%20sou%20o%20motorista%20da%20RotaPro%20chegando%20com%20sua%20entrega" rel="noopener" target="_blank">
              <span className="material-symbols-outlined text-[22px]">chat</span>
              <span>WhatsApp</span>
            </a>
            <a className="h-[52px] rounded-full bg-[#131313] text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-transform" href="tel:11987654321">
              <span className="material-symbols-outlined text-[22px]">call</span>
              <span>Ligar</span>
            </a>
          </div>
        </div>
      </div>
      {/* Delivery Manifest & Volumes Section */}
      <div className="flex flex-col gap-space-sm mb-space-md">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Volumes da Entrega</h3>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">3 itens</span>
          </div>
          <span className="font-code-md text-code-md text-primary bg-surface-container-low px-2.5 py-1 rounded-md">NF-e 89122-A</span>
        </div>
        {/* Volume Item 1 (Scanned) */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#BFEBBF]/40 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[20px]">inventory_2</span>
              </div>
              <div>
                <h4 className="font-label-md text-label-md text-on-surface">Caixa Padrão A - Medicamentos Refrigerados</h4>
                <p className="font-code-sm text-code-sm text-secondary">EAN: 789100023411 • 4.2 kg</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-container/15 text-primary font-label-sm text-label-sm shrink-0">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Bipado</span>
            </span>
          </div>
        </div>
        {/* Volume Item 2 (Scanned) */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#BFEBBF]/40 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[20px]">package_2</span>
              </div>
              <div>
                <h4 className="font-label-md text-label-md text-on-surface">Caixa Padrão B - Suplementos e Vitaminas</h4>
                <p className="font-code-sm text-code-sm text-secondary">EAN: 789100023412 • 6.8 kg</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-container/15 text-primary font-label-sm text-label-sm shrink-0">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Bipado</span>
            </span>
          </div>
        </div>
        {/* Volume Item 3 (Pending Scan) */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-secondary shrink-0">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </div>
              <div>
                <h4 className="font-label-md text-label-md text-on-surface">Envelope Lacrado - Documentos Fiscais</h4>
                <p className="font-code-sm text-code-sm text-secondary">EAN: 789100023413 • 0.3 kg</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-label-sm text-label-sm shrink-0">
              <span className="material-symbols-outlined text-[16px]">pending</span>
              <span>Pendente</span>
            </span>
          </div>
        </div>
        {/* Barcode Scanner Trigger Button */}
        <button className="h-[52px] rounded-full bg-surface-container-lowest text-primary font-label-lg text-label-lg shadow-sm flex items-center justify-center gap-2 active:bg-surface-container-low transition-colors mt-1" id="btnScannerTrigger">
          <span className="material-symbols-outlined text-[24px]">barcode_scanner</span>
          <span>Bipar Volumes (Scanner Câmera)</span>
        </button>
      </div>
      {/* Special Instructions & Route Delivery Notes */}
      <div className="bg-surface-container-low rounded-[20px] p-space-md shadow-xs mb-space-md flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-700 shrink-0">
          <span className="material-symbols-outlined text-[22px]">info</span>
        </div>
        <div className="flex flex-col">
          <span className="font-label-md text-label-md text-on-surface">Instruções de Acesso</span>
          <p className="font-body-md text-body-md text-secondary mt-0.5">
            Atenção: Acesso pela doca lateral na <strong className="text-on-surface font-label-md">Rua Peixoto Gomide</strong>. Exigir carimbo e assinatura física do responsável pelo recebimento.
          </p>
        </div>
      </div>
      {/* Ambient Micro-Feedback Toast (Hidden by default) */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#131313] text-on-primary px-4 py-2 rounded-full font-label-md text-label-md shadow-lg flex items-center gap-2 opacity-0 pointer-events-none transition-opacity duration-300" id="copyToast">
        <span className="material-symbols-outlined text-primary-container text-[18px]">done</span>
        <span>Endereço copiado!</span>
      </div>
      {/* Fixed Operational Sticky Thumb Zone */}
      <div className="fixed bottom-[72px] inset-x-0 z-40 bg-surface/90 backdrop-blur-md px-margin py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] flex flex-col gap-2 max-w-lg mx-auto">
        <div className="flex items-center gap-space-sm">
          {/* High Priority Primary Action Button */}
          <button className="flex-1 h-[54px] rounded-full bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all" id="btnConfirmDelivery">
            <span className="material-symbols-outlined text-[24px]">task_alt</span>
            <span>Confirmar Entrega</span>
          </button>
          {/* Danger Exception Action Trigger */}
          <button aria-label="Registrar ocorrência ou insucesso" className="h-[54px] px-5 rounded-full bg-error/10 text-error hover:bg-error-container active:scale-98 transition-all font-label-md text-label-md flex items-center justify-center gap-1.5 shrink-0" id="btnReportIssue">
            <span className="material-symbols-outlined text-[22px]">report_problem</span>
            <span className="hidden sm:inline">Ocorrência</span>
          </button>
        </div>
      </div>
    </div>
  </main><nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#131313] shadow-[0_-4px_16px_rgba(0,0,0,0.22)]" data-active-classes="text-primary-container font-label-md"><div className="flex justify-around items-center h-[72px] px-space-xs"><a aria-current="page" className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] transition-colors group text-primary-container font-label-md" data-path="rota" href="#"><span className="material-symbols-outlined text-[24px]">local_shipping</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Rota</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></a><a className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" data-path="historico" href="#"><span className="material-symbols-outlined text-[24px]">history</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Histórico</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></a><a className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" data-path="recibos" href="#"><span className="material-symbols-outlined text-[24px]">receipt_long</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Recibos</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></a><a className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" data-path="perfil" href="#"><span className="material-symbols-outlined text-[24px]">account_circle</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Perfil</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></a></div></nav>
</div>
    </PageRuntime></ScreenFrame>
  );
}
