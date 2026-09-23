import { useEffect } from 'react';
import ScreenFrame from '../lib/ScreenFrame.jsx';
import PageRuntime from '../lib/PageRuntime.jsx';

export default function A3ChecklistDoVeCulo() {
  useEffect(() => { document.title = 'RotaPro Driver'; }, []);
  return (
    <ScreenFrame screenId="a.3_checklist_do_ve_culo"><PageRuntime screenId="a.3_checklist_do_ve_culo">
      <div>
  <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl pt-safe"><div className="h-16 px-margin flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="flex items-center gap-space-sm"><img alt="Logotipo RotaPro Driver" className="h-8 w-auto object-contain" src="/screens/logotipo_rotapro_driver.png" /><div className="flex flex-col"><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">RotaPro</span><span className="font-headline-sm text-headline-sm text-on-surface leading-tight">Rota</span></div></div><div className="flex items-center gap-space-sm"><button aria-label="Notificações" className="relative w-11 h-11 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"><span className="material-symbols-outlined text-[24px]">notifications</span><span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-container text-on-primary font-label-sm text-[10px] ring-2 ring-surface">3</span></button><div className="relative flex items-center justify-center"><img alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20" src="/screens/logotipo_rotapro_driver.png" /><span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary-container ring-1 ring-surface" /></div></div></div></header><main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface px-margin"><div className="flex flex-col w-full pb-10 space-y-space-md">
      {/* Header Context / Guidance */}
      <div className="flex flex-col space-y-space-xs pt-space-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-space-xs">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-container/15 text-primary">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </span>
            <span className="font-headline-md text-headline-md text-on-surface">Checklist Pré-Operacional</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm shadow-sm">
            <span className="w-2 h-2 rounded-full bg-tertiary-container animate-pulse" />
            Etapa 1 de 2
          </span>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant pl-9">
          Inspeção obrigatória de segurança antes de assumir a direção.
        </p>
      </div>
      {/* Vehicle Identification Card */}
      <div className="relative bg-surface-container-lowest rounded-DEFAULT p-space-md shadow-sm overflow-hidden flex flex-col space-y-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-space-xs">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">local_shipping</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Veículo Alocado</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-tertiary-container/20 text-on-tertiary-container">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" />
            <span className="font-label-sm text-label-sm">Liberado p/ inspeção</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="font-code-lg text-code-lg text-on-surface tracking-wider">BRA-2E19</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">Mercedes-Benz Sprinter 415 CDI • Furgão Longo</span>
        </div>
        <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
          <div className="bg-surface-container-low rounded-DEFAULT p-space-sm flex items-center space-x-space-xs">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">airline_seat_recline_normal</span>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Motorista</span>
              <span className="font-label-md text-label-md text-on-surface truncate">Carlos Eduardo M.</span>
            </div>
          </div>
          <div className="bg-surface-container-low rounded-DEFAULT p-space-sm flex items-center space-x-space-xs">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">schedule</span>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Turno</span>
              <span className="font-label-md text-label-md text-on-surface truncate">Matutino (06h - 15h)</span>
            </div>
          </div>
        </div>
      </div>
      {/* Initial Odometer Input Card */}
      <div className="bg-surface-container-lowest rounded-DEFAULT p-space-md shadow-sm flex flex-col space-y-space-sm">
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-space-xs font-label-md text-label-md text-on-surface" htmlFor="odometer-input">
            <span className="material-symbols-outlined text-primary text-[20px]">speed</span>
            <span>Quilometragem Inicial (KM)</span>
          </label>
          <span className="font-body-sm text-body-sm text-on-surface-variant">Último: 142.812 km</span>
        </div>
        <div className="flex items-center gap-space-sm">
          <div className="flex-1 relative bg-surface-container-low rounded-full px-space-md py-3 flex items-center shadow-inner">
            <input className="w-full bg-transparent font-code-lg text-code-lg text-on-surface outline-none tracking-wider" id="odometer-input" inputMode="numeric" placeholder="000.000" type="text" defaultValue="142.850" />
            <span className="font-code-md text-code-md text-on-surface-variant pl-2">km</span>
          </div>
          <button className="h-12 px-space-md rounded-full bg-secondary-container text-on-secondary-container hover:bg-surface-container-highest transition-all active:scale-95 flex items-center justify-center space-x-1 font-label-md text-label-md" id="btn-photo-odometer" type="button">
            <span className="material-symbols-outlined text-[20px]">photo_camera</span>
            <span className="whitespace-nowrap">Fotografar</span>
          </button>
        </div>
      </div>
      {/* Inspection Criteria Section */}
      <div className="flex flex-col space-y-space-xs">
        <div className="flex items-center justify-between px-space-xs">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Itens de Verificação</span>
          <span className="font-label-sm text-label-sm text-primary font-bold" id="checklist-counter">5 de 5 conformes</span>
        </div>
        {/* Check item 1: Pneus e Calibragem */}
        <div className="bg-surface-container-lowest rounded-DEFAULT p-space-md shadow-sm flex flex-col space-y-space-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-space-xs">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-high text-on-surface">
                <span className="material-symbols-outlined text-[18px]">tire_repair</span>
              </span>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface">1. Pneus e Calibragem</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Sem desgaste excessivo / calibrados</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-space-sm pt-space-xs" data-toggle-group="item-1">
            <button className="btn-toggle-sim h-11 rounded-full flex items-center justify-center space-x-1.5 font-label-md text-label-md bg-primary-container text-on-primary shadow-sm transition-transform active:scale-95" type="button">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Sim</span>
            </button>
            <button className="btn-toggle-nao h-11 rounded-full flex items-center justify-center space-x-1.5 font-label-md text-label-md bg-surface-container-low text-on-surface-variant transition-transform active:scale-95" type="button">
              <span className="material-symbols-outlined text-[18px]">cancel</span>
              <span>Não</span>
            </button>
          </div>
        </div>
        {/* Check item 2: Luzes, Faróis e Setas */}
        <div className="bg-surface-container-lowest rounded-DEFAULT p-space-md shadow-sm flex flex-col space-y-space-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-space-xs">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-high text-on-surface">
                <span className="material-symbols-outlined text-[18px]">highlight</span>
              </span>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface">2. Luzes, Faróis e Setas</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Funcionamento pleno de iluminação</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-space-sm pt-space-xs" data-toggle-group="item-2">
            <button className="btn-toggle-sim h-11 rounded-full flex items-center justify-center space-x-1.5 font-label-md text-label-md bg-primary-container text-on-primary shadow-sm transition-transform active:scale-95" type="button">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Sim</span>
            </button>
            <button className="btn-toggle-nao h-11 rounded-full flex items-center justify-center space-x-1.5 font-label-md text-label-md bg-surface-container-low text-on-surface-variant transition-transform active:scale-95" type="button">
              <span className="material-symbols-outlined text-[18px]">cancel</span>
              <span>Não</span>
            </button>
          </div>
        </div>
        {/* Check item 3: Nível de Óleo e Combustível */}
        <div className="bg-surface-container-lowest rounded-DEFAULT p-space-md shadow-sm flex flex-col space-y-space-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-space-xs">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-high text-on-surface">
                <span className="material-symbols-outlined text-[18px]">oil_barrel</span>
              </span>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface">3. Nível de Óleo e Combustível</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Fluidos verificados e tanque acima de 50%</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-space-sm pt-space-xs" data-toggle-group="item-3">
            <button className="btn-toggle-sim h-11 rounded-full flex items-center justify-center space-x-1.5 font-label-md text-label-md bg-primary-container text-on-primary shadow-sm transition-transform active:scale-95" type="button">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Sim</span>
            </button>
            <button className="btn-toggle-nao h-11 rounded-full flex items-center justify-center space-x-1.5 font-label-md text-label-md bg-surface-container-low text-on-surface-variant transition-transform active:scale-95" type="button">
              <span className="material-symbols-outlined text-[18px]">cancel</span>
              <span>Não</span>
            </button>
          </div>
        </div>
        {/* Check item 4: Documentação e CRLV-e */}
        <div className="bg-surface-container-lowest rounded-DEFAULT p-space-md shadow-sm flex flex-col space-y-space-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-space-xs">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-high text-on-surface">
                <span className="material-symbols-outlined text-[18px]">badge</span>
              </span>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface">4. Documentação e CRLV-e</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Porte obrigatório físico ou digital em dia</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-space-sm pt-space-xs" data-toggle-group="item-4">
            <button className="btn-toggle-sim h-11 rounded-full flex items-center justify-center space-x-1.5 font-label-md text-label-md bg-primary-container text-on-primary shadow-sm transition-transform active:scale-95" type="button">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Sim</span>
            </button>
            <button className="btn-toggle-nao h-11 rounded-full flex items-center justify-center space-x-1.5 font-label-md text-label-md bg-surface-container-low text-on-surface-variant transition-transform active:scale-95" type="button">
              <span className="material-symbols-outlined text-[18px]">cancel</span>
              <span>Não</span>
            </button>
          </div>
        </div>
        {/* Check item 5: Lataria e Avarias Externas */}
        <div className="bg-surface-container-lowest rounded-DEFAULT p-space-md shadow-sm flex flex-col space-y-space-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-space-xs">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-high text-on-surface">
                <span className="material-symbols-outlined text-[18px]">directions_car</span>
              </span>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface">5. Lataria e Avarias Externas</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Sem riscos profundos, batidas ou mossas</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-space-sm pt-space-xs" data-toggle-group="item-5">
            <button className="btn-toggle-sim h-11 rounded-full flex items-center justify-center space-x-1.5 font-label-md text-label-md bg-primary-container text-on-primary shadow-sm transition-transform active:scale-95" type="button">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Sim</span>
            </button>
            <button className="btn-toggle-nao h-11 rounded-full flex items-center justify-center space-x-1.5 font-label-md text-label-md bg-surface-container-low text-on-surface-variant transition-transform active:scale-95" type="button">
              <span className="material-symbols-outlined text-[18px]">cancel</span>
              <span>Não</span>
            </button>
          </div>
          {/* Warning note for Item 5 */}
          <div className="hidden flex items-start space-x-space-xs p-space-sm bg-error-container/40 text-on-error-container rounded-DEFAULT transition-all" id="avaria-alert">
            <span className="material-symbols-outlined text-error text-[20px] flex-shrink-0">warning</span>
            <span className="font-body-sm text-body-sm">Se marcado Não, anexar foto da avaria obrigatoriamente logo abaixo.</span>
          </div>
        </div>
      </div>
      {/* Evidence Photo Upload Slot */}
      <div className="bg-surface-container-lowest rounded-DEFAULT p-space-md shadow-sm flex flex-col space-y-space-sm">
        <div className="flex items-center justify-between">
          <span className="font-label-md text-label-md text-on-surface flex items-center space-x-1.5">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">add_a_photo</span>
            <span>Foto de Evidência</span>
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant" id="foto-requirement-badge">Opcional</span>
        </div>
        {/* Interactive Photo Area */}
        <div className="w-full h-32 rounded-DEFAULT bg-surface-container-low flex flex-col items-center justify-center p-space-sm text-center cursor-pointer hover:bg-surface-container transition-colors active:scale-[0.99]" id="photo-upload-slot">
          <div className="w-12 h-12 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm text-primary mb-2">
            <span className="material-symbols-outlined text-[26px]">photo_camera</span>
          </div>
          <span className="font-label-md text-label-md text-on-surface">Adicionar foto de inspeção</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">Toque para abrir a câmera ou galeria</span>
        </div>
        {/* Photo Preview Thumbnail Container (Hidden by default) */}
        <div className="hidden flex items-center justify-between p-space-xs bg-surface-container-low rounded-DEFAULT" id="photo-preview-container">
          <div className="flex items-center space-x-space-sm">
            <img className="w-14 h-14 object-cover rounded-DEFAULT" data-alt="Close up photo of white utility cargo delivery van front bumper with slight road dust and clean clear headlights taken under daylight" id="photo-preview-img" src="/screens/logotipo_rotapro_driver.png" />
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface">evidencia_01.jpg</span>
              <span className="font-code-sm text-code-sm text-on-surface-variant">1.4 MB • 06:42 AM</span>
            </div>
          </div>
          <button className="w-9 h-9 rounded-full bg-surface-container-lowest flex items-center justify-center text-error hover:bg-error-container/20 transition-colors" id="btn-remove-photo" type="button">
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      </div>
      {/* Legal Compliance Disclaimer Card */}
      <div className="bg-surface-container rounded-DEFAULT p-space-md flex items-start space-x-space-sm">
        <span className="material-symbols-outlined text-on-surface-variant text-[22px] flex-shrink-0">gavel</span>
        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
          Ao iniciar o turno, você atesta a conformidade das condições do veículo conforme normas vigentes do Código de Trânsito Brasileiro e diretrizes operacionais de transporte seguro.
        </p>
      </div>
      {/* Bottom CTA Container */}
      <div className="pt-space-xs">
        <button className="w-full h-[54px] rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg shadow-lg shadow-primary-container/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] hover:bg-primary" id="btn-iniciar-turno" type="button">
          <span>Iniciar Turno e Carregar Rotas</span>
          <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
        </button>
      </div>
    </div>
  </main><nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#131313] shadow-[0_-4px_16px_rgba(0,0,0,0.22)]" data-active-classes="text-primary-container font-label-md"><div className="flex justify-around items-center h-[72px] px-space-xs"><a aria-current="page" className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] transition-colors group text-primary-container font-label-md" data-path="rota" href="#"><span className="material-symbols-outlined text-[24px]">local_shipping</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Rota</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></a><a className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" data-path="historico" href="#"><span className="material-symbols-outlined text-[24px]">history</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Histórico</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></a><a className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" data-path="recibos" href="#"><span className="material-symbols-outlined text-[24px]">receipt_long</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Recibos</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></a><a className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" data-path="perfil" href="#"><span className="material-symbols-outlined text-[24px]">account_circle</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Perfil</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></a></div></nav>
</div>
    </PageRuntime></ScreenFrame>
  );
}
