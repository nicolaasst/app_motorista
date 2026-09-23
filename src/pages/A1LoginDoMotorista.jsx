import { useEffect } from 'react';
import ScreenFrame from '../lib/ScreenFrame.jsx';
import PageRuntime from '../lib/PageRuntime.jsx';

export default function A1LoginDoMotorista() {
  useEffect(() => { document.title = 'RotaPro Driver'; }, []);
  return (
    <ScreenFrame screenId="a.1_login_do_motorista"><PageRuntime screenId="a.1_login_do_motorista">
      <main className="flex-1 flex flex-col relative w-full pt-safe pb-safe bg-surface px-margin"><div className="flex flex-col w-full relative pb-8">
    <div className="relative w-full rounded-b-[2.5rem] overflow-hidden pt-6 pb-14 px-4 text-center shadow-lg" style={{background: 'linear-gradient(135deg, #0A0A0A 0%, #008400 40%, #00B000 70%, #88EF1B 100%)'}}>
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-inverse-surface/60 backdrop-blur-md text-surface-bright shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed animate-pulse" />
          <span className="font-label-sm text-label-sm tracking-wide text-surface-bright">App Operacional do Motorista v2.4</span>
        </div>
        <div className="p-2 rounded-2xl bg-surface-container-lowest/15 backdrop-blur-md shadow-inner flex items-center justify-center">
          <img alt="Logotipo RotaPro Driver" className="h-12 w-auto object-contain drop-shadow-sm" src="/screens/logotipo_rotapro_driver.png" />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-headline-sm text-headline-sm text-surface-container-lowest tracking-tight">RotaPro Logística Inteligente</span>
        </div>
      </div>
    </div>
    <div className="w-full max-w-md mx-auto -mt-8 px-2 z-10">
      <div className="bg-surface-container-lowest rounded-[24px] shadow-xl p-6 flex flex-col space-y-5">
        <div className="space-y-1 text-left">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Acesse seu turno</h1>
          <p className="font-body-md text-body-md text-secondary">Digite suas credenciais para sincronizar suas rotas</p>
        </div>
        <form className="space-y-4" id="driver-login-form">
          <div className="space-y-1.5">
            <label className="font-label-md text-label-md text-on-surface block" htmlFor="driver-identifier">CPF ou Matrícula</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-secondary pointer-events-none text-[22px]">badge</span>
              <input autoComplete="username" className="w-full h-[52px] pl-12 pr-4 bg-surface-container-lowest rounded-full font-code-md text-code-md text-on-surface placeholder:text-secondary-fixed-dim focus:outline-none shadow-sm transition-all focus:ring-2 focus:ring-primary-container" id="driver-identifier" maxLength="14" name="driver-identifier" placeholder="000.000.000-00" required type="text" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="font-label-md text-label-md text-on-surface block" htmlFor="driver-password">Senha de Acesso</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-secondary pointer-events-none text-[22px]">lock</span>
              <input autoComplete="current-password" className="w-full h-[52px] pl-12 pr-12 bg-surface-container-lowest rounded-full font-body-lg text-body-lg text-on-surface placeholder:text-secondary-fixed-dim focus:outline-none shadow-sm transition-all focus:ring-2 focus:ring-primary-container" id="driver-password" name="driver-password" placeholder="••••••••" required type="password" />
              <button aria-label="Alternar visibilidade da senha" className="absolute right-3 w-10 h-10 flex items-center justify-center text-secondary hover:text-on-surface rounded-full transition-colors active:bg-surface-container" id="toggle-pwd-btn" type="button">
                <span className="material-symbols-outlined text-[20px]" id="eye-icon">visibility</span>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 pb-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input defaultChecked className="w-4 h-4 accent-primary rounded cursor-pointer" id="remember-me" type="checkbox" />
              <span className="font-label-md text-label-md text-secondary">Lembrar de mim</span>
            </label>
            <button className="font-label-md text-label-md text-primary-container hover:underline focus:outline-none focus:underline" type="button">
              Esqueci minha senha
            </button>
          </div>
          <button className="w-full h-[52px] rounded-full bg-primary-container active:bg-primary text-on-primary font-label-lg text-label-lg shadow-md transition-all transform active:scale-[0.99] flex items-center justify-center gap-2" id="btn-submit" type="submit">
            <span className="material-symbols-outlined text-[22px]">local_shipping</span>
            <span>Entrar no Sistema</span>
          </button>
        </form>
        <div className="pt-2 flex items-center justify-center gap-2 py-2 px-3 bg-surface-container-low rounded-full">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-container shadow-sm" />
          <span className="font-label-sm text-label-sm text-on-surface-variant">Sincronização em nuvem ativa</span>
          <span className="material-symbols-outlined text-[16px] text-tertiary">cloud_done</span>
        </div>
      </div>
    </div>
    <div className="mt-6 px-4 flex flex-col items-center text-center space-y-4">
      <div className="p-3 bg-surface-container rounded-2xl w-full max-w-md flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-full bg-inverse-surface text-surface-bright flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">headset_mic</span>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-secondary">Dúvidas ou problemas de acesso?</p>
            <p className="font-label-md text-label-md text-on-surface">Fale direto com a central</p>
          </div>
        </div>
        <a className="h-10 px-4 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm flex items-center gap-1.5 shadow active:bg-primary transition-colors" href="tel:08007682776">
          <span className="material-symbols-outlined text-[16px]">call</span>
          <span>Suporte</span>
        </a>
      </div>
      <div className="flex items-center gap-3 text-secondary">
        <span className="font-label-sm text-label-sm">Versão 2.4.12-PRO</span>
        <span className="w-1 h-1 rounded-full bg-secondary" />
        <span className="font-label-sm text-label-sm">Terminal Embarcado</span>
      </div>
    </div>
  </div>
</main>
    </PageRuntime></ScreenFrame>
  );
}
