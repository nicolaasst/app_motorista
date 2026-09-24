import { useEffect } from 'react';
import ScreenFrame from '../lib/ScreenFrame.jsx';
import { useNavigate, Link } from 'react-router-dom';

export default function C1HistRicoDeRotas() {
  const navigate = useNavigate();
  useEffect(() => { document.title = 'RotaPro Driver'; }, []);
  return (
    <ScreenFrame screenId="c.1_hist_rico_de_rotas">
      <div>
  <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl pt-safe"><div className="h-16 px-margin flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="flex items-center gap-space-sm"><img alt="Logotipo RotaPro Driver" className="h-8 w-auto object-contain" src="/screens/logotipo_rotapro_driver.png" /><div className="flex flex-col"><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">RotaPro</span><span className="font-headline-sm text-headline-sm text-on-surface leading-tight">Rota</span></div></div><div className="flex items-center gap-space-sm"><button aria-label="Notificações" className="relative w-11 h-11 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"><span className="material-symbols-outlined text-[24px]">notifications</span><span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-container text-on-primary font-label-sm text-[10px] ring-2 ring-surface">3</span></button><div className="relative flex items-center justify-center"><img alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20" src="/screens/logotipo_rotapro_driver.png" /><span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary-container ring-1 ring-surface" /></div></div></div></header><main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface px-margin"><div className="flex flex-col w-full space-y-space-md">
      {/* Sub-header context & Sync Status */}
      <div className="flex items-center justify-between pt-space-xs px-space-xs">
        <div className="flex flex-col">
          <span className="font-headline-md text-headline-md text-on-surface">Histórico de Rotas</span>
          <span className="font-body-sm text-body-sm text-secondary">Registro operacional de turnos e viagens</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant">
          <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
          <span className="font-code-sm text-code-sm text-on-surface">Sincronizado</span>
        </div>
      </div>
      {/* Operational Overview Metric Bento Card */}
      <div className="relative overflow-hidden bg-surface-container-lowest rounded-lg p-space-md shadow-sm">
        <div className="absolute -right-8 -top-8 w-28 h-28 bg-primary-container/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between pb-space-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{fontVariationSettings: '"FILL" 1'}}>insights</span>
            <span className="font-label-md text-label-md text-on-surface">Desempenho Outubro 2024</span>
          </div>
          <span className="font-code-sm text-code-sm px-2.5 py-0.5 rounded-full bg-surface-container text-secondary">24 Rotas</span>
        </div>
        {/* 3 Metrics Columns with subtle tone dividers */}
        <div className="grid grid-cols-3 gap-2 pt-space-xs">
          <div className="flex flex-col p-2.5 rounded-DEFAULT bg-surface-container-low">
            <span className="font-body-sm text-body-sm text-secondary">Entregas</span>
            <span className="font-code-md text-code-md text-on-surface mt-0.5">412 <span className="font-body-sm text-[10px] text-primary">paradas</span></span>
            <div className="flex items-center gap-1 mt-1 text-primary">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              <span className="font-label-sm text-label-sm">98.2%</span>
            </div>
          </div>
          <div className="flex flex-col p-2.5 rounded-DEFAULT bg-surface-container-low">
            <span className="font-body-sm text-body-sm text-secondary">Distância</span>
            <span className="font-code-md text-code-md text-on-surface mt-0.5">1.140 <span className="font-body-sm text-[10px] text-secondary">km</span></span>
            <span className="font-label-sm text-label-sm text-secondary mt-1">Média 47.5/d</span>
          </div>
          <div className="flex flex-col p-2.5 rounded-DEFAULT bg-surface-container-low">
            <span className="font-body-sm text-body-sm text-secondary">Tempo</span>
            <span className="font-code-md text-code-md text-on-surface mt-0.5">162 <span className="font-body-sm text-[10px] text-secondary">horas</span></span>
            <span className="font-label-sm text-label-sm text-primary mt-1">99% no prazo</span>
          </div>
        </div>
      </div>
      {/* Search and Tactical Filter Bar */}
      <div className="flex flex-col space-y-space-sm">
        <div className="relative flex items-center w-full">
          <span className="material-symbols-outlined absolute left-4 text-secondary text-[22px] pointer-events-none">search</span>
          <input className="w-full h-12 pl-12 pr-11 bg-surface-container-lowest rounded-full font-body-md text-body-md text-on-surface placeholder:text-secondary shadow-sm focus:outline-none focus:bg-surface-container-lowest" id="route-search" placeholder="Buscar romaneio, data ou bairro..." type="text" />
          <button aria-label="Limpar busca" className="absolute right-3 w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-on-surface hover:bg-surface-container transition-colors hidden" id="clear-search-btn">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        {/* Scrollable Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-0.5">
          <button className="filter-chip active flex items-center gap-1.5 h-9 px-4 rounded-full bg-inverse-surface text-inverse-on-surface font-label-md text-label-md shrink-0 shadow-sm transition-all" data-filter="all">
            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            <span>Outubro (24)</span>
          </button>
          <button className="filter-chip flex items-center gap-1.5 h-9 px-4 rounded-full bg-surface-container-lowest text-secondary hover:text-on-surface font-label-md text-label-md shrink-0 shadow-sm transition-all" data-filter="recent">
            <span>Últimos 7 dias</span>
          </button>
          <button className="filter-chip flex items-center gap-1.5 h-9 px-4 rounded-full bg-surface-container-lowest text-secondary hover:text-on-surface font-label-md text-label-md shrink-0 shadow-sm transition-all" data-filter="issue">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Ocorrências</span>
          </button>
          <button aria-label="Filtro de calendário personalizado" className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-container-lowest text-secondary hover:text-on-surface shrink-0 shadow-sm" id="open-date-picker">
            <span className="material-symbols-outlined text-[18px]">tune</span>
          </button>
        </div>
      </div>
      {/* Completed Routes Card Stream */}
      <div className="flex flex-col space-y-space-md" id="routes-container">
        {/* Card 1: Ontem / Paulista 03 */}
        <div className="route-item bg-surface-container-lowest rounded-lg p-space-md shadow-sm transition-transform active:scale-[0.99] cursor-pointer" data-code="ROM-2024-88412" data-neighborhood="Paulista" onClick={() => navigate('/historico/ROM-2024-88412')}>
          {/* Card Top Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col">
              <span className="font-body-sm text-body-sm text-secondary">Ontem, 24 de Outubro</span>
              <span className="font-headline-sm text-headline-sm text-on-surface mt-0.5">Turno Tarde</span>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
              Concluída
            </span>
          </div>
          {/* Sector & Plate Tagline */}
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            <span className="font-code-sm text-code-sm px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface tracking-wide">
              ROM-2024-88412
            </span>
            <span className="font-body-sm text-body-sm text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">local_shipping</span>
              BRA-2E19 (Sprinter)
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface mt-2">
            Setor Paulista 03 • Bela Cintra, Jardins
          </p>
          {/* Operational Metrics Grid Inside Card */}
          <div className="mt-3.5 p-3 rounded-DEFAULT bg-surface-container-low flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-body-sm text-[11px] text-secondary">Paradas</span>
              <span className="font-code-md text-code-md text-on-surface">18 <span className="font-body-sm text-[11px] text-secondary">(17 ok, 1 dev.)</span></span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-body-sm text-[11px] text-secondary">Percurso</span>
              <span className="font-code-md text-code-md text-on-surface">48.2 km</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-body-sm text-[11px] text-secondary">Duração</span>
              <span className="font-code-md text-code-md text-on-surface">06h 45m</span>
            </div>
          </div>
          {/* Footer & Action Cue */}
          <div className="mt-3.5 pt-2.5 flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              Sucesso 94.4%
            </span>
            <span className="font-label-md text-label-md text-primary flex items-center gap-0.5 hover:translate-x-0.5 transition-transform">
              Ver Detalhes da Rota
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </span>
          </div>
        </div>
        {/* Card 2: 23 Out / Pinheiros */}
        <div className="route-item bg-surface-container-lowest rounded-lg p-space-md shadow-sm transition-transform active:scale-[0.99] cursor-pointer" data-code="ROM-2024-88390" data-neighborhood="Pinheiros" onClick={() => navigate('/historico/ROM-2024-88390')}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col">
              <span className="font-body-sm text-body-sm text-secondary">23 de Outubro</span>
              <span className="font-headline-sm text-headline-sm text-on-surface mt-0.5">Turno Manhã</span>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
              100% Sucesso
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            <span className="font-code-sm text-code-sm px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface tracking-wide">
              ROM-2024-88390
            </span>
            <span className="font-body-sm text-body-sm text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">local_shipping</span>
              BRA-2E19
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface mt-2">
            Pinheiros &amp; Vila Madalena
          </p>
          <div className="mt-3.5 p-3 rounded-DEFAULT bg-surface-container-low flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-body-sm text-[11px] text-secondary">Paradas</span>
              <span className="font-code-md text-code-md text-on-surface">22 <span className="font-body-sm text-[11px] text-primary">(22 ok)</span></span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-body-sm text-[11px] text-secondary">Percurso</span>
              <span className="font-code-md text-code-md text-on-surface">54.0 km</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-body-sm text-[11px] text-secondary">Duração</span>
              <span className="font-code-md text-code-md text-on-surface">07h 10m</span>
            </div>
          </div>
          <div className="mt-3.5 pt-2.5 flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">done_all</span>
              Entrega Perfeita
            </span>
            <span className="font-label-md text-label-md text-primary flex items-center gap-0.5">
              Ver Detalhes
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </span>
          </div>
        </div>
        {/* Card 3: 22 Out / Bela Vista & Centro (Has Occurrence) */}
        <div className="route-item bg-surface-container-lowest rounded-lg p-space-md shadow-sm transition-transform active:scale-[0.99] cursor-pointer" data-code="ROM-2024-88345" data-has-issue="true" data-neighborhood="Centro" onClick={() => navigate('/historico/ROM-2024-88345')}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col">
              <span className="font-body-sm text-body-sm text-secondary">22 de Outubro</span>
              <span className="font-headline-sm text-headline-sm text-on-surface mt-0.5">Turno Integral</span>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed-variant font-label-sm text-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              Com Ocorrência
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            <span className="font-code-sm text-code-sm px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface tracking-wide">
              ROM-2024-88345
            </span>
            <span className="font-body-sm text-body-sm text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">local_shipping</span>
              BRA-2E19
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface mt-2">
            Bela Vista &amp; Centro Histórico
          </p>
          <div className="mt-3.5 p-3 rounded-DEFAULT bg-surface-container-low flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-body-sm text-[11px] text-secondary">Paradas</span>
              <span className="font-code-md text-code-md text-on-surface">20 <span className="font-body-sm text-[11px] text-error">(2 ausentes)</span></span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-body-sm text-[11px] text-secondary">Percurso</span>
              <span className="font-code-md text-code-md text-on-surface">42.1 km</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-body-sm text-[11px] text-secondary">Duração</span>
              <span className="font-code-md text-code-md text-on-surface">08h 00m</span>
            </div>
          </div>
          <div className="mt-3.5 pt-2.5 flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-amber-600">warning</span>
              2 Comprovantes em fila
            </span>
            <span className="font-label-md text-label-md text-primary flex items-center gap-0.5">
              Ver Detalhes
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </span>
          </div>
        </div>
        {/* Card 4: 21 Out / Itaim Bibi & Moema */}
        <div className="route-item bg-surface-container-lowest rounded-lg p-space-md shadow-sm transition-transform active:scale-[0.99] cursor-pointer" data-code="ROM-2024-88310" data-neighborhood="Moema" onClick={() => navigate('/historico/ROM-2024-88310')}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col">
              <span className="font-body-sm text-body-sm text-secondary">21 de Outubro</span>
              <span className="font-headline-sm text-headline-sm text-on-surface mt-0.5">Turno Manhã</span>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
              100% Sucesso
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            <span className="font-code-sm text-code-sm px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface tracking-wide">
              ROM-2024-88310
            </span>
            <span className="font-body-sm text-body-sm text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">local_shipping</span>
              BRA-2E19
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface mt-2">
            Itaim Bibi &amp; Moema Pássaros
          </p>
          <div className="mt-3.5 p-3 rounded-DEFAULT bg-surface-container-low flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-body-sm text-[11px] text-secondary">Paradas</span>
              <span className="font-code-md text-code-md text-on-surface">16 <span className="font-body-sm text-[11px] text-primary">(16 ok)</span></span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-body-sm text-[11px] text-secondary">Percurso</span>
              <span className="font-code-md text-code-md text-on-surface">38.5 km</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-body-sm text-[11px] text-secondary">Duração</span>
              <span className="font-code-md text-code-md text-on-surface">05h 30m</span>
            </div>
          </div>
          <div className="mt-3.5 pt-2.5 flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">done_all</span>
              Entrega Perfeita
            </span>
            <span className="font-label-md text-label-md text-primary flex items-center gap-0.5">
              Ver Detalhes
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </span>
          </div>
        </div>
      </div>
      {/* Search Empty State (Hidden initially) */}
      <div className="hidden flex-col items-center justify-center py-12 px-space-md text-center bg-surface-container-lowest rounded-lg" id="empty-state">
        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-secondary mb-3">
          <span className="material-symbols-outlined text-[32px]">travel_explore</span>
        </div>
        <span className="font-headline-sm text-headline-sm text-on-surface">Nenhuma rota encontrada</span>
        <p className="font-body-sm text-body-sm text-secondary max-w-[240px] mt-1">Verifique o código do romaneio ou limpe os filtros aplicados.</p>
        <button className="mt-4 px-5 h-11 rounded-full bg-surface-container text-on-surface font-label-md text-label-md" id="reset-filter-btn">
          Limpar Busca
        </button>
      </div>
      {/* Pagination hint & load more feedback */}
      <div className="flex flex-col items-center text-center pt-space-xs pb-space-sm space-y-1">
        <span className="font-body-sm text-body-sm text-secondary">Exibindo 4 de 24 rotas de Outubro</span>
        <span className="font-code-sm text-code-sm text-primary flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
          Puxe para carregar mais
        </span>
      </div>
      {/* Export Operational Action Pin */}
      <div className="w-full pt-1 pb-2">
        <button className="w-full h-14 rounded-full bg-surface-container-lowest text-primary hover:bg-surface-container-high active:bg-surface-container transition-all flex items-center justify-center gap-2 font-label-lg text-label-lg shadow-sm" id="export-pdf-btn">
          <span className="material-symbols-outlined text-[22px]">picture_as_pdf</span>
          <span>Exportar Relatório Mensal (PDF)</span>
        </button>
      </div>
      {/* Date Selection Bottom Sheet Modal (Drawer) */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300 flex items-end" id="calendar-drawer">
        <div className="w-full bg-surface-container-lowest rounded-t-xl p-space-lg max-h-[751px] overflow-y-auto transform translate-y-full transition-transform duration-300">
          <div className="w-12 h-1.5 rounded-full bg-surface-container-highest mx-auto mb-4" />
          <div className="flex items-center justify-between pb-3">
            <span className="font-headline-sm text-headline-sm text-on-surface">Filtrar por Período</span>
            <button className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container" id="close-drawer-btn">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div className="space-y-2 py-2">
            <button className="w-full p-3.5 text-left rounded-DEFAULT bg-surface-container-low hover:bg-surface-container flex items-center justify-between font-label-md text-label-md text-on-surface">
              <span>Este Mês (Outubro 2024)</span>
              <span className="material-symbols-outlined text-primary text-[20px]">check</span>
            </button>
            <button className="w-full p-3.5 text-left rounded-DEFAULT hover:bg-surface-container-low flex items-center justify-between font-label-md text-label-md text-on-surface">
              <span>Mês Anterior (Setembro 2024)</span>
              <span className="font-code-sm text-code-sm text-secondary">26 rotas</span>
            </button>
            <button className="w-full p-3.5 text-left rounded-DEFAULT hover:bg-surface-container-low flex items-center justify-between font-label-md text-label-md text-on-surface">
              <span>Agosto 2024</span>
              <span className="font-code-sm text-code-sm text-secondary">28 rotas</span>
            </button>
          </div>
          <div className="pt-4 flex gap-3">
            <button className="w-full h-13 py-3 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg shadow-md" id="apply-filter-btn">
              Aplicar Filtro
            </button>
          </div>
        </div>
      </div>
      {/* Toast Notification element for PDF export delight */}
      <div className="fixed bottom-24 inset-x-4 mx-auto max-w-sm bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-full shadow-lg flex items-center gap-3 opacity-0 pointer-events-none transition-all duration-300 z-50" id="toast-notify">
        <span className="material-symbols-outlined text-tertiary-fixed text-[20px]">cloud_download</span>
        <span className="font-body-sm text-body-sm text-inverse-on-surface flex-1">Relatório gerado e enviado para seu email!</span>
      </div>
    </div>
  </main><nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#131313] shadow-[0_-4px_16px_rgba(0,0,0,0.22)]" data-active-classes="text-primary-container font-label-md"><div className="flex justify-around items-center h-[72px] px-space-xs"><Link aria-current="page" className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] transition-colors group text-primary-container font-label-md" to="/rota"><span className="material-symbols-outlined text-[24px]">local_shipping</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Rota</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></Link><Link className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" to="/historico"><span className="material-symbols-outlined text-[24px]">history</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Histórico</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></Link><Link className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" to="/recibos"><span className="material-symbols-outlined text-[24px]">receipt_long</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Recibos</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></Link><Link className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" to="/perfil"><span className="material-symbols-outlined text-[24px]">account_circle</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Perfil</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></Link></div></nav>
</div>
    </ScreenFrame>
  );
}
