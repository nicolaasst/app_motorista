import { useEffect } from 'react';
import ScreenFrame from '../lib/ScreenFrame.jsx';
import PageRuntime from '../lib/PageRuntime.jsx';

export default function B5RegistrarFalha() {
  useEffect(() => { document.title = 'RotaPro Driver'; }, []);
  return (
    <ScreenFrame screenId="b.5_registrar_falha"><PageRuntime screenId="b.5_registrar_falha">
      <div>
  <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl pt-safe"><div className="h-16 px-margin flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="flex items-center gap-space-sm"><img alt="Logotipo RotaPro Driver" className="h-8 w-auto object-contain" src="/screens/logotipo_rotapro_driver.png" /><div className="flex flex-col"><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">RotaPro</span><span className="font-headline-sm text-headline-sm text-on-surface leading-tight">Rota</span></div></div><div className="flex items-center gap-space-sm"><button aria-label="Notificações" className="relative w-11 h-11 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"><span className="material-symbols-outlined text-[24px]">notifications</span><span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-container text-on-primary font-label-sm text-[10px] ring-2 ring-surface">3</span></button><div className="relative flex items-center justify-center"><img alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20" src="/screens/logotipo_rotapro_driver.png" /><span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary-container ring-1 ring-surface" /></div></div></div></header><main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface px-margin"><div className="flex flex-col w-full pb-32">
      {/* Top Navigation & Contextual Stop Header */}
      <div className="flex flex-col w-full bg-surface-container-lowest rounded-DEFAULT p-space-md shadow-sm mb-space-md">
        <div className="flex items-center justify-between gap-space-sm mb-space-sm">
          <button aria-label="Voltar para a parada" className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors active:scale-95" type="button">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex flex-col items-center flex-1 min-w-0 px-space-xs">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Parada Operacional</span>
            <h1 className="font-headline-sm text-headline-sm text-on-surface truncate">Registrar Insucesso</h1>
          </div>
          <div className="w-11 h-11 flex items-center justify-center rounded-full bg-error-container/30 text-error">
            <span className="material-symbols-outlined text-[22px]">report_problem</span>
          </div>
        </div>
        {/* Stop Details Chips */}
        <div className="flex items-center justify-between bg-surface-container-low rounded-DEFAULT p-space-sm">
          <div className="flex items-center gap-space-xs min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#131313] text-surface-container-lowest font-code-sm text-code-sm flex items-center justify-center font-bold">
              05
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-label-md text-on-surface truncate">Farmácia Santa Clara</span>
              <span className="font-code-sm text-code-sm text-secondary truncate">NF-e 89122 • VOL 1/2</span>
            </div>
          </div>
          <span className="px-space-sm py-1 rounded-full bg-error text-on-error font-label-sm text-label-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-on-error animate-ping" />
            Insucesso
          </span>
        </div>
      </div>
      {/* Informative Notice Banner */}
      <div className="flex items-start gap-space-sm bg-surface-container-lowest rounded-DEFAULT p-space-md shadow-sm mb-space-md">
        <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-[20px]">info</span>
        </div>
        <div className="flex flex-col flex-1">
          <p className="font-label-md text-label-md text-on-surface">Notificação Imediata à Central</p>
          <p className="font-body-sm text-body-sm text-secondary mt-0.5 leading-snug">
            O romaneio técnico será reordenado, o cliente formalmente notificado e a central de tráfego registrará a ocorrência em tempo real.
          </p>
        </div>
      </div>
      {/* Main Motive Selector Section */}
      <section className="flex flex-col w-full mb-space-md">
        <div className="flex items-center justify-between mb-space-sm px-space-xs">
          <span className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Motivo Principal da Falha</span>
          <span className="font-code-sm text-code-sm text-secondary">SELEÇÃO ÚNICA</span>
        </div>
        {/* Reason Cards Grid */}
        <div className="flex flex-col gap-space-sm" id="reason-container">
          {/* Option 1: Selected by default */}
          <label className="reason-card relative flex items-start gap-space-md p-space-md rounded-DEFAULT bg-surface-container-lowest shadow-sm cursor-pointer transition-all active:scale-[0.99] group bg-surface-container-high/40">
            <input defaultChecked className="sr-only peer" name="failure_reason" type="radio" defaultValue="cliente_ausente" />
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container peer-checked:bg-primary peer-checked:text-on-primary flex items-center justify-center shrink-0 transition-colors">
              <span className="material-symbols-outlined text-[22px]">door_front</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-space-xs">
                <span className="font-label-md text-label-md text-on-surface">Cliente Ausente / Fechado</span>
              </div>
              <span className="font-body-sm text-body-sm text-secondary mt-0.5">Sem resposta no interfone, porta trancada ou expediente finalizado</span>
            </div>
            <div className="absolute right-4 top-5 w-5 h-5 rounded-full bg-surface-container flex items-center justify-center peer-checked:bg-primary transition-colors">
              <div className="w-2 h-2 rounded-full bg-on-primary opacity-0 peer-checked:opacity-100" />
            </div>
          </label>
          {/* Option 2 */}
          <label className="reason-card relative flex items-start gap-space-md p-space-md rounded-DEFAULT bg-surface-container-lowest shadow-sm cursor-pointer transition-all active:scale-[0.99] group">
            <input className="sr-only peer" name="failure_reason" type="radio" defaultValue="endereco_incorreto" />
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container peer-checked:bg-primary peer-checked:text-on-primary flex items-center justify-center shrink-0 transition-colors">
              <span className="material-symbols-outlined text-[22px]">wrong_location</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0 pr-6">
              <span className="font-label-md text-label-md text-on-surface">Endereço Não Localizado / Incorreto</span>
              <span className="font-body-sm text-body-sm text-secondary mt-0.5">Numeração inexistente, logradouro não confere no GPS</span>
            </div>
            <div className="absolute right-4 top-5 w-5 h-5 rounded-full bg-surface-container flex items-center justify-center peer-checked:bg-primary transition-colors">
              <div className="w-2 h-2 rounded-full bg-on-primary opacity-0 peer-checked:opacity-100" />
            </div>
          </label>
          {/* Option 3 */}
          <label className="reason-card relative flex items-start gap-space-md p-space-md rounded-DEFAULT bg-surface-container-lowest shadow-sm cursor-pointer transition-all active:scale-[0.99] group">
            <input className="sr-only peer" name="failure_reason" type="radio" defaultValue="recusa_destinatario" />
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container peer-checked:bg-primary peer-checked:text-on-primary flex items-center justify-center shrink-0 transition-colors">
              <span className="material-symbols-outlined text-[22px]">do_not_disturb_on</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0 pr-6">
              <span className="font-label-md text-label-md text-on-surface">Recusado pelo Destinatário</span>
              <span className="font-body-sm text-body-sm text-secondary mt-0.5">Mercadoria não solicitada, desacordo comercial ou pedido cancelado</span>
            </div>
            <div className="absolute right-4 top-5 w-5 h-5 rounded-full bg-surface-container flex items-center justify-center peer-checked:bg-primary transition-colors">
              <div className="w-2 h-2 rounded-full bg-on-primary opacity-0 peer-checked:opacity-100" />
            </div>
          </label>
          {/* Option 4: Damaged with mandatory tag */}
          <label className="reason-card relative flex items-start gap-space-md p-space-md rounded-DEFAULT bg-surface-container-lowest shadow-sm cursor-pointer transition-all active:scale-[0.99] group">
            <input className="sr-only peer" name="failure_reason" type="radio" defaultValue="avaria_produto" />
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container peer-checked:bg-primary peer-checked:text-on-primary flex items-center justify-center shrink-0 transition-colors">
              <span className="material-symbols-outlined text-[22px]">broken_image</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-space-xs flex-wrap">
                <span className="font-label-md text-label-md text-on-surface">Avaria ou Dano no Produto</span>
                <span className="px-2 py-0.5 rounded-full bg-error text-on-error font-code-sm text-[10px] font-bold uppercase">Foto Obrigatória</span>
              </div>
              <span className="font-body-sm text-body-sm text-secondary mt-0.5">Embalagem rasgada, vazamento ou integridade violada</span>
            </div>
            <div className="absolute right-4 top-5 w-5 h-5 rounded-full bg-surface-container flex items-center justify-center peer-checked:bg-primary transition-colors">
              <div className="w-2 h-2 rounded-full bg-on-primary opacity-0 peer-checked:opacity-100" />
            </div>
          </label>
          {/* Option 5 */}
          <label className="reason-card relative flex items-start gap-space-md p-space-md rounded-DEFAULT bg-surface-container-lowest shadow-sm cursor-pointer transition-all active:scale-[0.99] group">
            <input className="sr-only peer" name="failure_reason" type="radio" defaultValue="area_risco" />
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container peer-checked:bg-primary peer-checked:text-on-primary flex items-center justify-center shrink-0 transition-colors">
              <span className="material-symbols-outlined text-[22px]">minor_crash</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0 pr-6">
              <span className="font-label-md text-label-md text-on-surface">Problema de Acesso / Risco</span>
              <span className="font-body-sm text-body-sm text-secondary mt-0.5">Bloqueio policial, via interditada ou restrição física do veículo</span>
            </div>
            <div className="absolute right-4 top-5 w-5 h-5 rounded-full bg-surface-container flex items-center justify-center peer-checked:bg-primary transition-colors">
              <div className="w-2 h-2 rounded-full bg-on-primary opacity-0 peer-checked:opacity-100" />
            </div>
          </label>
          {/* Option 6 */}
          <label className="reason-card relative flex items-start gap-space-md p-space-md rounded-DEFAULT bg-surface-container-lowest shadow-sm cursor-pointer transition-all active:scale-[0.99] group">
            <input className="sr-only peer" name="failure_reason" type="radio" defaultValue="outro_motivo" />
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container peer-checked:bg-primary peer-checked:text-on-primary flex items-center justify-center shrink-0 transition-colors">
              <span className="material-symbols-outlined text-[22px]">more_horiz</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0 pr-6">
              <span className="font-label-md text-label-md text-on-surface">Outro Motivo Operacional</span>
              <span className="font-body-sm text-body-sm text-secondary mt-0.5">Exige detalhamento obrigatório no campo de observações</span>
            </div>
            <div className="absolute right-4 top-5 w-5 h-5 rounded-full bg-surface-container flex items-center justify-center peer-checked:bg-primary transition-colors">
              <div className="w-2 h-2 rounded-full bg-on-primary opacity-0 peer-checked:opacity-100" />
            </div>
          </label>
        </div>
      </section>
      {/* Photographic Evidence Section */}
      <section className="flex flex-col w-full bg-surface-container-lowest rounded-DEFAULT p-space-md shadow-sm mb-space-md">
        <div className="flex items-center justify-between mb-space-sm">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[20px] text-primary">add_a_photo</span>
            <span className="font-label-md text-label-md text-on-surface">Evidência Fotográfica</span>
          </div>
          <span className="font-code-sm text-code-sm text-primary font-bold">GPS ATIVO</span>
        </div>
        {/* Evidence Cards Grid */}
        <div className="grid grid-cols-2 gap-space-sm mb-space-sm">
          {/* Photo Slot 1: Captured with Metadata */}
          <div className="relative flex flex-col rounded-DEFAULT overflow-hidden bg-surface-container shadow-inner aspect-[4/3] group">
            <img className="w-full h-full object-cover" data-alt="Close-up operational capture of a pharmacy metal security shutter closed during daytime business hours with official street number visible under bright outdoor sunlight" src="/screens/logotipo_rotapro_driver.png" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#131313]/90 via-transparent to-black/20 flex flex-col justify-between p-2 text-surface-container-lowest">
              <div className="flex items-center justify-between">
                <span className="px-1.5 py-0.5 rounded-full bg-primary font-code-sm text-[9px] font-bold">GEO OK</span>
                <button aria-label="Remover imagem" className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white" type="button">
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
              <div className="flex flex-col">
                <span className="font-code-sm text-[10px] text-primary-fixed truncate">-23.5505, -46.6333</span>
                <span className="font-code-sm text-[9px] text-surface-container-highest">HOJE • 14:32:10</span>
              </div>
            </div>
          </div>
          {/* Photo Slot 2: Add additional action trigger */}
          <button className="flex flex-col items-center justify-center rounded-DEFAULT bg-surface-container-low hover:bg-surface-container transition-colors aspect-[4/3] p-space-sm active:scale-95 text-center" type="button">
            <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-sm mb-1.5">
              <span className="material-symbols-outlined text-[22px]">photo_camera</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface">Adicionar Foto</span>
            <span className="font-body-sm text-[10px] text-secondary">Fachada ou avaria</span>
          </button>
        </div>
        <div className="flex items-center gap-space-xs text-secondary">
          <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
          <span className="font-body-sm text-body-sm text-[11px]">Carimbo temporal e coordenadas criptografadas na imagem.</span>
        </div>
      </section>
      {/* Prior Contact Protocol Log */}
      <section className="flex flex-col w-full bg-surface-container-lowest rounded-DEFAULT p-space-md shadow-sm mb-space-md">
        <div className="flex items-center justify-between mb-space-sm">
          <span className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Protocolo de Tentativas</span>
          <span className="font-label-sm text-label-sm text-primary flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Validado
          </span>
        </div>
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center justify-between p-space-sm rounded-DEFAULT bg-surface-container-low">
            <div className="flex items-center gap-space-sm">
              <div className="w-7 h-7 rounded-full bg-[#131313] text-surface-container-lowest flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px]">call</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface">Ligação ao Destinatário</span>
                <span className="font-body-sm text-body-sm text-[11px] text-secondary">2 tentativas (sem atendimento)</span>
              </div>
            </div>
            <span className="font-code-sm text-code-sm text-secondary">14:26 • 14:29</span>
          </div>
          <div className="flex items-center justify-between p-space-sm rounded-DEFAULT bg-surface-container-low">
            <div className="flex items-center gap-space-sm">
              <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px]">chat</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface">Mensagem WhatsApp RotaPro</span>
                <span className="font-body-sm text-body-sm text-[11px] text-secondary">Enviado com geolink</span>
              </div>
            </div>
            <span className="font-code-sm text-code-sm text-secondary">14:27</span>
          </div>
        </div>
      </section>
      {/* Driver Operational Notes */}
      <section className="flex flex-col w-full bg-surface-container-lowest rounded-DEFAULT p-space-md shadow-sm mb-space-md">
        <div className="flex items-center justify-between mb-space-xs">
          <label className="font-label-md text-label-md text-on-surface" htmlFor="occurrence-notes">Observações da Ocorrência</label>
          <span className="font-code-sm text-code-sm text-secondary" id="char-counter">54 / 300</span>
        </div>
        <div className="relative w-full">
          <textarea className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md rounded-DEFAULT p-space-md resize-none focus:outline-none focus:bg-surface-container transition-colors" id="occurrence-notes" maxLength="300" placeholder="Descreva os detalhes da tentativa de contato, nome do porteiro ou motivo específico..." rows="3" defaultValue={"Porta de aço fechada, vizinho do nº 142 informou almoço."} />
        </div>
      </section>
      {/* Action Controls */}
      <div className="flex flex-col gap-space-sm w-full mt-space-xs">
        {/* Critical Danger Pill Action Button */}
        <button className="w-full h-14 rounded-full bg-error text-on-error flex items-center justify-center gap-space-sm font-label-lg text-label-lg shadow-lg active:scale-95 transition-transform" id="btn-submit-failure" type="button">
          <span className="material-symbols-outlined text-[22px]">cancel</span>
          <span>Confirmar Falha da Entrega</span>
        </button>
        {/* Secondary Onyx Dismiss Button */}
        <button className="w-full h-12 rounded-full bg-[#131313] text-surface-container-lowest flex items-center justify-center gap-space-xs font-label-md text-label-md hover:bg-black active:scale-95 transition-transform" type="button">
          <span className="material-symbols-outlined text-[18px]">undo</span>
          <span>Cancelar e Retornar à Parada</span>
        </button>
      </div>
    </div>
  </main><nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#131313] shadow-[0_-4px_16px_rgba(0,0,0,0.22)]" data-active-classes="text-primary-container font-label-md"><div className="flex justify-around items-center h-[72px] px-space-xs"><a aria-current="page" className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] transition-colors group text-primary-container font-label-md" data-path="rota" href="#"><span className="material-symbols-outlined text-[24px]">local_shipping</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Rota</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></a><a className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" data-path="historico" href="#"><span className="material-symbols-outlined text-[24px]">history</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Histórico</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></a><a className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" data-path="recibos" href="#"><span className="material-symbols-outlined text-[24px]">receipt_long</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Recibos</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></a><a className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" data-path="perfil" href="#"><span className="material-symbols-outlined text-[24px]">account_circle</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Perfil</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></a></div></nav>
</div>
    </PageRuntime></ScreenFrame>
  );
}
