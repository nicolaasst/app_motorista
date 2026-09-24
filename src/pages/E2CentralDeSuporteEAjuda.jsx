import { useEffect, useState } from 'react';
import ScreenFrame from '../lib/ScreenFrame.jsx';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

const TICKET_CATEGORIES = ['Pagamento / Recibo', 'Mecânica / Pneu', 'Coleta / NF-e', 'App / Sincronismo'];

export default function E2CentralDeSuporteEAjuda() {
  const { createTicket, showToast } = useApp();
  const [openFaq, setOpenFaq] = useState(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [category, setCategory] = useState(TICKET_CATEGORIES[0]);
  const [description, setDescription] = useState('');

  const handleSubmitTicket = async () => {
    if (!description.trim()) {
      showToast('Descreva o ocorrido para abrir o chamado.', 'warning');
      return;
    }
    await createTicket({ category, description: description.trim() });
    setTicketModalOpen(false);
    setDescription('');
  };

  useEffect(() => { document.title = 'RotaPro Driver'; }, []);
  return (
    <ScreenFrame screenId="e.2_central_de_suporte_e_ajuda">
      <div>
  <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl pt-safe"><div className="h-16 px-margin flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="flex items-center gap-space-sm"><Link aria-label="Voltar para o Perfil" className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 transition-all" to="/perfil"><span className="material-symbols-outlined text-[24px]">arrow_back</span></Link><div className="flex flex-col"><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">RotaPro</span><span className="font-headline-sm text-headline-sm text-on-surface leading-tight">Suporte</span></div></div><div className="flex items-center gap-space-sm"><button aria-label="Notificações" className="relative w-11 h-11 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"><span className="material-symbols-outlined text-[24px]">notifications</span><span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-container text-on-primary font-label-sm text-[10px] ring-2 ring-surface">3</span></button><div className="relative flex items-center justify-center"><img alt="Lucas Silveira" className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20" src="/screens/logotipo_rotapro_driver.png" /><span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary-container ring-1 ring-surface" /></div></div></div></header><main className="flex-1 flex flex-col relative w-full pt-16 pb-safe bg-surface px-margin"><div className="flex flex-col w-full pb-10 space-y-space-md">
      {/* Sub-Header Status Monitor Badge */}
      <div className="flex items-center justify-between bg-surface-container-low px-4 py-3 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-container" />
          </span>
          <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider">Torre Operacional • 24/7 Ativa</span>
        </div>
        <span className="font-code-sm text-code-sm text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded-full">
          Fila: 0 min
        </span>
      </div>
      {/* Priority Emergency Dispatch Card (Onyx Background) */}
      <div className="bg-inverse-surface text-inverse-on-surface p-5 rounded-lg shadow-md relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary-container/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-fixed shrink-0">
            <span className="material-symbols-outlined text-[24px]">crisis_alert</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm text-inverse-on-surface">Ocorrência ou Emergência?</h2>
            <p className="font-body-sm text-body-sm text-secondary-fixed-dim mt-0.5">Contato imediato para incidentes viários, avarias críticas ou sinistros na rota.</p>
          </div>
        </div>
        {/* Rapid Glove Action Triggers */}
        <div className="grid grid-cols-1 gap-2.5 pt-1">
          <a className="flex items-center justify-center gap-2.5 w-full h-14 rounded-full bg-error text-on-error font-label-lg text-label-lg shadow-md active:scale-[0.98] transition-all" href="tel:08007729000">
            <span className="material-symbols-outlined text-[24px]">phone_in_talk</span>
            <span>Acionar Torre de Tráfego</span>
          </a>
          <a className="flex items-center justify-center gap-2.5 w-full h-14 rounded-full bg-surface-container-lowest text-inverse-surface font-label-lg text-label-lg shadow-sm active:scale-[0.98] transition-all" href="https://wa.me/5511999990000?text=Ol%C3%A1,%20preciso%20de%20suporte%20imediato%20na%20minha%20rota%20ativa." rel="noopener noreferrer" target="_blank">
            <span className="material-symbols-outlined text-[22px] text-primary-container">chat</span>
            <span>WhatsApp Suporte RotaPro</span>
          </a>
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-secondary-fixed-dim">
          <span className="material-symbols-outlined text-[14px]">my_location</span>
          <span className="font-code-sm text-[11px]">GPS e Romaneio Ativo transmitidos automaticamente</span>
        </div>
      </div>
      {/* Agent Dispatch & Quick Action */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Novo Chamado</h3>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Selecione o tema</span>
        </div>
        <button className="w-full h-14 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,176,0,0.28)] active:bg-primary transition-all" id="open-ticket-modal-btn" onClick={() => { setCategory(TICKET_CATEGORIES[0]); setTicketModalOpen(true); }} type="button">
          <span className="material-symbols-outlined text-[22px]">add_circle</span>
          <span>+ Abrir Novo Chamado</span>
        </button>
        {/* Category Chips Grid */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button className="flex flex-col items-start p-3 rounded-xl bg-surface-container-lowest shadow-sm hover:bg-surface-container active:scale-[0.98] transition-all text-left" onClick={() => { setCategory(TICKET_CATEGORIES[0]); setTicketModalOpen(true); }} type="button">
            <div className="w-8 h-8 rounded-full bg-tertiary-fixed/30 flex items-center justify-center text-tertiary mb-2">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </div>
            <span className="font-label-md text-label-md text-on-surface">Pagamento / Recibo</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">Diárias e taxas</span>
          </button>
          <button className="flex flex-col items-start p-3 rounded-xl bg-surface-container-lowest shadow-sm hover:bg-surface-container active:scale-[0.98] transition-all text-left" onClick={() => { setCategory(TICKET_CATEGORIES[1]); setTicketModalOpen(true); }} type="button">
            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface mb-2">
              <span className="material-symbols-outlined text-[18px]">car_repair</span>
            </div>
            <span className="font-label-md text-label-md text-on-surface">Mecânica / Pneu</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">Manutenção do veículo</span>
          </button>
          <button className="flex flex-col items-start p-3 rounded-xl bg-surface-container-lowest shadow-sm hover:bg-surface-container active:scale-[0.98] transition-all text-left" onClick={() => { setCategory(TICKET_CATEGORIES[2]); setTicketModalOpen(true); }} type="button">
            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface mb-2">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            </div>
            <span className="font-label-md text-label-md text-on-surface">Coleta / NF-e</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">Divergências de carga</span>
          </button>
          <button className="flex flex-col items-start p-3 rounded-xl bg-surface-container-lowest shadow-sm hover:bg-surface-container active:scale-[0.98] transition-all text-left" onClick={() => { setCategory(TICKET_CATEGORIES[3]); setTicketModalOpen(true); }} type="button">
            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface mb-2">
              <span className="material-symbols-outlined text-[18px]">phonelink_setup</span>
            </div>
            <span className="font-label-md text-label-md text-on-surface">App / Sincronismo</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">Bugs e sinal offline</span>
          </button>
        </div>
      </div>
      {/* Recent Tickets Section */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Chamados Recentes</h3>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Últimos 30 dias</span>
        </div>
        {/* Ticket 1: Resolved */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-code-md text-code-md text-on-surface">#T-8421</span>
              <span className="text-on-surface-variant">•</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Fechado há 2 dias</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
              Resolvido
            </span>
          </div>
          <div className="font-label-md text-label-md text-on-surface">
            Conferência de Diária Extra - Rota <span className="font-code-md">88345</span>
          </div>
          <div className="p-3 bg-surface-container-low rounded-lg text-on-surface-variant flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary-container shrink-0 mt-0.5">check_circle</span>
            <div className="font-body-sm text-body-sm">
              <strong className="font-label-sm text-on-surface">Retorno da Central:</strong> Diária adicional de R$ 140,00 creditada no Recibo Q2.
            </div>
          </div>
        </div>
        {/* Ticket 2: In Progress */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-code-md text-code-md text-on-surface">#T-8390</span>
              <span className="text-on-surface-variant">•</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Aberto ontem, 18:30</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" />
              Em Andamento
            </span>
          </div>
          <div className="font-label-md text-label-md text-on-surface">
            Revisão de Pneus Dianteiros Sprinter
          </div>
          <div className="p-3 bg-surface-container-low rounded-lg text-on-surface-variant flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-tertiary shrink-0 mt-0.5">engineering</span>
            <div className="font-body-sm text-body-sm">
              <strong className="font-label-sm text-on-surface">Oficina Parceira:</strong> Agendado na Doca 02 para 26/10 às 08:00.
            </div>
          </div>
        </div>
      </div>
      {/* Operational FAQ Accordion */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Dúvidas Frequentes (FAQ)</h3>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Instruções Operacionais</span>
        </div>
        <div className="flex flex-col gap-2" id="faq-list">
          {/* FAQ 1 */}
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm transition-all">
            <button className="faq-toggle w-full p-4 flex items-center justify-between text-left gap-3 focus:outline-none" onClick={() => setOpenFaq((current) => (current === 0 ? null : 0))} type="button">
              <span className="font-label-md text-label-md text-on-surface">Quando é liberado o pagamento da quinzena?</span>
              <span className={`material-symbols-outlined text-on-surface-variant faq-icon transition-transform duration-200 ${openFaq === 0 ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            <div className={`${openFaq === 0 ? '' : 'hidden'} faq-content px-4 pb-4 font-body-sm text-body-sm text-on-surface-variant`}>
              Após a assinatura digital do romaneio e conferência no módulo de Recibos, a liberação ocorre via PIX na sua conta bancária cadastrada em até 24h úteis.
            </div>
          </div>
          {/* FAQ 2 */}
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm transition-all">
            <button className="faq-toggle w-full p-4 flex items-center justify-between text-left gap-3 focus:outline-none" onClick={() => setOpenFaq((current) => (current === 1 ? null : 1))} type="button">
              <span className="font-label-md text-label-md text-on-surface">Cliente não atende e não tem recebedor. O que fazer?</span>
              <span className={`material-symbols-outlined text-on-surface-variant faq-icon transition-transform duration-200 ${openFaq === 1 ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            <div className={`${openFaq === 1 ? '' : 'hidden'} faq-content px-4 pb-4 font-body-sm text-body-sm text-on-surface-variant`}>
              Ligue no mínimo 2 vezes pelo aplicativo, envie mensagem via WhatsApp cadastrado e aguarde 5 minutos. Persistindo a ausência, registre o evento de &quot;Insucesso - Ausente&quot; anexando foto do número da residência / fachada.
            </div>
          </div>
          {/* FAQ 3 */}
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm transition-all">
            <button className="faq-toggle w-full p-4 flex items-center justify-between text-left gap-3 focus:outline-none" onClick={() => setOpenFaq((current) => (current === 2 ? null : 2))} type="button">
              <span className="font-label-md text-label-md text-on-surface">Como proceder com avaria ou dano no baú?</span>
              <span className={`material-symbols-outlined text-on-surface-variant faq-icon transition-transform duration-200 ${openFaq === 2 ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            <div className={`${openFaq === 2 ? '' : 'hidden'} faq-content px-4 pb-4 font-body-sm text-body-sm text-on-surface-variant`}>
              Não realize a entrega. Fotografe a embalagem com a etiqueta e o código de barras legíveis, registre no app como &quot;Recusa por Avaria&quot; e retenha o volume no veículo para descarregamento na doca reversa no fim do turno.
            </div>
          </div>
          {/* FAQ 4 */}
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm transition-all">
            <button className="faq-toggle w-full p-4 flex items-center justify-between text-left gap-3 focus:outline-none" onClick={() => setOpenFaq((current) => (current === 3 ? null : 3))} type="button">
              <span className="font-label-md text-label-md text-on-surface">Como navegar sem internet / modo offline?</span>
              <span className={`material-symbols-outlined text-on-surface-variant faq-icon transition-transform duration-200 ${openFaq === 3 ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            <div className={`${openFaq === 3 ? '' : 'hidden'} faq-content px-4 pb-4 font-body-sm text-body-sm text-on-surface-variant`}>
              O RotaPro faz cache automático do mapa da sua rota diária quando conectado ao Wi-Fi da Base. As baixas de entrega e assinaturas podem ser coletadas normalmente sem sinal e são sincronizadas assim que a rede 4G/5G for restabelecida.
            </div>
          </div>
        </div>
      </div>
      {/* Operational Hub Support Footer */}
      <div className="p-4 rounded-xl bg-surface-container-high flex flex-col gap-3">
        <div className="flex items-center gap-2 text-on-surface">
          <span className="material-symbols-outlined text-[20px] text-primary">warehouse</span>
          <span className="font-label-md text-label-md">Base Operacional Vila Leopoldina</span>
        </div>
        <div className="flex flex-col gap-1 font-body-sm text-body-sm text-on-surface-variant">
          <div className="flex items-center justify-between">
            <span>Torre SP Central:</span>
            <span className="font-code-sm text-code-sm text-on-surface">Canal 04 - VHF</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Plantão Telefônico:</span>
            <a className="font-code-sm text-code-sm text-primary font-bold" href="tel:08007729000">0800 772 9000</a>
          </div>
          <div className="flex items-center justify-between">
            <span>Horário de Doca:</span>
            <span className="font-code-sm text-code-sm text-on-surface">Seg - Sáb • 05h às 22h</span>
          </div>
        </div>
      </div>
      {/* Interactive Modal / Bottom-Sheet for New Ticket Simulation */}
      <div className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm ${ticketModalOpen ? 'flex' : 'hidden'} items-end justify-center`} id="ticket-modal">
        <div className="w-full bg-surface-container-lowest rounded-t-xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
          <div className="w-12 h-1.5 bg-surface-variant rounded-full mx-auto" />
          <div className="flex items-center justify-between">
            <h4 className="font-headline-sm text-headline-sm text-on-surface">Novo Chamado</h4>
            <button className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface" id="close-modal-btn" onClick={() => setTicketModalOpen(false)} type="button">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Motivo do Chamado</label>
              <div className="h-13 bg-surface-container-low rounded-xl px-4 flex items-center">
                <span className="font-body-md text-body-md text-on-surface">{category}</span>
              </div>
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant mb-1 block">Descrição da Ocorrência</label>
              <textarea className="w-full bg-surface-container-low rounded-xl p-3 font-body-md text-body-md text-on-surface outline-none resize-none placeholder:text-on-secondary-container" onChange={(event) => setDescription(event.target.value)} placeholder="Descreva sucintamente o número da rota e o ocorrido..." rows="3" value={description} />
            </div>
            <button className="w-full h-14 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md active:bg-primary transition-all mt-1" id="submit-ticket-btn" onClick={handleSubmitTicket} type="button">
              <span className="material-symbols-outlined text-[20px]">send</span>
              <span>Enviar para Análise</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>
    </ScreenFrame>
  );
}
