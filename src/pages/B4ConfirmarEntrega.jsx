import { useEffect } from 'react';
import ScreenFrame from '../lib/ScreenFrame.jsx';
import PageRuntime from '../lib/PageRuntime.jsx';

export default function B4ConfirmarEntrega() {
  useEffect(() => { document.title = 'RotaPro Driver'; }, []);
  return (
    <ScreenFrame screenId="b.4_confirmar_entrega"><PageRuntime screenId="b.4_confirmar_entrega">
      <div>
  <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl pt-safe"><div className="h-16 px-margin flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="flex items-center gap-space-sm"><img alt="Logotipo RotaPro Driver" className="h-8 w-auto object-contain" src="/screens/logotipo_rotapro_driver.png" /><div className="flex flex-col"><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">RotaPro</span><span className="font-headline-sm text-headline-sm text-on-surface leading-tight">Rota</span></div></div><div className="flex items-center gap-space-sm"><button aria-label="Notificações" className="relative w-11 h-11 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"><span className="material-symbols-outlined text-[24px]">notifications</span><span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-container text-on-primary font-label-sm text-[10px] ring-2 ring-surface">3</span></button><div className="relative flex items-center justify-center"><img alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20" src="/screens/logotipo_rotapro_driver.png" /><span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary-container ring-1 ring-surface" /></div></div></div></header><main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface px-margin"><div className="flex flex-col w-full pb-8">
      {/* Sub-Header da Parada */}
      <div className="flex items-center justify-between mb-4 pt-1">
        <div className="flex items-center gap-3">
          <button aria-label="Voltar para detalhe da parada" className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center text-on-surface active:scale-95 transition-transform shadow-sm" type="button">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-headline-md text-headline-md text-on-surface">Confirmar Entrega</span>
            </div>
            <span className="font-body-sm text-body-sm text-secondary">Parada #05 • Farmácia Santa Clara Ltda</span>
          </div>
        </div>
        <div className="bg-inverse-surface text-surface-container-lowest px-3 py-1.5 rounded-full shadow-sm">
          <span className="font-code-md text-code-md tracking-wider">NF-e 89122</span>
        </div>
      </div>
      {/* Stepper de Fluxo Ágil (Pill Tabs) */}
      <div className="grid grid-cols-2 gap-2 bg-surface-container p-1 rounded-full mb-5 shadow-sm">
        <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-full bg-surface-container-lowest shadow-sm">
          <span className="w-5 h-5 rounded-full bg-primary-container text-on-primary font-code-sm text-code-sm flex items-center justify-center">1</span>
          <span className="font-label-sm text-label-sm text-on-surface">Assinatura Digital</span>
          <span className="material-symbols-outlined text-primary text-[16px]">check_circle</span>
        </div>
        <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-full bg-surface-container-lowest shadow-sm">
          <span className="w-5 h-5 rounded-full bg-primary-container text-on-primary font-code-sm text-code-sm flex items-center justify-center">2</span>
          <span className="font-label-sm text-label-sm text-on-surface">Foto Comprovante</span>
          <span className="material-symbols-outlined text-primary text-[16px]">check_circle</span>
        </div>
      </div>
      {/* Bloco 1: Identificação do Recebedor */}
      <div className="bg-surface-container-lowest rounded-[20px] p-5 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">badge</span>
            </div>
            <h2 className="font-label-lg text-label-lg text-on-surface">Identificação do Recebedor</h2>
          </div>
          <span className="font-label-sm text-label-sm text-primary uppercase tracking-wide bg-surface-container-low px-2.5 py-1 rounded-full">Obrigatório</span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block font-label-sm text-label-sm text-secondary mb-1.5">Nome Completo de Quem Recebeu</label>
            <div className="flex items-center bg-surface-container-low rounded-full px-4 h-13 shadow-inner">
              <span className="material-symbols-outlined text-secondary mr-2.5 text-[20px]">person</span>
              <input className="w-full bg-transparent font-body-lg text-body-lg text-on-surface focus:outline-none" placeholder="Nome do recebedor" type="text" defaultValue="Roberto Silveira" />
            </div>
          </div>
          <div>
            <label className="block font-label-sm text-label-sm text-secondary mb-1.5">RG ou CPF do Recebedor</label>
            <div className="flex items-center bg-surface-container-low rounded-full px-4 h-13 shadow-inner">
              <span className="material-symbols-outlined text-secondary mr-2.5 text-[20px]">fingerprint</span>
              <input className="w-full bg-transparent font-code-md text-code-md text-on-surface focus:outline-none tracking-wide" placeholder="00.000.000-0" type="text" defaultValue="28.914.302-8" />
            </div>
          </div>
          <div className="pt-1">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-on-primary shadow-sm">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </div>
              <span className="font-body-md text-body-md text-on-surface">Recebedor é o titular ou responsável legal</span>
            </label>
          </div>
        </div>
      </div>
      {/* Bloco 2: Canvas de Assinatura Digital na Tela */}
      <div className="bg-surface-container-lowest rounded-[20px] p-5 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">draw</span>
            </div>
            <h2 className="font-label-lg text-label-lg text-on-surface">Assinatura no Vidro</h2>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="font-label-sm text-label-sm text-on-surface-variant">Biometria Ativa</span>
          </div>
        </div>
        {/* Área de Captura com Traço Realista */}
        <div className="relative w-full h-44 bg-surface-container-low rounded-[20px] p-4 flex flex-col justify-between overflow-hidden shadow-inner">
          {/* Traço de Assinatura Renderizado em SVG */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
            <svg className="w-full h-full text-inverse-surface opacity-95" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 320 120">
              <path d="M 28 85 C 50 20, 68 15, 78 50 C 85 75, 95 85, 110 80 C 130 70, 125 35, 142 42 C 158 50, 160 88, 178 78 C 190 70, 205 65, 220 72 C 245 84, 275 60, 292 68" />
              <path d="M 60 70 Q 130 92 230 75" strokeWidth="2" />
              <path d="M 145 60 L 165 35" strokeWidth="2.2" />
            </svg>
          </div>
          {/* Top Tools Bar */}
          <div className="flex items-center justify-between z-10">
            <span className="font-code-sm text-code-sm text-secondary tracking-tight">LAT: -23.5505 | LNG: -46.6333</span>
            <button className="flex items-center gap-1 bg-surface-container-lowest px-3 py-1.5 rounded-full shadow-sm text-error hover:bg-error-container active:scale-95 transition-all" type="button">
              <span className="material-symbols-outlined text-[16px]">ink_eraser</span>
              <span className="font-label-sm text-label-sm">Limpar</span>
            </button>
          </div>
          {/* Base Guide Line */}
          <div className="z-10 flex flex-col items-center">
            <div className="w-full h-[1.5px] bg-secondary/30 mb-2" />
            <div className="flex items-center gap-1.5 text-secondary">
              <span className="material-symbols-outlined text-[14px]">edit</span>
              <span className="font-label-sm text-label-sm">Assine com o dedo ou caneta stylus sobre a linha</span>
            </div>
          </div>
        </div>
      </div>
      {/* Bloco 3: Evidência Fotográfica do Pacote / Canhoto */}
      <div className="bg-surface-container-lowest rounded-[20px] p-5 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            </div>
            <h2 className="font-label-lg text-label-lg text-on-surface">Comprovante Fotográfico</h2>
          </div>
          <span className="font-code-md text-code-md text-primary bg-surface-container px-2.5 py-0.5 rounded-full">1/1</span>
        </div>
        {/* Preview da Foto com Overlay Informativo */}
        <div className="relative w-full h-52 rounded-[20px] overflow-hidden shadow-sm mb-3">
          <img className="w-full h-full object-cover" data-alt="Close up photograph of a neatly delivered pharmaceutical supply cardboard box on a pharmacy reception counter, featuring visible delivery invoice NF-e paper with official stamp signature, clear natural commercial lighting, realistic logistics driver operational photography, vibrant soft green highlights, high visual clarity" src="/screens/logotipo_rotapro_driver.png" />
          {/* Badges sobrepostas na imagem */}
          <div className="absolute top-3 left-3 bg-inverse-surface/85 backdrop-blur-md px-3 py-1 rounded-full text-surface flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-tertiary-fixed" />
            <span className="font-label-sm text-label-sm">Foto 1 de 1 anexada</span>
          </div>
          <div className="absolute bottom-3 inset-x-3 bg-inverse-surface/80 backdrop-blur-md rounded-xl p-2.5 flex items-center justify-between text-surface">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-fixed text-[18px]">verified</span>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-surface leading-tight">Canhoto conferido</span>
                <span className="font-code-sm text-code-sm text-secondary-fixed-dim">14:22:18 • Geo-validado</span>
              </div>
            </div>
            <button className="bg-surface-container-lowest text-on-surface px-3 py-1 rounded-full font-label-sm text-label-sm shadow-sm active:scale-95 transition-transform flex items-center gap-1" type="button">
              <span className="material-symbols-outlined text-[14px]">refresh</span>
              Refazer
            </button>
          </div>
        </div>
        {/* Ação Secundária: Adicionar mais fotos */}
        <button className="w-full py-3 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center gap-2 font-label-md text-label-md active:scale-98 transition-all" type="button">
          <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
          Adicionar Outra Foto (Opcional)
        </button>
      </div>
      {/* Bloco 4: Campo Opcional de Observações */}
      <div className="bg-surface-container-lowest rounded-[20px] p-5 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="font-label-md text-label-md text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px]">notes</span>
            Observações da Entrega
          </label>
          <span className="font-body-sm text-body-sm text-secondary">Opcional</span>
        </div>
        <div className="bg-surface-container-low rounded-[16px] p-3 shadow-inner">
          <textarea className="w-full bg-transparent font-body-md text-body-md text-on-surface focus:outline-none resize-none" placeholder="Ex: Entregue na recepção central, conferido com o responsável..." rows="2" defaultValue={"Entregue na recepção central, conferido e testado na presença do responsável."} />
        </div>
      </div>
      {/* Bloco Operacional de Confirmação e Transmissão */}
      <div className="flex flex-col gap-3">
        <button className="w-full h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center gap-3 font-label-lg text-label-lg shadow-lg shadow-primary/25 active:bg-primary active:scale-[0.99] transition-all" type="button">
          <span className="material-symbols-outlined text-[24px]">task_alt</span>
          <span>Concluir e Transmitir Entrega</span>
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
        <div className="flex items-center justify-center gap-2 text-secondary">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-container" />
          </span>
          <span className="font-label-sm text-label-sm">Sincronização imediata em nuvem ativa</span>
        </div>
      </div>
    </div></main><nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#131313] shadow-[0_-4px_16px_rgba(0,0,0,0.22)]" data-active-classes="text-primary-container font-label-md"><div className="flex justify-around items-center h-[72px] px-space-xs"><a aria-current="page" className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] transition-colors group text-primary-container font-label-md" data-path="rota" href="#"><span className="material-symbols-outlined text-[24px]">local_shipping</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Rota</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></a><a className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" data-path="historico" href="#"><span className="material-symbols-outlined text-[24px]">history</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Histórico</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></a><a className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" data-path="recibos" href="#"><span className="material-symbols-outlined text-[24px]">receipt_long</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Recibos</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></a><a className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" data-path="perfil" href="#"><span className="material-symbols-outlined text-[24px]">account_circle</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Perfil</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></a></div></nav>
</div>
    </PageRuntime></ScreenFrame>
  );
}
