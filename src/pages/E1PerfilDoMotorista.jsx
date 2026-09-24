import { useEffect } from 'react';
import ScreenFrame from '../lib/ScreenFrame.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

export default function E1PerfilDoMotorista() {
  const navigate = useNavigate();
  const { logout } = useApp();
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  useEffect(() => { document.title = 'RotaPro Driver'; }, []);
  return (
    <ScreenFrame screenId="e.1_perfil_do_motorista">
      <div>
  <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl pt-safe"><div className="h-16 px-margin flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="flex items-center gap-space-sm"><img alt="Logotipo RotaPro Driver" className="h-8 w-auto object-contain" src="/screens/logotipo_rotapro_driver.png" /><div className="flex flex-col"><span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">RotaPro</span><span className="font-headline-sm text-headline-sm text-on-surface leading-tight">Perfil</span></div></div><div className="flex items-center gap-space-sm"><button aria-label="Notificações" className="relative w-11 h-11 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"><span className="material-symbols-outlined text-[24px]">notifications</span><span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-container text-on-primary font-label-sm text-[10px] ring-2 ring-surface">3</span></button><div className="relative flex items-center justify-center"><img alt="Lucas Silveira" className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20" src="/screens/logotipo_rotapro_driver.png" /><span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary-container ring-1 ring-surface" /></div></div></div></header><main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface px-margin"><div className="flex flex-col w-full gap-space-md">
      {/* Status do Cadastro & Alocação Rápida */}
      <div className="flex items-center justify-between bg-surface-container-lowest p-space-md rounded-2xl shadow-sm">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-primary text-[24px]" style={{fontVariationSettings: '"FILL" 1'}}>verified</span>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Status Cadastral</span>
            <span className="font-label-md text-label-md text-primary">Cadastro Ativo &amp; Regularizado</span>
          </div>
        </div>
        <span className="flex items-center gap-1 bg-surface-container-low px-3 py-1 rounded-full font-code-sm text-code-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px] text-tertiary">inventory_2</span>
          Frota SP-02
        </span>
      </div>
      {/* 1. Card de Identificação do Motorista */}
      <div className="relative overflow-hidden bg-surface-container-lowest rounded-3xl p-space-lg shadow-sm flex flex-col gap-space-md">
        {/* Ambient Accent Flare */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-fixed/40 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-center gap-space-md relative z-10">
          <div className="relative">
            <img alt="Foto de Lucas Silveira" className="w-24 h-24 rounded-full object-cover shadow-md" src="/screens/logotipo_rotapro_driver.png" />
            <div className="absolute bottom-0 right-0 bg-primary-container text-on-primary rounded-full p-1.5 shadow-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
          </div>
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1 min-w-0">
            <div className="flex items-center gap-space-xs flex-wrap justify-center sm:justify-start">
              <h1 className="font-headline-md text-headline-md text-on-surface truncate">Lucas Silveira</h1>
              <span className="bg-[#131313] text-surface-bright font-code-sm text-code-sm px-2.5 py-0.5 rounded-full">#4821</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">CPF: ***.914.302-** • CNH: B/EAR</p>
            {/* Badge de Motorista Nível Ouro */}
            <div className="mt-2.5 inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full">
              <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: '"FILL" 1'}}>workspace_premium</span>
              <span className="font-label-sm text-label-sm">Nível Ouro • SLA 98.2%</span>
            </div>
          </div>
        </div>
        {/* Metadados de Contato & Ação Editar */}
        <div className="bg-surface-container-low rounded-2xl p-space-md flex flex-col gap-2">
          <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-on-secondary-container">call</span>
              <span>(11) 98765-4321</span>
            </div>
            <button className="text-primary font-label-sm text-label-sm hover:underline" type="button">Alterar</button>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
            <div className="flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-[18px] text-on-secondary-container">mail</span>
              <span className="truncate">lucas.silveira@rotapro.com.br</span>
            </div>
            <span className="bg-surface-container text-on-surface-variant text-[10px] font-label-sm px-2 py-0.5 rounded-full">Corporativo</span>
          </div>
        </div>
        {/* Veículo Alocado Destacado */}
        <div className="bg-[#131313] text-on-secondary p-space-md rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-container/20 flex items-center justify-center text-primary-fixed">
              <span className="material-symbols-outlined text-[24px]">directions_car</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-secondary-fixed-dim uppercase">Veículo Alocado</span>
              <span className="font-headline-sm text-headline-sm text-surface-bright">Sprinter 415 CDI</span>
            </div>
          </div>
          {/* Mercosul Plate Badge */}
          <div className="flex flex-col items-center bg-surface-container-lowest text-on-surface rounded-lg px-2.5 py-1 shadow-sm">
            <div className="w-full bg-[#003399] h-1.5 rounded-t mb-0.5" />
            <span className="font-code-md text-code-md tracking-wider font-bold">BRA-2E19</span>
          </div>
        </div>
        <button className="w-full py-3 rounded-full bg-surface-container text-on-surface font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors" type="button">
          <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
          Editar Dados Pessoais
        </button>
      </div>
      {/* 2. Documentos Operacionais (Digital Vault) */}
      <div className="bg-surface-container-lowest rounded-3xl p-space-lg shadow-sm flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">folder_shared</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Digital Vault</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Conformidade e licenças de trânsito</p>
            </div>
          </div>
          <span className="font-label-sm text-label-sm bg-primary/10 text-primary px-2.5 py-1 rounded-full">3 Validados</span>
        </div>
        <div className="flex flex-col gap-space-sm">
          {/* CNH Digital */}
          <div className="bg-surface-container-low p-space-md rounded-2xl flex items-center justify-between">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-[24px] mt-0.5">badge</span>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface">CNH Digital (EAR)</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Vencimento: 18/08/2026</span>
                <span className="font-code-sm text-code-sm text-primary mt-0.5">Válida • Cat. B</span>
              </div>
            </div>
            <button className="px-3 py-1.5 rounded-full bg-surface-container-lowest text-primary font-label-sm text-label-sm shadow-sm flex items-center gap-1 hover:bg-primary hover:text-on-primary transition-all" type="button">
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              PDF
            </button>
          </div>
          {/* CRLV Veículo */}
          <div className="bg-surface-container-low p-space-md rounded-2xl flex items-center justify-between">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-[24px] mt-0.5">description</span>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface">CRLV Digital</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Mercedes Sprinter • Exercício 2024</span>
                <span className="font-code-sm text-code-sm text-primary mt-0.5">Em Dia • Licenciado</span>
              </div>
            </div>
            <button className="px-3 py-1.5 rounded-full bg-surface-container-lowest text-primary font-label-sm text-label-sm shadow-sm flex items-center gap-1 hover:bg-primary hover:text-on-primary transition-all" type="button">
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              PDF
            </button>
          </div>
          {/* ASO Atestado Saúde */}
          <div className="bg-surface-container-low p-space-md rounded-2xl flex items-center justify-between">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-[24px] mt-0.5">health_and_safety</span>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface">ASO Ocupacional</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Aptidão Física &amp; Ergonomia</span>
                <span className="font-code-sm text-code-sm text-primary mt-0.5">Válido até 12/2025</span>
              </div>
            </div>
            <button className="px-3 py-1.5 rounded-full bg-surface-container-lowest text-primary font-label-sm text-label-sm shadow-sm flex items-center gap-1 hover:bg-primary hover:text-on-primary transition-all" type="button">
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              PDF
            </button>
          </div>
        </div>
        {/* Alerta Preventivo */}
        <div className="flex items-center gap-2 bg-surface-container p-space-sm rounded-xl text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px] text-tertiary">info</span>
          <span className="font-body-sm text-body-sm">Próxima renovação preventiva programada em 10 meses.</span>
        </div>
      </div>
      {/* 3. Dados Bancários & PIX Cadastrados */}
      <div className="bg-surface-container-lowest rounded-3xl p-space-lg shadow-sm flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Recebimento de Diárias</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Liquidação automática de romaneios D.1/D.2</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">lock</span>
        </div>
        <div className="bg-surface-container-low rounded-2xl p-space-md flex flex-col gap-space-sm">
          <div className="flex justify-between items-center pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">account_balance</span>
              <span className="font-label-md text-label-md text-on-surface">Banco Santander (033)</span>
            </div>
            <span className="bg-primary/10 text-primary font-label-sm text-label-sm px-2 py-0.5 rounded-full">Principal</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-body-sm font-body-sm">
            <div className="bg-surface-container-lowest p-2.5 rounded-xl">
              <span className="text-on-surface-variant block text-[11px] uppercase">Agência</span>
              <span className="font-code-md text-code-md text-on-surface">3421</span>
            </div>
            <div className="bg-surface-container-lowest p-2.5 rounded-xl">
              <span className="text-on-surface-variant block text-[11px] uppercase">Conta Corrente</span>
              <span className="font-code-md text-code-md text-on-surface">****2-1</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-3 rounded-xl flex items-center justify-between mt-1">
            <div className="flex flex-col">
              <span className="text-on-surface-variant text-[11px] uppercase font-label-sm">Chave PIX Cadastrada</span>
              <span className="font-code-md text-code-md text-on-surface">CPF: ***.914.302-**</span>
            </div>
            <button className="font-label-sm text-label-sm text-primary hover:underline flex items-center gap-0.5" type="button">
              <span>Alterar</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
      {/* 4. Preferências do Aplicativo & Campo */}
      <div className="bg-surface-container-lowest rounded-3xl p-space-lg shadow-sm flex flex-col gap-space-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Preferências Operacionais</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Ajustes de navegação e alertas em cabine</p>
          </div>
        </div>
        {/* Navegador Padrão */}
        <div className="bg-surface-container-low p-space-md rounded-2xl flex flex-col gap-2">
          <span className="font-label-md text-label-md text-on-surface">Navegador Padrão de Rota</span>
          <div className="grid grid-cols-3 gap-2">
            <button className="py-2.5 px-2 rounded-xl bg-primary text-on-primary font-label-sm text-label-sm flex flex-col items-center justify-center gap-1 shadow-sm" type="button">
              <span className="material-symbols-outlined text-[18px]">near_me</span>
              Waze
            </button>
            <button className="py-2.5 px-2 rounded-xl bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm flex flex-col items-center justify-center gap-1 hover:bg-surface-container" type="button">
              <span className="material-symbols-outlined text-[18px]">map</span>
              Google Maps
            </button>
            <button className="py-2.5 px-2 rounded-xl bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm flex flex-col items-center justify-center gap-1 hover:bg-surface-container" type="button">
              <span className="material-symbols-outlined text-[18px]">hub</span>
              RotaPro GPS
            </button>
          </div>
        </div>
        {/* Toggle Alertas Sonoros */}
        <div className="bg-surface-container-low p-space-md rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[24px]">volume_up</span>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface">Alertas Sonoros &amp; Bipagem</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Confirmação auditiva ao bipar volumes</span>
            </div>
          </div>
          {/* Toggle Switch Ativo */}
          <button aria-pressed="true" className="w-12 h-6 bg-primary-container rounded-full relative p-0.5 transition-colors focus:outline-none" id="toggle-sound" type="button">
            <span className="block w-5 h-5 bg-on-primary rounded-full shadow-md transform translate-x-6 transition-transform" />
          </button>
        </div>
        {/* Mapas Offline */}
        <div className="bg-surface-container-low p-space-md rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[24px]">offline_pin</span>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface">Mapas Offline</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">240 MB baixados (SP Centro / Sul)</span>
            </div>
          </div>
          <button className="text-primary font-label-sm text-label-sm hover:underline" type="button">Atualizar</button>
        </div>
        {/* Modo Noturno Automático */}
        <div className="bg-surface-container-low p-space-md rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[24px]">brightness_auto</span>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface">Tema do Painel</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Seguir Sistema Operacional</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
        </div>
      </div>
      {/* 5. Central de Ajuda & Termos */}
      <div className="bg-surface-container-lowest rounded-3xl p-space-lg shadow-sm flex flex-col gap-space-md">
        {/* Card E.2 Suporte Direto */}
        <Link className="bg-surface-container-low hover:bg-surface-container p-space-md rounded-2xl flex items-center justify-between transition-colors" to="/suporte">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">support_agent</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface">Central de Apoio à Frota</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Abertura de chamados e suporte E.2</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">arrow_forward_ios</span>
        </Link>
        {/* Termos de Uso e Privacidade */}
        <div className="flex flex-col gap-1 text-on-surface-variant font-body-sm text-body-sm px-2">
          <a className="py-1 flex items-center justify-between hover:text-on-surface transition-colors" href="#" onClick={(event) => event.preventDefault()}>
            <span>Termos de Uso Operacional RotaPro</span>
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </a>
          <a className="py-1 flex items-center justify-between hover:text-on-surface transition-colors" href="#" onClick={(event) => event.preventDefault()}>
            <span>Política de Privacidade e LGPD de Rotas</span>
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </a>
        </div>
        {/* Versão do App */}
        <div className="text-center pt-2">
          <span className="font-code-sm text-code-sm text-on-surface-variant">RotaPro Driver v2.4.12-PRO (Build 309)</span>
        </div>
      </div>
      {/* 6. Ação de Encerramento (Logoff) */}
      <div className="pt-2 pb-6 flex flex-col items-center">
        <button className="w-full h-14 rounded-full bg-surface-container hover:bg-error-container text-on-surface hover:text-on-error-container font-label-lg text-label-lg flex items-center justify-center gap-2 transition-all" id="btn-logoff" onClick={handleLogout} type="button">
          <span className="material-symbols-outlined text-[20px] text-error">logout</span>
          <span>Desconectar da Conta (Logoff)</span>
        </button>
      </div>
    </div>
  </main><nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#131313] shadow-[0_-4px_16px_rgba(0,0,0,0.22)]" data-active-classes="text-primary-container font-label-md"><div className="flex justify-around items-center h-[72px] px-space-xs"><Link className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" to="/rota"><span className="material-symbols-outlined text-[24px]">local_shipping</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Rota</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></Link><Link className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" to="/historico"><span className="material-symbols-outlined text-[24px]">history</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Histórico</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></Link><Link className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] text-secondary-fixed-dim hover:text-surface transition-colors group" to="/recibos"><span className="material-symbols-outlined text-[24px]">receipt_long</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Recibos</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></Link><Link aria-current="page" className="flex flex-col items-center justify-center flex-1 h-full min-w-[44px] transition-colors group text-primary-container font-label-md" to="/perfil"><span className="material-symbols-outlined text-[24px]">account_circle</span><span className="font-label-sm text-label-sm mt-0.5 tracking-tight">Perfil</span><span className="w-1.5 h-1.5 rounded-full bg-[#88EF1B] mt-1 opacity-0 group-[.active]:opacity-100 transition-opacity" /></Link></div></nav>
</div>
    </ScreenFrame>
  );
}
