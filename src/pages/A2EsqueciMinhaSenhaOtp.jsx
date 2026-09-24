import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ScreenFrame from '../lib/ScreenFrame.jsx';

export default function A2EsqueciMinhaSenhaOtp() {
  const navigate = useNavigate();
  useEffect(() => { document.title = 'A.2 Esqueci Minha Senha / Validação OTP - RotaPro Logística'; }, []);
  return (
    <ScreenFrame screenId="a.2_esqueci_minha_senha_otp">
      {/* BEGIN: MobileDeviceFrame */}
<div className="mobile-screen-wrapper flex flex-col justify-between" data-purpose="mobile-viewport-container">
  {/* BEGIN: TopHeaderSection */}
  <header className="hero-gradient pt-8 pb-14 px-6 relative text-white" data-purpose="hero-header">
    {/* Linha Superior: Botão Voltar & Badge de Segurança */}
    <div className="flex items-center justify-between gap-2 mb-6">
      {/* Botão Voltar para Login */}
      <button aria-label="Voltar para a tela de login" className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center transition-colors active:scale-95 text-white" onClick={() => navigate(-1)} type="button">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
        </svg>
      </button>
      {/* Badge de Contexto de Segurança */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 backdrop-blur-md border border-white/15 text-[11px] font-semibold tracking-wide uppercase text-white/90">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Segurança Operacional</span>
      </div>
    </div>
    {/* Logotipo & Título da Operação */}
    <div className="flex flex-col items-center text-center">
      {/* Ícone Identificador */}
      <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg mb-3">
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">Recuperar Acesso</h1>
      <p className="text-xs text-white/80 max-w-[280px] leading-relaxed">
        Redefina sua senha de motorista parceiro com validação via código de segurança
      </p>
    </div>
  </header>
  {/* END: TopHeaderSection */}
  {/* BEGIN: MainContentCard */}
  <main className="-mt-8 px-4 z-10 flex-1 flex flex-col" data-purpose="recovery-workflow-card">
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col flex-1">
      {/* BEGIN: StepWizardBar */}
      {/* Indicador de progresso das etapas de segurança */}
      <div className="mb-6" data-purpose="step-indicator">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="text-brand flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-brand" fill="currentColor" viewBox="0 0 20 20">
              <path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fillRule="evenodd" />
            </svg>
            1. Identificação
          </span>
          <span className="text-brand font-bold flex items-center gap-1 border-b-2 border-brand pb-0.5">
            2. Validação OTP
          </span>
          <span className="text-gray-400">
            3. Nova Senha
          </span>
        </div>
        {/* Barra de progresso visual (Etapa 2 em 66%) */}
        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
          <div className="bg-brand h-full rounded-full transition-all duration-300" style={{width: '66%'}} />
        </div>
      </div>
      {/* END: StepWizardBar */}
      {/* BEGIN: DispatchInfoBlock */}
      {/* Resumo do canal de envio do código */}
      <div className="bg-[#f2faf2] border border-green-200/70 rounded-2xl p-4 mb-6" data-purpose="phone-dispatch-info">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-gray-600 font-medium">Código de 6 dígitos enviado para:</p>
            <p className="font-mono text-base font-bold text-gray-900 tracking-wide">+55 (11) 98765-••••</p>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand bg-white px-2.5 py-1 rounded-full shadow-sm border border-brand/20">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            SMS / WhatsApp
          </span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-green-200/50 flex justify-between items-center text-xs">
          <span className="text-gray-500">Número desatualizado?</span>
          <button className="text-brand font-semibold hover:underline" type="button">Solicitar alteração</button>
        </div>
      </div>
      {/* END: DispatchInfoBlock */}
      {/* BEGIN: OtpInputSection */}
      <form className="space-y-5 flex-1 flex flex-col justify-between" onSubmit={(event) => event.preventDefault()}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
              Código de Autenticação (OTP)
            </label>
            {/* Grade de 6 Inputs para o código OTP */}
            <div className="grid grid-cols-6 gap-2" data-purpose="otp-input-boxes">
              <input className="h-12 w-full text-center font-mono text-xl font-bold bg-gray-50 border border-gray-300 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-white text-gray-800 transition" maxLength="1" type="text" defaultValue="8" />
              <input className="h-12 w-full text-center font-mono text-xl font-bold bg-gray-50 border border-gray-300 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-white text-gray-800 transition" maxLength="1" type="text" defaultValue="4" />
              <input className="h-12 w-full text-center font-mono text-xl font-bold bg-gray-50 border border-gray-300 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-white text-gray-800 transition" maxLength="1" type="text" defaultValue="2" />
              <input autoFocus className="h-12 w-full text-center font-mono text-xl font-bold bg-gray-50 border border-brand ring-2 ring-brand/20 bg-white text-gray-800 transition" maxLength="1" type="text" defaultValue="9" />
              <input className="h-12 w-full text-center font-mono text-xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-white text-gray-400 transition" maxLength="1" placeholder="•" type="text" />
              <input className="h-12 w-full text-center font-mono text-xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 focus:bg-white text-gray-400 transition" maxLength="1" placeholder="•" type="text" />
            </div>
            {/* Contador de Reenvio */}
            <div className="flex items-center justify-between mt-2.5 text-xs">
              <span className="text-gray-500 font-medium">Reenviar em: <strong className="text-gray-800 font-mono">00:45s</strong></span>
              <button className="text-gray-400 font-medium cursor-not-allowed flex items-center gap-1" disabled type="button">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                Reenviar via WhatsApp
              </button>
            </div>
          </div>
          {/* BEGIN: PasswordResetFormGroup */}
          <div className="pt-2 border-t border-gray-100 space-y-3" data-purpose="new-password-inputs">
            {/* Campo Nova Senha */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Definir Nova Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </div>
                <input className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 transition" placeholder="Digite a nova senha" type="password" defaultValue="Motorista@2024" />
                <button className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600" type="button">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Campo Confirmar Senha */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Confirmar Nova Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </div>
                <input className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 transition" placeholder="Repita a nova senha" type="password" defaultValue="Motorista@2024" />
              </div>
            </div>
            {/* Checklist de Segurança Operacional */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1.5">
              <p className="text-[11px] font-bold text-gray-600 uppercase">Regras de Segurança:</p>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-brand font-medium">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd" />
                  </svg>
                  <span>Mín. 8 dígitos</span>
                </div>
                <div className="flex items-center gap-1.5 text-brand font-medium">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd" />
                  </svg>
                  <span>Pelo menos 1 número</span>
                </div>
                <div className="flex items-center gap-1.5 text-brand font-medium">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd" />
                  </svg>
                  <span>Letra maiúscula</span>
                </div>
                <div className="flex items-center gap-1.5 text-brand font-medium">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd" />
                  </svg>
                  <span>Senhas coincidem</span>
                </div>
              </div>
            </div>
          </div>
          {/* END: PasswordResetFormGroup */}
        </div>
        {/* BEGIN: MainActionButtons */}
        <div className="space-y-2.5 pt-4">
          {/* Botão Primário Estilo Pill em Verde Vibrante conforme A.1 */}
          <button className="w-full py-3.5 px-5 rounded-full bg-brand hover:bg-brand-dark active:scale-[0.98] text-white font-bold text-sm tracking-wide shadow-lg shadow-brand/30 flex items-center justify-center gap-2 transition-all" type="submit">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
            </svg>
            <span>Validar Código e Redefinir Senha</span>
          </button>
          {/* Botão Secundário de Retorno */}
          <button className="w-full py-2.5 px-4 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors" onClick={() => navigate('/')} type="button">
            Cancelar e voltar para o Login
          </button>
        </div>
        {/* END: MainActionButtons */}
      </form>
      {/* END: OtpInputSection */}
    </div>
  </main>
  {/* END: MainContentCard */}
  {/* BEGIN: SupportFooterSection */}
  <footer className="p-4 space-y-3" data-purpose="support-footer">
    {/* Card Flutuante de Suporte Operacional idêntico a A.1 */}
    <div className="bg-white/80 backdrop-blur rounded-2xl p-3.5 border border-gray-200/80 shadow-sm flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </div>
        <div>
          <p className="text-[11px] text-gray-500 font-medium leading-tight">Problemas com o código?</p>
          <p className="text-xs font-bold text-gray-900 leading-tight">Central de Tráfego 24h</p>
        </div>
      </div>
      <a className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-brand text-white font-bold text-xs shadow-sm hover:bg-brand-dark transition-all active:scale-95 flex-shrink-0" href="tel:0800000000">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
        <span>Suporte</span>
      </a>
    </div>
    {/* Rodapé Institucional com Metadados da Aplicação */}
    <div className="text-center text-[11px] text-gray-400 font-medium">
      <span>Versão 2.4.12-PRO</span>
      <span className="mx-1.5">•</span>
      <span>Terminal Embarcado Seguro</span>
    </div>
  </footer>
  {/* END: SupportFooterSection */}
</div>
{/* END: MobileDeviceFrame */}
    </ScreenFrame>
  );
}
