import { useEffect, useState } from 'react';
import ScreenFrame from '../../../lib/ScreenFrame.jsx';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext.jsx';
import { returnChecklistItems as RETURN_CHECKLIST_ITEMS } from '../../../lib/fixtures.js';
import AppHeader from '../../../components/ui/AppHeader.jsx';
import BottomNav from '../../../components/ui/BottomNav.jsx';

export default function B7ChecklistDeRetorno() {
  const navigate = useNavigate();
  const { updateChecklist, finishRoute, showToast } = useApp();
  const [items, setItems] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(RETURN_CHECKLIST_ITEMS.map((item) => [item.key, true])),
  );

  const handleFinish = async () => {
    const approved = await updateChecklist('return', items);
    if (!approved) {
      showToast(
        'Reprovação em item crítico do checklist de retorno impede o encerramento do turno.',
        'warning',
      );
      return;
    }
    const finished = finishRoute();
    if (finished) navigate('/rota');
  };

  useEffect(() => {
    document.title = 'RotaPro Driver';
  }, []);
  return (
    <ScreenFrame screenId="b.7_checklist_de_retorno">
      <div>
        <AppHeader title="Rota" />
        <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface px-margin">
          <div className="flex flex-col w-full pb-20 space-y-space-md">
            {/* Banner Informativo de Etapa */}
            <section className="flex items-center justify-between bg-surface-container-low px-space-md py-space-sm rounded-lg shadow-sm">
              <div className="flex items-center gap-space-sm min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-primary-container animate-pulse shrink-0" />
                <div className="flex flex-col truncate">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Etapa Final
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface truncate">
                    Fechamento de Turno
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm shrink-0">
                Retorno à Base
              </span>
            </section>
            {/* Card do Veículo Alocado */}
            <section className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm space-y-space-sm">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="font-code-lg text-code-lg text-on-surface bg-secondary-fixed px-3 py-1 rounded-full inline-block w-fit">
                    BRA-2E19
                  </span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface mt-1">
                    Mercedes-Benz Sprinter 415 CDI
                  </h2>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Furgão Longo • Frota SP-02
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface shrink-0">
                  <span className="material-symbols-outlined text-[24px]">local_shipping</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
                <div className="bg-surface-container-low p-2.5 rounded">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block">
                    Motorista
                  </span>
                  <span className="font-label-md text-label-md text-on-surface block truncate">
                    Lucas Silveira
                  </span>
                </div>
                <div className="bg-surface-container-low p-2.5 rounded">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block">
                    Turno Operacional
                  </span>
                  <span className="font-label-md text-label-md text-on-surface block truncate">
                    Tarde (Encerramento)
                  </span>
                </div>
              </div>
            </section>
            {/* Card de Quilometragem Final (Odômetro) */}
            <section className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm space-y-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-[20px] text-primary-container">
                    speed
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">
                    Odômetro de Fechamento
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1 font-code-sm text-code-sm text-on-tertiary-container bg-tertiary-container/10 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" />
                  +48 km na rota
                </span>
              </div>
              <div className="grid grid-cols-2 gap-space-sm">
                <div className="flex flex-col bg-surface-container-low p-3 rounded-DEFAULT justify-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    KM Inicial (Saída)
                  </span>
                  <span className="font-code-md text-code-md text-on-surface mt-0.5">
                    142.850 km
                  </span>
                </div>
                <div className="flex flex-col bg-surface-container-low p-3 rounded-DEFAULT justify-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    KM Percorrido
                  </span>
                  <span className="font-code-md text-code-md text-primary-container mt-0.5">
                    48 km
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="font-label-sm text-label-sm text-on-surface" htmlFor="km-final">
                  Quilometragem Final (KM no Painel)
                </label>
                <div className="relative flex items-center">
                  <input
                    className="w-full h-14 pl-4 pr-12 bg-surface-container-low text-on-surface font-code-lg text-code-lg rounded-full focus:outline-none focus:ring-0 focus:bg-surface-container-lowest transition-all"
                    id="km-final"
                    type="text"
                    defaultValue="142.898 km"
                  />
                  <span className="absolute right-4 material-symbols-outlined text-primary-container text-[24px]">
                    verified
                  </span>
                </div>
              </div>
              {/* Comprovante Fotográfico do Painel */}
              <div className="flex items-center justify-between bg-surface-container-low p-space-sm rounded-DEFAULT">
                <div className="flex items-center gap-space-sm min-w-0">
                  <div className="relative w-12 h-12 rounded-DEFAULT overflow-hidden shrink-0 bg-surface-container">
                    <img
                      alt="Foto do odômetro no checklist de retorno"
                      className="w-full h-full object-cover"
                      data-alt="Close-up macro shot of a modern commercial van digital dashboard illuminated softly showing exact odometer reading 142898 km with sharp high-contrast dashboard gauges, logistics transport inspection photo in crisp clean vehicle interior lighting."
                      src="/screens/logotipo_rotapro_driver.png"
                    />
                    <div className="absolute inset-0 bg-inverse-surface/10" />
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="font-label-md text-label-md text-on-surface truncate">
                      Painel Registrado
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                      Foto Anexada • 17:42
                    </span>
                  </div>
                </div>
                <button
                  aria-label="Alterar foto do painel"
                  className="h-10 px-4 rounded-full bg-surface-container-highest text-on-surface font-label-sm text-label-sm flex items-center gap-1 shrink-0 active:scale-95 transition-transform"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                  Refazer
                </button>
              </div>
            </section>
            {/* Lista de Verificação de Retorno */}
            <section className="space-y-space-sm">
              <div className="flex items-center justify-between px-space-xs">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  Itens Obrigatórios de Pátio
                </h3>
                <span className="font-code-sm text-code-sm text-on-surface-variant">
                  {Object.values(items).filter(Boolean).length}/{RETURN_CHECKLIST_ITEMS.length}{' '}
                  CONFERIDOS
                </span>
              </div>
              {/* Item 1: Combustível e Fluidos */}
              <div
                className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm space-y-space-sm"
                data-checklist-item="1"
              >
                <div className="flex items-start gap-space-sm">
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">local_gas_station</span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-label-md text-label-md text-on-surface">
                      1. Combustível e Fluidos
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Tanque reposto conforme política da frota / sem alertas no painel.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
                  <button
                    className={`toggle-btn h-12 rounded-full font-label-md text-label-md flex items-center justify-center gap-1.5 transition-colors active:scale-98 ${items.combustivel ? 'bg-primary-container text-on-primary shadow-sm' : 'bg-surface-container-highest text-on-surface-variant'}`}
                    onClick={() => setItems((current) => ({ ...current, combustivel: true }))}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    Sim
                  </button>
                  <button
                    className={`toggle-btn h-12 rounded-full font-label-md text-label-md flex items-center justify-center gap-1.5 transition-colors active:scale-98 ${!items.combustivel ? 'bg-primary-container text-on-primary shadow-sm' : 'bg-surface-container-highest text-on-surface-variant'}`}
                    onClick={() => setItems((current) => ({ ...current, combustivel: false }))}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">cancel</span>
                    Não
                  </button>
                </div>
              </div>
              {/* Item 2: Lataria e Novas Avarias */}
              <div
                className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm space-y-space-sm"
                data-checklist-item="2"
              >
                <div className="flex items-start gap-space-sm">
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">minor_crash</span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-label-md text-label-md text-on-surface">
                      2. Lataria e Novas Avarias
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Nenhum novo risco, batida ou amassado durante a rota operacional.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
                  <button
                    className={`toggle-btn h-12 rounded-full font-label-md text-label-md flex items-center justify-center gap-1.5 transition-colors active:scale-98 ${items.lataria ? 'bg-primary-container text-on-primary shadow-sm' : 'bg-surface-container-highest text-on-surface-variant'}`}
                    onClick={() => setItems((current) => ({ ...current, lataria: true }))}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    Sim
                  </button>
                  <button
                    className={`toggle-btn h-12 rounded-full font-label-md text-label-md flex items-center justify-center gap-1.5 transition-colors active:scale-98 ${!items.lataria ? 'bg-primary-container text-on-primary shadow-sm' : 'bg-surface-container-highest text-on-surface-variant'}`}
                    onClick={() => setItems((current) => ({ ...current, lataria: false }))}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">cancel</span>
                    Não
                  </button>
                </div>
              </div>
              {/* Item 3: Pneus e Calibragem */}
              <div
                className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm space-y-space-sm"
                data-checklist-item="3"
              >
                <div className="flex items-start gap-space-sm">
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">adjust</span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-label-md text-label-md text-on-surface">
                      3. Pneus e Calibragem
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Sem furos, bolhas ou danos laterais durante a operação de hoje.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
                  <button
                    className={`toggle-btn h-12 rounded-full font-label-md text-label-md flex items-center justify-center gap-1.5 transition-colors active:scale-98 ${items.pneus ? 'bg-primary-container text-on-primary shadow-sm' : 'bg-surface-container-highest text-on-surface-variant'}`}
                    onClick={() => setItems((current) => ({ ...current, pneus: true }))}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    Sim
                  </button>
                  <button
                    className={`toggle-btn h-12 rounded-full font-label-md text-label-md flex items-center justify-center gap-1.5 transition-colors active:scale-98 ${!items.pneus ? 'bg-primary-container text-on-primary shadow-sm' : 'bg-surface-container-highest text-on-surface-variant'}`}
                    onClick={() => setItems((current) => ({ ...current, pneus: false }))}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">cancel</span>
                    Não
                  </button>
                </div>
              </div>
              {/* Item 4: Limpeza da Cabine e Baú */}
              <div
                className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm space-y-space-sm"
                data-checklist-item="4"
              >
                <div className="flex items-start gap-space-sm">
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">cleaning_services</span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-label-md text-label-md text-on-surface">
                      4. Limpeza da Cabine e Baú
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Lixo recolhido e baú limpo, varrido e 100% descarregado.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
                  <button
                    className={`toggle-btn h-12 rounded-full font-label-md text-label-md flex items-center justify-center gap-1.5 transition-colors active:scale-98 ${items.limpeza ? 'bg-primary-container text-on-primary shadow-sm' : 'bg-surface-container-highest text-on-surface-variant'}`}
                    onClick={() => setItems((current) => ({ ...current, limpeza: true }))}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    Sim
                  </button>
                  <button
                    className={`toggle-btn h-12 rounded-full font-label-md text-label-md flex items-center justify-center gap-1.5 transition-colors active:scale-98 ${!items.limpeza ? 'bg-primary-container text-on-primary shadow-sm' : 'bg-surface-container-highest text-on-surface-variant'}`}
                    onClick={() => setItems((current) => ({ ...current, limpeza: false }))}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">cancel</span>
                    Não
                  </button>
                </div>
              </div>
              {/* Item 5: Devolução de Chaves e CRLV */}
              <div
                className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm space-y-space-sm"
                data-checklist-item="5"
              >
                <div className="flex items-start gap-space-sm">
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">vpn_key</span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-label-md text-label-md text-on-surface">
                      5. Devolução de Chaves e CRLV
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Chave física, documento CRLV e cartão de combustível entregues na guarita.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
                  <button
                    className={`toggle-btn h-12 rounded-full font-label-md text-label-md flex items-center justify-center gap-1.5 transition-colors active:scale-98 ${items.chaves ? 'bg-primary-container text-on-primary shadow-sm' : 'bg-surface-container-highest text-on-surface-variant'}`}
                    onClick={() => setItems((current) => ({ ...current, chaves: true }))}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    Sim
                  </button>
                  <button
                    className={`toggle-btn h-12 rounded-full font-label-md text-label-md flex items-center justify-center gap-1.5 transition-colors active:scale-98 ${!items.chaves ? 'bg-primary-container text-on-primary shadow-sm' : 'bg-surface-container-highest text-on-surface-variant'}`}
                    onClick={() => setItems((current) => ({ ...current, chaves: false }))}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">cancel</span>
                    Não
                  </button>
                </div>
              </div>
            </section>
            {/* Seção de Devoluções / Sobras de Carga */}
            <section className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm space-y-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-[20px] text-tertiary">
                    inventory_2
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">
                    Devoluções &amp; Sobras
                  </h3>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm">
                  1 Pendência Baixada
                </span>
              </div>
              <div className="bg-surface-container-low p-space-sm rounded-DEFAULT space-y-2">
                <div className="flex items-start justify-between gap-space-xs">
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface">
                      1 volume devolvido à Doca 04
                    </span>
                    <span className="font-code-sm text-code-sm text-on-surface-variant">
                      Romaneio: ROM-2024-88412
                    </span>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-primary-container/15 text-primary font-label-sm text-label-sm flex items-center gap-1 shrink-0">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    Recebido
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 text-on-surface-variant font-body-sm text-body-sm">
                  <span>Conferência de Pátio:</span>
                  <span className="font-label-sm text-label-sm text-on-surface">
                    Encarregado Marcos T. (Matrícula #4419)
                  </span>
                </div>
              </div>
            </section>
            {/* Termo Legal & Declaração */}
            <section className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm space-y-space-sm">
              <div className="flex items-start gap-space-sm">
                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">
                    assignment_turned_in
                  </span>
                </div>
                <div className="flex flex-col">
                  <h4 className="font-label-md text-label-md text-on-surface">
                    Termo de Encerramento Operacional
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                    Ao encerrar o turno, atesto que o veículo foi entregue nas condições declaradas
                    acima e todas as ocorrências de campo foram devidamente registradas no sistema
                    RotaPro.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-space-sm p-space-sm bg-surface-container-low rounded-DEFAULT cursor-pointer select-none">
                <input
                  defaultChecked
                  className="w-5 h-5 rounded-full accent-[#00B000] cursor-pointer"
                  type="checkbox"
                />
                <span className="font-label-sm text-label-sm text-on-surface">
                  Declaro verídicas as informações do checklist
                </span>
              </label>
            </section>
            {/* Indicador de Nuvem e Ação Primária */}
            <div className="pt-space-xs space-y-space-sm">
              <div className="flex items-center justify-center gap-1.5 text-on-surface-variant">
                <span
                  className="material-symbols-outlined text-[16px] text-primary-container animate-spin"
                  style={{ animationDuration: '3s' }}
                >
                  sync
                </span>
                <span className="font-body-sm text-body-sm">
                  Sincronização em nuvem ativa • Pronto para envio
                </span>
              </div>
              {/* Botão de Ação Primária */}
              <button
                aria-label="Encerrar Turno e Liberar Veículo"
                className="w-full h-14 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg shadow-lg flex items-center justify-center gap-space-sm active:scale-95 transition-transform"
                id="btn-encerrar"
                onClick={handleFinish}
                type="button"
              >
                <span className="material-symbols-outlined text-[24px]">logout</span>
                Encerrar Turno e Liberar Veículo
              </button>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    </ScreenFrame>
  );
}
