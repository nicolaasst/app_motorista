import { useEffect } from 'react';
import ScreenFrame from '../../../lib/ScreenFrame.jsx';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext.jsx';
import AppHeader from '../../../components/ui/AppHeader.jsx';
import BottomNav from '../../../components/ui/BottomNav.jsx';

export default function B1RotaDoDiaHome() {
  const navigate = useNavigate();
  const { route, startNavigation } = useApp();
  const processed = route.stops.filter((stop) =>
    ['delivered', 'failed'].includes(stop.status),
  ).length;
  const stop05 = route.stops.find((stop) => stop.id === 'stop-05');
  useEffect(() => {
    document.title = 'RotaPro Driver';
  }, []);

  const allStopsProcessed = route.stops.length > 0 && processed === route.stops.length;

  const handleStartStop05 = () => {
    if (!stop05) return;
    startNavigation(stop05.id);
    navigate(`/rota/parada/${stop05.id}/navegar`);
  };

  return (
    <ScreenFrame screenId="b.1_rota_do_dia_home">
      <div>
        <AppHeader title="Rota" />
        <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface px-margin">
          <div className="flex flex-col w-full pb-20">
            {/* Driver Greeting & Shift Context */}
            <section className="flex items-center justify-between py-space-sm mb-space-sm">
              <div className="flex flex-col">
                <div className="flex items-center gap-space-xs">
                  <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight">
                    Olá, Lucas
                  </h1>
                  <span className="inline-flex items-center justify-center p-1 text-primary animate-pulse">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-secondary font-medium">
                  Hoje, 24 de Outubro • Turno Tarde
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary">
                <span className="w-2 h-2 rounded-full bg-primary-container animate-ping" />
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary">
                  Em Operação
                </span>
              </div>
            </section>
            {/* Route Summary Master Bento Card (Pure White with 24px curve) */}
            <section className="bg-surface-container-lowest rounded-[24px] shadow-sm p-space-md mb-space-md relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-28 h-28 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-space-sm">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    inventory_2
                  </span>
                  <span className="font-code-md text-code-md text-on-surface tracking-wider">
                    ROM-2024-88412
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-2.5 py-0.5 rounded-full">
                  Setor Paulista 03
                </span>
              </div>
              {/* 3 Metrics Columns */}
              <div className="grid grid-cols-3 gap-2 py-space-sm my-1 bg-surface-container-low rounded-2xl px-3">
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="font-display-lg text-[22px] leading-tight text-on-surface font-extrabold">
                    18
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary">Paradas</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center bg-surface-container-highest/40 rounded-xl px-1">
                  <span className="font-display-lg text-[22px] leading-tight text-on-surface font-extrabold">
                    42.5
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary">Quilômetros</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">
                    17:30
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary">Previsão</span>
                </div>
              </div>
              {/* Progress Indicator */}
              <div className="mt-space-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-body-sm text-body-sm text-on-surface font-semibold">
                    {processed} de {route.stops.length} concluídas
                  </span>
                  <span className="font-code-sm text-code-sm text-primary font-bold">
                    {Math.round((processed / route.stops.length) * 100)}% concluído
                  </span>
                </div>
                <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-primary-container rounded-full transition-all duration-700 ease-out shadow-sm"
                    style={{ width: `${(processed / route.stops.length) * 100}%` }}
                  />
                </div>
              </div>
            </section>
            {/* Section Title & List Controls */}
            <div className="flex items-center justify-between mb-space-sm px-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface text-[20px]">
                  alt_route
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  Sequência de Paradas
                </h2>
              </div>
              <span className="font-body-sm text-body-sm text-secondary">
                {route.stops.length - processed} restantes
              </span>
            </div>
            {/* Stops Vertical Stack */}
            <div className="flex flex-col gap-space-md">
              {/* Stop 05: Next / Active Stop Highlighted */}
              <article className="relative bg-surface-container-lowest rounded-[20px] shadow-md p-space-md bg-gradient-to-r from-primary/5 via-surface-container-lowest to-surface-container-lowest">
                <div className="absolute left-0 top-4 bottom-4 w-1.5 bg-primary-container rounded-r-full" />
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 pl-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-inverse-surface text-inverse-on-surface flex items-center justify-center font-code-md text-code-md shadow-sm">
                      05
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-[#E5F1FF] text-[#0066CC] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0066CC] animate-ping" />
                          {stop05?.status === 'delivered'
                            ? 'Entregue'
                            : stop05?.status === 'failed'
                              ? 'Ocorrência'
                              : 'A Caminho'}
                        </span>
                        <span className="font-label-sm text-label-sm text-secondary">Próxima</span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">
                        Farmácia Santa Clara Ltda
                      </h3>
                    </div>
                  </div>
                </div>
                {/* Address & Map Cue */}
                <div className="my-space-sm pl-2">
                  <div className="flex items-start gap-1.5 text-on-surface-variant mb-2">
                    <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">
                      location_on
                    </span>
                    <p className="font-body-md text-body-md font-medium text-on-surface">
                      Av. Paulista, 1230 - Bela Vista, São Paulo
                    </p>
                  </div>
                  {/* Meta Pills Tag Row */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container font-body-sm text-body-sm text-secondary">
                      <span className="material-symbols-outlined text-[15px]">schedule</span>
                      14:00 - 14:30
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container font-body-sm text-body-sm text-secondary">
                      <span className="material-symbols-outlined text-[15px]">package_2</span>3
                      volumes
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-surface-container-highest font-code-sm text-code-sm text-on-surface font-bold">
                      NF-89122
                    </span>
                  </div>
                </div>
                {/* Quick Action Shortcuts */}
                <div className="grid grid-cols-2 gap-2 mt-space-sm pl-2 pt-space-xs">
                  <button
                    className="h-[48px] rounded-full bg-primary-container text-on-primary font-label-md text-label-md flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-transform"
                    onClick={handleStartStop05}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">navigation</span>
                    Navegar
                  </button>
                  <button
                    className="h-[48px] rounded-full bg-surface-container text-on-surface font-label-md text-label-md flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-colors"
                    onClick={() => stop05 && navigate(`/rota/parada/${stop05.id}`)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">info</span>
                    Ver Detalhes
                  </button>
                </div>
              </article>
              {/* Stop 06: Pending */}
              <article className="bg-surface-container-lowest rounded-[20px] shadow-sm p-space-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-surface-container-highest text-secondary flex items-center justify-center font-code-md text-code-md">
                      06
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-[#FFF3D6] text-[#B26200] font-bold inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B26200]" />
                        Pendente
                      </span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">
                        Supermercado Central
                      </h3>
                    </div>
                  </div>
                </div>
                <div className="mt-space-sm">
                  <div className="flex items-start gap-1.5 text-on-surface-variant mb-2">
                    <span className="material-symbols-outlined text-[18px] text-secondary shrink-0 mt-0.5">
                      store
                    </span>
                    <p className="font-body-md text-body-md text-on-surface">
                      Rua Augusta, 890 - Consolação
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container font-body-sm text-body-sm text-secondary">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      14:45 - 15:15
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container font-body-sm text-body-sm text-secondary">
                      <span className="material-symbols-outlined text-[14px]">package_2</span>5
                      volumes
                    </span>
                  </div>
                </div>
              </article>
              {/* Stop 07: Pending */}
              <article className="bg-surface-container-lowest rounded-[20px] shadow-sm p-space-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-surface-container-highest text-secondary flex items-center justify-center font-code-md text-code-md">
                      07
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-[#FFF3D6] text-[#B26200] font-bold inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B26200]" />
                        Pendente
                      </span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">
                        Dra. Camila Torres
                      </h3>
                    </div>
                  </div>
                </div>
                <div className="mt-space-sm">
                  <div className="flex items-start gap-1.5 text-on-surface-variant mb-2">
                    <span className="material-symbols-outlined text-[18px] text-secondary shrink-0 mt-0.5">
                      home_pin
                    </span>
                    <p className="font-body-md text-body-md text-on-surface">
                      Alameda Santos, 450 - Cerqueira César
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container font-body-sm text-body-sm text-secondary">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      15:30 - 16:00
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container font-body-sm text-body-sm text-secondary">
                      <span className="material-symbols-outlined text-[14px]">package_2</span>1
                      volume
                    </span>
                  </div>
                </div>
              </article>
              {/* Stop 04: Completed */}
              <article className="bg-surface-container-low rounded-[20px] p-space-md opacity-85">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-code-md text-code-md font-bold">
                      <span className="material-symbols-outlined text-[20px]">check</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#016E00] font-bold inline-flex items-center gap-1">
                          Entregue
                        </span>
                        <span className="font-code-sm text-code-sm text-secondary">às 13:42</span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface/80 mt-1 line-through decoration-secondary/40">
                        Tech Solutions SP
                      </h3>
                    </div>
                  </div>
                </div>
                <div className="mt-2 pl-11">
                  <p className="font-body-sm text-body-sm text-secondary">
                    Rua da Consolação, 2100 • 2 volumes
                  </p>
                </div>
              </article>
            </div>
            {/* Floating Sticky Action Trigger for Mobile Glove Ergonomics */}
            <div className="fixed bottom-[84px] inset-x-0 px-margin z-40 pointer-events-none">
              <div className="max-w-md mx-auto pointer-events-auto">
                {allStopsProcessed ? (
                  <button
                    className="w-full h-[56px] rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,176,0,0.4)] active:scale-98 transition-all hover:bg-primary"
                    onClick={() => navigate('/rota/fim')}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[24px]">task_alt</span>
                    <span>Ver Resumo da Rota</span>
                  </button>
                ) : (
                  <button
                    className="w-full h-[56px] rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,176,0,0.4)] active:scale-98 transition-all hover:bg-primary"
                    onClick={handleStartStop05}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[24px]">play_circle</span>
                    <span>Iniciar Próxima Parada (Parada #05)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    </ScreenFrame>
  );
}
