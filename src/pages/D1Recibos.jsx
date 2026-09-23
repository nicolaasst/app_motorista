import { useEffect } from 'react';
import ScreenFrame from '../lib/ScreenFrame.jsx';
import PageRuntime from '../lib/PageRuntime.jsx';

export default function D1Recibos() {
  useEffect(() => { document.title = 'RotaPro Driver'; }, []);
  return (
    <ScreenFrame screenId="d.1_recibos"><PageRuntime screenId="d.1_recibos">
      <div>
  <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl pt-safe"><div className="h-16 px-margin flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="flex items-center gap-space-sm"><img alt="Logotipo RotaPro Driver" className="h-8 w-auto object-contain" src="/screens/logotipo_rotapro_driver.png" /><div className="flex flex-col"><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">RotaPro</span><span className="font-headline-sm text-headline-sm text-on-surface leading-tight">Rota</span></div></div><div className="flex items-center gap-space-sm"><button aria-label="Notificações" className="relative w-11 h-11 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"><span className="material-symbols-outlined text-[24px]">notifications</span><span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-container text-on-primary font-label-sm text-[10px] ring-2 ring-surface">3</span></button><div className="relative flex items-center justify-center"><img alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20" src="/screens/logotipo_rotapro_driver.png" /><span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary-container ring-1 ring-surface" /></div></div></div></header><main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface px-margin"><div className="flex flex-col w-full space-y-space-md">
      <div className="flex items-center justify-between px-space-xs py-1">
        <div className="flex items-center gap-space-xs bg-surface-container-high/80 px-3 py-1.5 rounded-full shadow-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-primary-container animate-pulse" />
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Sincronizado • Fechamento Quinzenal
          </span>
        </div>
        <div className="flex items-center gap-1 text-on-surface-variant font-code-sm text-code-sm">
          <span className="material-symbols-outlined text-[15px] text-primary">verified</span>
          <span>Base ERP Ativa</span>
        </div>
      </div>
      <section className="bg-surface-container-lowest rounded-lg p-space-md shadow-[0_2px_12px_rgba(19,19,19,0.06)] relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-primary-container/10 pointer-events-none blur-xl" />
        <div className="flex items-center justify-between mb-space-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary p-1 rounded-full bg-primary/10">payments</span>
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wide">A Liberar / Previsto</span>
          </div>
          <span className="bg-primary/10 text-primary font-code-sm text-code-sm px-2.5 py-0.5 rounded-full">
            Outubro Q2
          </span>
        </div>
        <div className="mb-space-md">
          <div className="flex items-baseline gap-1.5">
            <span className="font-code-md text-code-md text-on-surface-variant font-bold">R$</span>
            <span className="font-display-lg text-display-lg text-on-surface tracking-tight">3.840<span className="text-headline-md font-normal text-on-surface-variant">,00</span></span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-tertiary-container">event</span>
            <span className="font-body-sm text-body-sm">Data de depósito prevista: <strong className="text-on-surface font-semibold">05 de Novembro de 2024</strong></span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-space-sm pt-space-sm border-t border-surface-container">
          <div className="bg-surface-container-low rounded-DEFAULT p-space-sm flex flex-col justify-between">
            <div className="flex items-center gap-1 text-on-surface-variant mb-1">
              <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
              <span className="font-label-sm text-label-sm uppercase">Último Pago</span>
            </div>
            <span className="font-code-md text-code-md text-on-surface">R$ 4.120,00</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">20/Out via PIX</span>
          </div>
          <div className="bg-amber-500/10 rounded-DEFAULT p-space-sm flex flex-col justify-between">
            <div className="flex items-center gap-1 text-amber-800 mb-1">
              <span className="material-symbols-outlined text-[16px] text-amber-600">pending_actions</span>
              <span className="font-label-sm text-label-sm uppercase">Pendentes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-headline-sm text-headline-sm text-amber-900">1 Recibo</span>
            </div>
            <span className="font-body-sm text-body-sm text-amber-800 mt-0.5">Requer assinatura</span>
          </div>
        </div>
      </section>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-margin px-margin no-scrollbar">
        <button className="flex-shrink-0 px-4 py-2 rounded-full bg-inverse-surface text-inverse-on-surface font-label-md text-label-md shadow-sm transition-transform active:scale-95">
          Todos
        </button>
        <button className="flex-shrink-0 px-4 py-2 rounded-full bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm flex items-center gap-1.5 transition-transform active:scale-95">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Aguardando Assinatura</span>
          <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">1</span>
        </button>
        <button className="flex-shrink-0 px-4 py-2 rounded-full bg-surface-container-lowest text-on-surface-variant font-label-md text-label-md shadow-sm transition-transform active:scale-95">
          Assinados (4)
        </button>
        <button className="flex-shrink-0 px-4 py-2 rounded-full bg-surface-container-lowest text-on-surface-variant font-label-md text-label-md shadow-sm flex items-center gap-1 transition-transform active:scale-95">
          <span>Ano 2024</span>
          <span className="material-symbols-outlined text-[16px]">expand_more</span>
        </button>
      </div>
      <section className="space-y-space-md">
        <article className="bg-surface-container-lowest rounded-lg p-space-md shadow-[0_4px_16px_rgba(19,19,19,0.08)] relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" />
          <div className="flex items-start justify-between gap-2 mb-space-sm pl-1">
            <div>
              <span className="font-body-sm text-body-sm text-on-surface-variant uppercase tracking-wider block">2ª Quinzena • 16/10 a 31/10</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Outubro 2024</h3>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-label-sm text-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Aguardando Assinatura
            </span>
          </div>
          <div className="pl-1 mb-space-md">
            <div className="flex items-center justify-between bg-surface-container-low/70 rounded-DEFAULT px-3 py-2">
              <span className="font-code-sm text-code-sm text-on-surface-variant font-bold">REC-2024-10-Q2</span>
              <span className="font-code-lg text-code-lg text-on-surface">R$ 3.840,00</span>
            </div>
          </div>
          <div className="pl-1 mb-space-md space-y-1.5 text-on-surface-variant font-body-sm text-body-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
                14 diárias operacionais
              </span>
              <span className="font-code-sm text-code-sm text-on-surface">R$ 3.360,00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">local_shipping</span>
                248 entregas com sucesso (99.2%)
              </span>
              <span className="font-code-sm text-code-sm text-on-surface">R$ 300,00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-primary font-medium">
                <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
                Bônus Meta SLA Pontualidade
              </span>
              <span className="font-code-sm text-code-sm text-primary font-bold">+ R$ 180,00</span>
            </div>
          </div>
          <button className="w-full h-14 rounded-full bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(0,176,0,0.28)] transition-all active:scale-[0.98]" type="button">
            <span className="material-symbols-outlined text-[22px]">draw</span>
            <span>Revisar e Assinar Recibo</span>
          </button>
        </article>
        <article className="bg-surface-container-lowest rounded-lg p-space-md shadow-[0_2px_8px_rgba(19,19,19,0.05)] relative">
          <div className="flex items-start justify-between gap-2 mb-space-sm">
            <div>
              <span className="font-body-sm text-body-sm text-on-surface-variant uppercase tracking-wider block">1ª Quinzena • 01/10 a 15/10</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Outubro 2024</h3>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
              Assinado &amp; Pago
            </span>
          </div>
          <div className="flex items-center justify-between bg-surface-container-low/50 rounded-DEFAULT px-3 py-2 mb-space-sm">
            <span className="font-code-sm text-code-sm text-on-surface-variant font-bold">REC-2024-10-Q1</span>
            <span className="font-code-lg text-code-lg text-on-surface font-bold">R$ 4.120,00</span>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm mb-space-md">
            <span>15 diárias • 290 entregas</span>
            <span className="font-code-sm text-code-sm text-on-surface-variant">Pago 20/10 • PIX</span>
          </div>
          <button className="w-full h-12 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center justify-center gap-2 transition-colors active:scale-[0.99]" type="button">
            <span className="material-symbols-outlined text-[18px]">receipt</span>
            <span>Visualizar Comprovante &amp; Detalhes</span>
          </button>
        </article>
        <article className="bg-surface-container-lowest rounded-lg p-space-md shadow-[0_2px_8px_rgba(19,19,19,0.05)] relative">
          <div className="flex items-start justify-between gap-2 mb-space-sm">
            <div>
              <span className="font-body-sm text-body-sm text-on-surface-variant uppercase tracking-wider block">2ª Quinzena • 16/09 a 30/09</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Setembro 2024</h3>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
              Assinado &amp; Pago
            </span>
          </div>
          <div className="flex items-center justify-between bg-surface-container-low/50 rounded-DEFAULT px-3 py-2 mb-space-sm">
            <span className="font-code-sm text-code-sm text-on-surface-variant font-bold">REC-2024-09-Q2</span>
            <span className="font-code-lg text-code-lg text-on-surface font-bold">R$ 3.960,00</span>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm mb-space-md">
            <span>14 diárias operacionais</span>
            <span className="font-code-sm text-code-sm text-on-surface-variant">Pago 05/10 • PIX</span>
          </div>
          <button className="w-full h-12 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center justify-center gap-2 transition-colors active:scale-[0.99]" type="button">
            <span className="material-symbols-outlined text-[18px]">receipt</span>
            <span>Visualizar Comprovante &amp; Detalhes</span>
          </button>
        </article>
        <article className="bg-surface-container-lowest rounded-lg p-space-md shadow-[0_2px_8px_rgba(19,19,19,0.05)] relative">
          <div className="flex items-start justify-between gap-2 mb-space-sm">
            <div>
              <span className="font-body-sm text-body-sm text-on-surface-variant uppercase tracking-wider block">1ª Quinzena • 01/09 a 15/09</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Setembro 2024</h3>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
              Assinado &amp; Pago
            </span>
          </div>
          <div className="flex items-center justify-between bg-surface-container-low/50 rounded-DEFAULT px-3 py-2 mb-space-sm">
            <span className="font-code-sm text-code-sm text-on-surface-variant font-bold">REC-2024-09-Q1</span>
            <span className="font-code-lg text-code-lg text-on-surface font-bold">R$ 4.250,00</span>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm mb-space-md">
            <span>15 diárias • Bônus volume atingido</span>
            <span className="font-code-sm text-code-sm text-on-surface-variant">Pago 20/09 • PIX</span>
          </div>
          <button className="w-full h-12 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center justify-center gap-2 transition-colors active:scale-[0.99]" type="button">
            <span className="material-symbols-outlined text-[18px]">receipt</span>
            <span>Visualizar Comprovante &amp; Detalhes</span>
          </button>
        </article>
      </section>
      <section className="bg-surface-container-high/60 rounded-lg p-space-md mb-2 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">help</span>
          </div>
          <div>
            <h4 className="font-headline-sm text-headline-sm text-on-surface">Suporte Financeiro</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Dúvidas sobre cálculo de diárias, descontos de combustível ou fechamento de metas?
            </p>
          </div>
        </div>
        <button className="w-full h-12 rounded-full bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]" type="button">
          <span className="material-symbols-outlined text-[18px] text-primary">chat</span>
          <span>Falar com o Financeiro RotaPro</span>
        </button>
      </section>
    </div>
  </main><nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#131313] shadow-[0_-4px_16px_rgba(0,0,0,0.22)]" data-active-classes="text-primary-container font-label-md"><div className="flex justify-around items-center h-[72px] px-space-xs"><a aria-current="page" className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] transition-colors group text-primary-container font-label-md" data-path="rota" href="#"><span className="material-symbols-outlined text-[24px]">local_shipping</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Rota</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></a><a className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" data-path="historico" href="#"><span className="material-symbols-outlined text-[24px]">history</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Histórico</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></a><a className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" data-path="recibos" href="#"><span className="material-symbols-outlined text-[24px]">receipt_long</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Recibos</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></a><a className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" data-path="perfil" href="#"><span className="material-symbols-outlined text-[24px]">account_circle</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Perfil</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></a></div></nav>
</div>
    </PageRuntime></ScreenFrame>
  );
}
