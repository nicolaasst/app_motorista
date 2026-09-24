import { useEffect } from 'react';
import ScreenFrame from '../lib/ScreenFrame.jsx';
import { Link } from 'react-router-dom';

export default function D2DetalheDoReciboComAssinatura() {
  useEffect(() => { document.title = 'RotaPro Driver'; }, []);
  return (
    <ScreenFrame screenId="d.2_detalhe_do_recibo_com_assinatura">
      <div>
  <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl pt-safe"><div className="h-16 px-margin flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="flex items-center gap-space-sm"><img alt="Logotipo RotaPro Driver" className="h-8 w-auto object-contain" src="/screens/logotipo_rotapro_driver.png" /><div className="flex flex-col"><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">RotaPro</span><span className="font-headline-sm text-headline-sm text-on-surface leading-tight">Rota</span></div></div><div className="flex items-center gap-space-sm"><button aria-label="Notificações" className="relative w-11 h-11 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"><span className="material-symbols-outlined text-[24px]">notifications</span><span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-container text-on-primary font-label-sm text-[10px] ring-2 ring-surface">3</span></button><div className="relative flex items-center justify-center"><img alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20" src="/screens/logotipo_rotapro_driver.png" /><span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary-container ring-1 ring-surface" /></div></div></div></header><main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface px-margin"><div className="flex flex-col w-full pb-32 space-y-space-md">
      {/* Topbar de Navegacao e Acoes */}
      <div className="flex items-center justify-between pt-1">
        <Link className="flex items-center gap-space-xs text-on-surface-variant hover:text-on-surface transition-colors py-2 active:scale-95" to="/recibos">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span className="font-label-md text-label-md">Voltar para Recibos</span>
        </Link>
        <div className="flex items-center gap-space-xs">
          <button aria-label="Compartilhar Recibo" className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface active:bg-surface-container-high transition-colors" id="btnShare">
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
          <button aria-label="Baixar PDF" className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface active:bg-surface-container-high transition-colors" id="btnPdf">
            <span className="material-symbols-outlined text-[20px]">download</span>
          </button>
        </div>
      </div>
      {/* Identificador Tecnico do Recibo */}
      <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Demonstrativo Quinzenal</span>
        <h1 className="font-code-lg text-code-lg text-on-surface font-bold">REC-2024-10-Q2</h1>
      </div>
      {/* Banner de Status com Aviso Operacional */}
      <div className="bg-surface-container-low rounded-DEFAULT p-space-md shadow-sm space-y-space-xs">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
            <span className="font-label-sm text-label-sm tracking-wide">Pendente de Assinatura Digital</span>
          </div>
          <span className="material-symbols-outlined text-primary-container text-[20px]">verified_user</span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant pt-1">
          Este documento precisa ser assinado até <strong className="text-on-surface font-label-md">04/11</strong> para liberação do pagamento em <strong className="text-primary-container font-label-md">05/11/2024</strong>.
        </p>
      </div>
      {/* Card Principal do Resumo Financeiro */}
      <div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm space-y-space-md">
        {/* Header do Motorista */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">Motorista Titular</span>
            <div className="font-headline-sm text-headline-sm text-on-surface">Lucas Silveira</div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-body-sm text-body-sm text-on-surface-variant">
              <span>CPF: ***.914.302-**</span>
              <span>•</span>
              <span>Matrícula <strong className="font-code-sm text-code-sm text-on-surface">#4821</strong></span>
            </div>
          </div>
          <div className="px-2.5 py-1.5 bg-surface-container-high rounded-DEFAULT text-center">
            <span className="font-code-sm text-code-sm font-bold text-on-surface block">BRA-2E19</span>
            <span className="font-label-sm text-[10px] text-secondary">Sprinter</span>
          </div>
        </div>
        {/* Periodo de Apuracao */}
        <div className="bg-surface-container-low rounded-DEFAULT p-space-sm flex items-center gap-space-sm">
          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-secondary">Período de Competência</span>
            <span className="font-body-md text-body-md font-semibold text-on-surface">16 de Outubro a 31 de Outubro de 2024</span>
          </div>
        </div>
        {/* Big Number: Valor Liquido */}
        <div className="rounded-DEFAULT bg-inverse-surface text-inverse-on-surface p-space-md flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <span className="material-symbols-outlined text-[100px]">payments</span>
          </div>
          <span className="font-label-sm text-label-sm text-secondary-fixed-dim uppercase tracking-wider">Valor Líquido a Receber</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-code-md text-code-md text-primary-fixed">R$</span>
            <span className="font-display-lg text-display-lg text-surface-bright tracking-tight font-extrabold">3.840,00</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-primary-fixed font-label-sm text-label-sm">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>Aprovado pela auditoria logística</span>
          </div>
        </div>
        {/* Domicilio Bancario */}
        <div className="pt-1 flex items-center justify-between text-body-sm text-on-surface-variant bg-surface-container-low p-space-sm rounded-DEFAULT">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">account_balance</span>
            <div>
              <span className="font-label-md text-label-md text-on-surface block">Banco Santander (033)</span>
              <span className="font-body-sm text-body-sm text-secondary">Ag: 3421 • Chave PIX (CPF cadastrado)</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[18px] text-secondary">lock</span>
        </div>
      </div>
      {/* Demonstrativo Discriminado de Valores */}
      <div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm space-y-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[22px]">format_list_bulleted</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Discriminação de Valores</h2>
          </div>
          <span className="font-label-sm text-label-sm text-secondary">Itemizado</span>
        </div>
        {/* Proventos */}
        <div className="space-y-space-sm">
          <div className="font-label-sm text-label-sm text-primary uppercase tracking-wider">Ganhos &amp; Diárias Operacionais</div>
          <div className="flex items-start justify-between py-1.5 bg-surface-container-low px-3 rounded-DEFAULT">
            <div className="space-y-0.5">
              <div className="font-body-md text-body-md font-semibold text-on-surface">14 Diárias Operacionais</div>
              <div className="font-code-sm text-code-sm text-secondary">14 x R$ 240,00/dia</div>
            </div>
            <span className="font-code-md text-code-md font-bold text-on-surface">R$ 3.360,00</span>
          </div>
          <div className="flex items-start justify-between py-1.5 bg-surface-container-low px-3 rounded-DEFAULT">
            <div className="space-y-0.5">
              <div className="font-body-md text-body-md font-semibold text-on-surface">Bônus Meta SLA de Pontualidade</div>
              <div className="font-body-sm text-body-sm text-secondary">98.2% de conformidade nas janelas</div>
            </div>
            <span className="font-code-md text-code-md font-bold text-primary">R$ 300,00</span>
          </div>
          <div className="flex items-start justify-between py-1.5 bg-surface-container-low px-3 rounded-DEFAULT">
            <div className="space-y-0.5">
              <div className="font-body-md text-body-md font-semibold text-on-surface">Ajuda de Custo Alimentação Extra</div>
              <div className="font-body-sm text-body-sm text-secondary">Extensão autorizada de jornada</div>
            </div>
            <span className="font-code-md text-code-md font-bold text-on-surface">R$ 280,00</span>
          </div>
          {/* Subtotal Bruto */}
          <div className="flex items-center justify-between px-3 py-2 bg-secondary-container rounded-DEFAULT mt-1">
            <span className="font-label-md text-label-md text-on-surface">Subtotal Bruto</span>
            <span className="font-code-md text-code-md font-bold text-on-surface">R$ 3.940,00</span>
          </div>
        </div>
        {/* Descontos */}
        <div className="space-y-space-sm pt-2">
          <div className="font-label-sm text-label-sm text-error uppercase tracking-wider">Descontos &amp; Retenções</div>
          <div className="flex items-start justify-between py-1.5 bg-error-container/40 px-3 rounded-DEFAULT">
            <div className="space-y-0.5">
              <div className="font-body-md text-body-md font-semibold text-on-surface">Adiantamento de Combustível / Vale</div>
              <div className="font-code-sm text-code-sm text-secondary">Posto Rota Sul - Cupom #77812</div>
            </div>
            <span className="font-code-md text-code-md font-bold text-error">- R$ 100,00</span>
          </div>
        </div>
        {/* Fechamento Liquido */}
        <div className="p-space-md bg-surface-container rounded-DEFAULT flex items-center justify-between">
          <div>
            <span className="font-label-sm text-label-sm text-secondary uppercase block">Total Líquido do Recibo</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Valor exato de depósito em conta</span>
          </div>
          <span className="font-code-lg text-code-lg font-bold text-primary-container">R$ 3.840,00</span>
        </div>
      </div>
      {/* Rastreabilidade de Rotas Vinculadas (Expansivel) */}
      <div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm space-y-space-sm">
        <div className="flex items-center justify-between cursor-pointer select-none" id="toggleRotasBtn">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">local_shipping</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Rotas Vinculadas</h3>
            <span className="px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface font-bold">14 rotas</span>
          </div>
          <span className="material-symbols-outlined text-secondary transition-transform duration-200" id="rotasChevron">expand_more</span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Romaneios executados sem extravio com canhoto digital conferido.
        </p>
        {/* Lista de Romaneios */}
        <div className="space-y-2 pt-2" id="rotasContainer">
          <div className="p-2.5 bg-surface-container-low rounded-DEFAULT flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-code-sm text-code-sm font-bold text-on-surface">ROM-2024-88412</span>
              <span className="font-body-sm text-body-sm text-secondary">31/10 • 34 paradas concluídas</span>
            </div>
            <span className="font-label-sm text-label-sm text-primary font-bold">100% SLA</span>
          </div>
          <div className="p-2.5 bg-surface-container-low rounded-DEFAULT flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-code-sm text-code-sm font-bold text-on-surface">ROM-2024-88390</span>
              <span className="font-body-sm text-body-sm text-secondary">30/10 • 28 paradas concluídas</span>
            </div>
            <span className="font-label-sm text-label-sm text-primary font-bold">98% SLA</span>
          </div>
          <div className="p-2.5 bg-surface-container-low rounded-DEFAULT flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-code-sm text-code-sm font-bold text-on-surface">ROM-2024-88210</span>
              <span className="font-body-sm text-body-sm text-secondary">29/10 • 41 paradas concluídas</span>
            </div>
            <span className="font-label-sm text-label-sm text-primary font-bold">97% SLA</span>
          </div>
          <div className="text-center pt-1">
            <span className="font-body-sm text-body-sm text-secondary">+ 11 rotas anteriores validadas no sistema</span>
          </div>
        </div>
      </div>
      {/* Secao Interativa de Assinatura Digital do Motorista */}
      <div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm space-y-space-md">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-[22px]">draw</span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Termo de Aceite &amp; Assinatura</h3>
        </div>
        {/* Texto Juridico de Aceite */}
        <div className="p-space-sm bg-surface-container-low rounded-DEFAULT">
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            “Declaro para os devidos fins que conferi o demonstrativo de serviços prestados e diárias operacionais executadas, concordando integralmente com os valores descritos acima.”
          </p>
        </div>
        {/* Area do Canvas para Assinatura Tátil */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-secondary">Assine no quadro abaixo usando o dedo:</span>
            <button className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary hover:text-error transition-colors px-2 py-1 rounded-DEFAULT active:scale-95" id="clearSignatureBtn" type="button">
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Limpar</span>
            </button>
          </div>
          <div className="relative w-full h-44 bg-surface-container-low rounded-DEFAULT overflow-hidden shadow-inner flex flex-col justify-between p-3">
            {/* Canvas Real */}
            <canvas className="absolute inset-0 w-full h-full cursor-crosshair z-10 touch-none" id="signaturePad" />
            {/* Marcador Visual de Apoio */}
            <div className="flex justify-between items-center text-secondary/40 font-code-sm text-[11px] pointer-events-none z-0">
              <span>CANVAS CRIPTOGRAFADO</span>
              <span>SHA-256 DIGITAL ID</span>
            </div>
            <div className="w-full pointer-events-none z-0 pb-1">
              <div className="w-full h-0.5 bg-secondary-fixed-dim/60 mb-1" />
              <div className="flex justify-between items-center text-secondary/60 font-body-sm text-[11px]">
                <span>Linha de Assinatura do Titular</span>
                <span className="font-code-sm text-[10px]" id="geoTimestamp">GPS: -23.5505, -46.6333 • 31/10/24</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-on-surface-variant font-code-sm text-code-sm">
            <span className="material-symbols-outlined text-[14px] text-primary">fingerprint</span>
            <span>Carimbo de data, IP e geolocalização serão anexados ao PDF.</span>
          </div>
        </div>
        {/* Checkbox de Aceite Legal */}
        <label className="flex items-start gap-3 pt-2 cursor-pointer select-none">
          <input className="mt-0.5 w-5 h-5 rounded accent-primary text-on-primary focus:ring-0 cursor-pointer" id="acceptCheckbox" type="checkbox" />
          <span className="font-body-sm text-body-sm text-on-surface">
            Li, conferi os valores das diárias e concordo integralmente com os termos de prestação de serviços logísticos.
          </span>
        </label>
      </div>
      {/* Acoes Principais Fixas / Acionamento Operacional */}
      <div className="space-y-space-sm pt-2">
        {/* Botao Primario Pill em Vivid Green */}
        <button className="w-full h-14 rounded-full bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,176,0,0.35)] active:scale-[0.98] transition-all disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none" disabled id="btnSignSubmit" type="button">
          <span className="material-symbols-outlined text-[24px]">verified</span>
          <span>Confirmar e Assinar Recibo</span>
        </button>
        {/* Botao Secundario para Contestar com o Financeiro */}
        <button className="w-full h-12 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all" id="btnDispute" type="button">
          <span className="material-symbols-outlined text-[20px] text-secondary">support_agent</span>
          <span>Contestar Valores com o Financeiro</span>
        </button>
      </div>
      {/* Toast Notificacao Dinamico (Oculto por Padrao) */}
      <div className="fixed bottom-24 left-4 right-4 z-50 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-full shadow-lg flex items-center justify-between transition-all duration-300 transform translate-y-20 opacity-0 pointer-events-none" id="toastNotification">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-fixed text-[22px]">task_alt</span>
          <span className="font-label-md text-label-md" id="toastMessage">Recibo assinado com sucesso!</span>
        </div>
        <span className="material-symbols-outlined text-secondary text-[18px]">close</span>
      </div>
    </div>
  </main><nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#131313] shadow-[0_-4px_16px_rgba(0,0,0,0.22)]" data-active-classes="text-primary-container font-label-md"><div className="flex justify-around items-center h-[72px] px-space-xs"><Link aria-current="page" className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] transition-colors group text-primary-container font-label-md" to="/rota"><span className="material-symbols-outlined text-[24px]">local_shipping</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Rota</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></Link><Link className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" to="/historico"><span className="material-symbols-outlined text-[24px]">history</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Histórico</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></Link><Link className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" to="/recibos"><span className="material-symbols-outlined text-[24px]">receipt_long</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Recibos</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></Link><Link className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" to="/perfil"><span className="material-symbols-outlined text-[24px]">account_circle</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Perfil</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></Link></div></nav>
</div>
    </ScreenFrame>
  );
}
