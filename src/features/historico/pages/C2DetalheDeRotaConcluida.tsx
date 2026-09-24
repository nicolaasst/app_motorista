import { useEffect } from 'react';
import ScreenFrame from '../../../lib/ScreenFrame.jsx';
import { Link } from 'react-router-dom';
import AppHeader from '../../../components/ui/AppHeader.jsx';
import BottomNav from '../../../components/ui/BottomNav.jsx';

export default function C2DetalheDeRotaConcluida() {
  useEffect(() => {
    document.title = 'RotaPro Driver';
  }, []);
  return (
    <ScreenFrame screenId="c.2_detalhe_de_rota_conclu_da">
      <div>
        <AppHeader title="Rota" />
        <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface px-margin">
          <div className="flex flex-col w-full pb-20">
            {/* Top Navigation & Audit Header */}
            <div className="flex items-center justify-between py-space-sm mb-space-sm">
              <Link
                className="inline-flex items-center gap-space-xs py-2 px-3 rounded-full bg-surface-container-lowest text-on-surface shadow-sm active:bg-surface-container transition-colors"
                to="/historico"
              >
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                  arrow_back
                </span>
                <span className="font-label-md text-label-md">Histórico</span>
              </Link>
              <div className="flex items-center gap-space-xs">
                <button
                  className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface shadow-sm active:bg-surface-container transition-colors"
                  title="Compartilhar"
                >
                  <span className="material-symbols-outlined text-[20px]">share</span>
                </button>
                <button
                  className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface shadow-sm active:bg-surface-container transition-colors"
                  title="Exportar Resumo"
                >
                  <span className="material-symbols-outlined text-[20px]">download</span>
                </button>
              </div>
            </div>
            {/* Subheader Banner: Romaneio & State */}
            <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm mb-space-md">
              <div className="flex items-center justify-between mb-space-xs">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-[20px] text-primary">
                    local_shipping
                  </span>
                  <span className="font-code-md text-code-md text-on-surface font-bold">
                    ROM-2024-88412
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-primary">
                  <span className="w-2 h-2 rounded-full bg-primary-container" />
                  <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">
                    Rota Concluída
                  </span>
                </div>
              </div>
              <div className="text-on-surface-variant font-body-sm text-body-sm flex items-center gap-1 mb-space-sm">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                <span>24 de Outubro de 2024 • 07:30 às 14:15 (06h 45m)</span>
              </div>
              <div className="flex items-center justify-between pt-space-xs bg-surface-container-low p-space-sm rounded">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Veículo Operacional
                  </span>
                  <span className="font-code-sm text-code-sm text-on-surface font-bold">
                    Sprinter • BRA-2E19
                  </span>
                </div>
                <div className="h-6 w-[1px] bg-secondary-fixed-dim/40" />
                <div className="flex flex-col items-end">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Odômetro Auditado
                  </span>
                  <span className="font-code-sm text-code-sm text-on-surface font-bold">
                    142.850 → 142.898 km
                  </span>
                </div>
              </div>
            </div>
            {/* Interactive Visual Route Replay Map */}
            <div className="bg-surface-container-lowest rounded-lg p-space-sm shadow-sm mb-space-md overflow-hidden relative">
              <div className="flex items-center justify-between px-space-xs pb-space-xs">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[20px] text-primary">
                    alt_route
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                    Replay de Trajeto
                  </span>
                </div>
                <div className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface font-code-sm text-code-sm font-bold">
                  48.2 km
                </div>
              </div>
              {/* Map Canvas with dynamic route overlay simulation */}
              <div className="relative w-full h-64 rounded bg-surface-container-high overflow-hidden shadow-inner mt-1">
                <div
                  className="w-full h-full bg-cover bg-center absolute inset-0 opacity-70"
                  data-location="São Paulo, Brazil"
                  style={{}}
                />
                {/* Simulated Vector Route Path & Milestones Overlay */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  fill="none"
                  viewBox="0 0 360 256"
                >
                  {/* Route Polyline (Audit Vivid Green) */}
                  <path
                    className="drop-shadow-sm"
                    d="M 40,210 Q 70,180 95,150 T 150,130 T 210,165 T 265,115 T 310,70 T 240,45 T 160,75 Z"
                    stroke="#00B000"
                    strokeDasharray="1 0"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="4"
                  />
                  {/* Depot: Doca Central */}
                  <g transform="translate(32, 202)">
                    <circle cx="8" cy="8" fill="#131313" r="8" />
                    <path d="M 5,8 L 11,8 M 8,5 L 8,11" stroke="#FFFFFF" strokeWidth="2" />
                  </g>
                  {/* Stop 1 (Green Pin) */}
                  <g transform="translate(87, 142)">
                    <circle cx="8" cy="8" fill="#00B000" r="7" stroke="#FFFFFF" strokeWidth="2" />
                    <text
                      fill="#FFFFFF"
                      fontFamily="'Space Mono'"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                      x="8"
                      y="11"
                    >
                      1
                    </text>
                  </g>
                  {/* Stop 2 (Green Pin) */}
                  <g transform="translate(142, 122)">
                    <circle cx="8" cy="8" fill="#00B000" r="7" stroke="#FFFFFF" strokeWidth="2" />
                    <text
                      fill="#FFFFFF"
                      fontFamily="'Space Mono'"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                      x="8"
                      y="11"
                    >
                      2
                    </text>
                  </g>
                  {/* Stop 3 (Green Pin) */}
                  <g transform="translate(202, 157)">
                    <circle cx="8" cy="8" fill="#00B000" r="7" stroke="#FFFFFF" strokeWidth="2" />
                    <text
                      fill="#FFFFFF"
                      fontFamily="'Space Mono'"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                      x="8"
                      y="11"
                    >
                      3
                    </text>
                  </g>
                  {/* Stop 4 (Green Pin) */}
                  <g transform="translate(257, 107)">
                    <circle cx="8" cy="8" fill="#00B000" r="7" stroke="#FFFFFF" strokeWidth="2" />
                    <text
                      fill="#FFFFFF"
                      fontFamily="'Space Mono'"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                      x="8"
                      y="11"
                    >
                      4
                    </text>
                  </g>
                  {/* Stop 5 (Exception Red Pin) */}
                  <g transform="translate(302, 62)">
                    <circle cx="8" cy="8" fill="#BA1A1A" r="8" stroke="#FFFFFF" strokeWidth="2" />
                    <text
                      fill="#FFFFFF"
                      fontFamily="'Space Mono'"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                      x="8"
                      y="11"
                    >
                      5
                    </text>
                  </g>
                </svg>
                {/* Map Floating Tag: Doca Central */}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-inverse-surface/90 text-inverse-on-surface rounded-full font-label-sm text-[10px] flex items-center gap-1 shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed" />
                  <span>Origem / Retorno: Doca Central</span>
                </div>
                {/* Quick Zoom/Center Buttons */}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  <button
                    aria-label="Aumentar zoom"
                    className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface flex items-center justify-center shadow"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                  <button
                    aria-label="Diminuir zoom"
                    className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface flex items-center justify-center shadow"
                  >
                    <span className="material-symbols-outlined text-[18px]">remove</span>
                  </button>
                </div>
              </div>
              {/* Replay Controller Bar */}
              <div className="mt-space-sm p-space-sm bg-surface-container-low rounded flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-inverse-surface text-inverse-on-surface font-label-md text-label-md active:bg-secondary transition-colors"
                    id="replayToggleBtn"
                  >
                    <span
                      className="material-symbols-outlined text-[18px] text-primary-fixed"
                      id="replayIcon"
                    >
                      play_arrow
                    </span>
                    <span id="replayStatusText">Replay do Trajeto</span>
                  </button>
                  <span
                    className="font-code-sm text-code-sm text-on-surface-variant font-bold"
                    id="replayTimer"
                  >
                    06h 45m (Final)
                  </span>
                </div>
                {/* Interactive Progress Scrubber */}
                <div className="flex items-center gap-2">
                  <span className="font-code-sm text-[10px] text-on-surface-variant">07:30</span>
                  <input
                    aria-label="Barra de tempo do trajeto"
                    className="w-full accent-primary h-1.5 bg-surface-container-highest rounded cursor-pointer"
                    id="replaySlider"
                    max="100"
                    min="0"
                    type="range"
                    defaultValue="100"
                  />
                  <span className="font-code-sm text-[10px] text-on-surface-variant">14:15</span>
                </div>
              </div>
            </div>
            {/* Key Operational Metrics (Bento Style Grid) */}
            <div className="grid grid-cols-2 gap-space-sm mb-space-md">
              <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant mb-space-xs">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider">
                    Paradas Totais
                  </span>
                  <span className="material-symbols-outlined text-[20px]">pin_drop</span>
                </div>
                <div className="font-display-lg text-display-lg text-on-surface font-black">18</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  100% roteirizadas
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-primary mb-space-xs">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Sucesso
                  </span>
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                </div>
                <div className="font-display-lg text-display-lg text-primary font-black">
                  17 <span className="text-body-md font-bold text-on-surface-variant">/ 94.4%</span>
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  17 canhotos validados
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-error mb-space-xs">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Ocorrências
                  </span>
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                </div>
                <div className="font-display-lg text-display-lg text-error font-black">01</div>
                <div className="font-body-sm text-body-sm text-error mt-1">Devolução em doca</div>
              </div>
              <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-on-surface-variant mb-space-xs">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider">
                    Média / Parada
                  </span>
                  <span className="material-symbols-outlined text-[20px]">timer</span>
                </div>
                <div className="font-display-lg text-display-lg text-on-surface font-black">
                  14 <span className="text-body-md font-bold text-on-surface-variant">min</span>
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Dentro da meta SLA
                </div>
              </div>
            </div>
            {/* Timeline Audit Stop Breakdown */}
            <div className="flex items-center justify-between mb-space-xs">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                  format_list_numbered
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  Linha do Tempo de Paradas
                </h3>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Modo Auditoria
              </span>
            </div>
            <div className="flex flex-col gap-space-sm mb-space-lg">
              {/* Stop 01 */}
              <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-inverse-surface text-inverse-on-surface font-code-sm text-code-sm flex items-center justify-center font-bold">
                      #01
                    </span>
                    <div>
                      <h4 className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                        Hospital Sírio-Libanês
                      </h4>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Rua Dona Adma Jafet, 115 - Bela Vista
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                    08:42
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 text-on-surface-variant font-body-sm text-body-sm bg-surface-container-low p-2 rounded">
                  <span>
                    Recebido: <b className="text-on-surface">Carlos M. (Farmácia Central)</b>
                  </span>
                  <button className="text-primary font-label-md text-label-md flex items-center gap-0.5">
                    <span>Ver Comprovante</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>
              {/* Stop 02 */}
              <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-inverse-surface text-inverse-on-surface font-code-sm text-code-sm flex items-center justify-center font-bold">
                      #02
                    </span>
                    <div>
                      <h4 className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                        Drogaria São Paulo Consolação
                      </h4>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Rua da Consolação, 2140 - Cerqueira César
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                    09:15
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 text-on-surface-variant font-body-sm text-body-sm bg-surface-container-low p-2 rounded">
                  <span>
                    Recebido: <b className="text-on-surface">Amanda S. (Gerência)</b>
                  </span>
                  <button className="text-primary font-label-md text-label-md flex items-center gap-0.5">
                    <span>Ver Comprovante</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>
              {/* Stop 03 */}
              <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-inverse-surface text-inverse-on-surface font-code-sm text-code-sm flex items-center justify-center font-bold">
                      #03
                    </span>
                    <div>
                      <h4 className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                        Clínica Médica Paulista
                      </h4>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Av. Paulista, 1842 - Conjunto 42
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                    10:05
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 text-on-surface-variant font-body-sm text-body-sm bg-surface-container-low p-2 rounded">
                  <span>
                    Recebido: <b className="text-on-surface">Marcelo T. (Recepção)</b>
                  </span>
                  <button className="text-primary font-label-md text-label-md flex items-center gap-0.5">
                    <span>Ver Comprovante</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>
              {/* Stop 04 */}
              <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-inverse-surface text-inverse-on-surface font-code-sm text-code-sm flex items-center justify-center font-bold">
                      #04
                    </span>
                    <div>
                      <h4 className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                        Laboratório Fleury
                      </h4>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Rua Cincinato Braga, 282 - Paraíso
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                    11:20
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 text-on-surface-variant font-body-sm text-body-sm bg-surface-container-low p-2 rounded">
                  <span>
                    Recebido: <b className="text-on-surface">Patricia R. (Triagem Geral)</b>
                  </span>
                  <button className="text-primary font-label-md text-label-md flex items-center gap-0.5">
                    <span>Ver Comprovante</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>
              {/* Stop 05: Exception/Failure State */}
              <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col gap-2 relative overflow-hidden">
                {/* Soft Red Accent Edge */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-error" />
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-error text-on-error font-code-sm text-code-sm flex items-center justify-center font-bold">
                      #05
                    </span>
                    <div>
                      <h4 className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                        Farmácia Santa Clara Ltda
                      </h4>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Rua Vergueiro, 905 - Liberdade
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-error" />
                    Falha
                  </span>
                </div>
                <div className="p-space-sm bg-error-container/20 rounded flex flex-col gap-1 text-on-error-container">
                  <div className="flex items-center justify-between font-label-md text-label-md">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px] text-error">
                        cancel
                      </span>
                      Cliente Ausente / Estabelecimento Fechado
                    </span>
                    <span className="font-code-sm text-code-sm text-error">14:32</span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    1 volume farmacêutico recolhido e devolvido à Doca Central.
                  </span>
                </div>
                <div className="flex items-center justify-end pt-1">
                  <button className="text-error font-label-md text-label-md flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                    <span>Ver Registro Fotográfico da Ocorrência</span>
                  </button>
                </div>
              </div>
              {/* Stop Subsequents Banner */}
              <div className="bg-surface-container rounded-lg p-space-md flex items-center justify-between text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary">
                    done_all
                  </span>
                  <span className="font-body-sm text-body-sm">
                    Paradas #06 até #18 concluídas normalmente
                  </span>
                </div>
                <span className="font-code-sm text-code-sm font-bold text-on-surface">
                  13 paradas
                </span>
              </div>
            </div>
            {/* Audit Status Synchronization Pill */}
            <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-surface-container-low text-on-surface-variant mb-space-md mx-auto shadow-inner">
              <span className="material-symbols-outlined text-[18px] text-primary">verified</span>
              <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider">
                Dados auditados e arquivados no TMS
              </span>
            </div>
            {/* Persistent Sticky Operational Trigger */}
            <div className="w-full flex flex-col gap-2">
              <button className="w-full h-14 rounded-full bg-inverse-surface text-inverse-on-surface font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md active:bg-secondary transition-colors">
                <span className="material-symbols-outlined text-[22px]">picture_as_pdf</span>
                <span>Baixar Relatório e Canhotos (PDF)</span>
              </button>
            </div>
          </div>
          {/* Interactive Replay Micro-Interaction Logic */}
        </main>
        <BottomNav />
      </div>
    </ScreenFrame>
  );
}
