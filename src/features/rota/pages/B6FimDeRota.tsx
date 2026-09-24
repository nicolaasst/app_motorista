import { useEffect } from 'react';
import ScreenFrame from '../../../lib/ScreenFrame.jsx';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../../../components/ui/AppHeader.jsx';
import BottomNav from '../../../components/ui/BottomNav.jsx';

export default function B6FimDeRota() {
  const navigate = useNavigate();
  useEffect(() => {
    document.title = 'RotaPro Driver';
  }, []);
  return (
    <ScreenFrame screenId="b.6_fim_de_rota">
      <div>
        <AppHeader title="Rota" />
        <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface px-margin">
          <div className="flex flex-col w-full pb-8">
            <div className="flex items-center justify-between py-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary-container animate-pulse" />
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  Rota Concluída!
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed shadow-sm">
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  task_alt
                </span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider">
                  100% Executado
                </span>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#131313] via-[#1b1c1c] to-[#015300] text-on-primary p-5 shadow-xl mb-4">
              <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-primary-container/15 blur-2xl pointer-events-none" />
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-tertiary-fixed uppercase tracking-wider mb-1">
                    Turno Encerrado
                  </span>
                  <h1 className="font-headline-lg text-headline-lg text-on-primary leading-tight">
                    Parabéns, Lucas!
                    <br />
                    Rota Finalizada
                  </h1>
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-lowest/10 backdrop-blur-md">
                    <span className="material-symbols-outlined text-tertiary-fixed text-[18px]">
                      receipt
                    </span>
                    <span className="font-code-md text-code-md text-on-primary">
                      ROM-2024-88412
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-tertiary-fixed text-on-tertiary-fixed shadow-[0_0_20px_rgba(148,252,45,0.45)] shrink-0">
                  <span
                    className="material-symbols-outlined text-[32px]"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    verified
                  </span>
                </div>
              </div>
              <div className="relative z-10 mt-5 pt-4 flex items-center justify-between border-t-0 bg-white/5 rounded-xl px-3.5 py-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary-fixed text-[18px]">
                    calendar_today
                  </span>
                  <span className="font-body-sm text-body-sm text-surface-container-low">
                    Hoje, 24 de Outubro
                  </span>
                </div>
                <div className="flex items-center gap-1 text-tertiary-fixed">
                  <span className="material-symbols-outlined text-[16px]">speed</span>
                  <span className="font-label-sm text-label-sm">Ritmo Excelente</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="font-label-md text-label-md text-on-surface">
                Resumo de Produtividade
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Concluído às 14:15
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-surface-container-lowest rounded-[20px] p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-secondary text-[22px]">
                    format_list_numbered
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Paradas
                  </span>
                </div>
                <div className="mt-2">
                  <div className="font-headline-lg text-headline-lg text-on-surface">18</div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    100% visitadas
                  </span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-[20px] p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span
                    className="material-symbols-outlined text-primary-container text-[22px]"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    check_circle
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm">
                    94.4%
                  </span>
                </div>
                <div className="mt-2">
                  <div className="font-headline-lg text-headline-lg text-primary">17</div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Entregues com sucesso
                  </span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-[20px] p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span
                    className="material-symbols-outlined text-error text-[22px]"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    cancel
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm">
                    1 devolução
                  </span>
                </div>
                <div className="mt-2">
                  <div className="font-headline-lg text-headline-lg text-error">1 falha</div>
                  <span className="font-body-sm text-body-sm text-error truncate block">
                    Cliente Ausente
                  </span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-[20px] p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-tertiary text-[22px]">
                    timeline
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Odômetro
                  </span>
                </div>
                <div className="mt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline-lg text-headline-lg text-on-surface">48.2</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">km</span>
                  </div>
                  <span className="font-code-sm text-code-sm text-on-surface-variant">
                    Est: 51.0 km
                  </span>
                </div>
              </div>
              <div className="bg-surface-container-lowest rounded-[20px] p-4 shadow-sm flex flex-col justify-between col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                      schedule
                    </span>
                    <span className="font-label-md text-label-md text-on-surface">
                      Tempo em Trânsito Operacional
                    </span>
                  </div>
                  <span className="font-headline-sm text-headline-sm text-on-surface">06h 45m</span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden flex">
                  <div
                    className="bg-primary-container h-full rounded-full"
                    style={{ width: '85%' }}
                  />
                  <div className="bg-error h-full" style={{ width: '15%' }} />
                </div>
                <div className="flex items-center justify-between mt-2 pt-1 font-code-sm text-code-sm text-on-surface-variant">
                  <span>Início: 07:30</span>
                  <span className="font-body-sm text-body-sm text-primary font-semibold">
                    Término: 14:15
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-[20px] bg-[#FFF8E6] p-4 shadow-sm mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFE6A5] text-[#8C5800] flex items-center justify-center shrink-0">
                  <span
                    className="material-symbols-outlined text-[24px]"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    package_2
                  </span>
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-[#6D4400]">
                      Devolução Pendente
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#FFE299] text-[#5C3800] font-label-sm text-label-sm">
                      Doca Central
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-[#7D5300] mt-0.5">
                    1 volume retido da <strong className="font-semibold">Parada #05</strong> precisa
                    ser descarregado na base.
                  </p>
                  <div className="mt-2.5 flex items-center justify-between bg-surface-container-lowest/80 rounded-xl p-2.5">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Identificador do Pacote
                      </span>
                      <span className="font-code-md text-code-md text-on-surface">
                        VOL-89122-03
                      </span>
                    </div>
                    <button className="px-3 py-1.5 rounded-full bg-[#6D4400] text-[#FFFFFF] font-label-sm text-label-sm flex items-center gap-1 shadow-sm active:scale-95 transition-transform">
                      <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                      <span>Validar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-[20px] p-4 shadow-sm mb-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    bar_chart
                  </span>
                  <span className="font-label-md text-label-md text-on-surface">
                    Cadência de Entregas por Hora
                  </span>
                </div>
                <span className="font-code-sm text-code-sm text-on-surface-variant">
                  Média: 2.6 /h
                </span>
              </div>
              <div className="flex items-end justify-between h-24 pt-4 px-1">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-6 rounded-t-lg bg-primary-container/40 h-8" />
                  <span className="font-code-sm text-[10px] text-on-surface-variant">08h</span>
                </div>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-6 rounded-t-lg bg-primary-container h-14 relative group">
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-code-sm text-[10px] font-bold text-primary">
                      3
                    </span>
                  </div>
                  <span className="font-code-sm text-[10px] text-on-surface-variant">09h</span>
                </div>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-6 rounded-t-lg bg-primary-container h-20 relative group">
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-code-sm text-[10px] font-bold text-primary">
                      4
                    </span>
                  </div>
                  <span className="font-code-sm text-[10px] text-on-surface-variant">10h</span>
                </div>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-6 rounded-t-lg bg-primary-container h-16 relative">
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-code-sm text-[10px] font-bold text-primary">
                      3
                    </span>
                  </div>
                  <span className="font-code-sm text-[10px] text-on-surface-variant">11h</span>
                </div>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-6 rounded-t-lg bg-error h-10 relative">
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-code-sm text-[10px] font-bold text-error">
                      1*
                    </span>
                  </div>
                  <span className="font-code-sm text-[10px] text-on-surface-variant">12h</span>
                </div>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-6 rounded-t-lg bg-primary-container h-20 relative">
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-code-sm text-[10px] font-bold text-primary">
                      4
                    </span>
                  </div>
                  <span className="font-code-sm text-[10px] text-on-surface-variant">13h</span>
                </div>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-6 rounded-t-lg bg-primary-container h-12 relative">
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-code-sm text-[10px] font-bold text-primary">
                      2
                    </span>
                  </div>
                  <span className="font-code-sm text-[10px] text-on-surface-variant">14h</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 text-on-surface-variant font-body-sm text-body-sm">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-container inline-block" />{' '}
                  Entregas Concluídas
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-error inline-block" /> Insucesso
                  (12h)
                </span>
              </div>
            </div>
            <div className="sticky bottom-0 inset-x-0 pt-2 pb-1 bg-gradient-to-t from-surface via-surface/95 to-transparent">
              <button
                className="w-full h-14 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,176,0,0.35)] active:bg-primary active:scale-[0.99] transition-all"
                onClick={() => navigate('/rota/retorno')}
                type="button"
              >
                <span>Prosseguir para Checklist de Retorno</span>
                <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
              </button>
              <div className="mt-2.5 flex items-center justify-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                <span className="font-body-sm text-body-sm">
                  Veículo{' '}
                  <span className="font-code-sm text-code-sm font-bold text-on-surface">
                    BRA-2E19
                  </span>{' '}
                  aguardando inspeção final
                </span>
              </div>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    </ScreenFrame>
  );
}
