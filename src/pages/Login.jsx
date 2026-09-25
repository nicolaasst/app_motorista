import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { entrar } from "@/api/app-motorista";
import { lembrarLogin } from "@/api/supabaseClient";
import { Icon } from "@/components/rp/Icon";
import { LineArt } from "@/components/rp/LineArt";
import { safeReturnTo } from "@/lib/authReturnTo";
import { formatarIdentificador } from "@/lib/masks";

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(() => lembrarLogin());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const raw = identifier.trim();
    if (!raw || !password) { setError("Informe seu CPF/matrícula e senha."); return; }
    setLoading(true);
    try {
      // CPF, matrícula ou e-mail: o servidor resolve o cadastro (o aparelho
      // nunca recebe dados de outros motoristas) e devolve só a sessão.
      await entrar({ identificador: raw, senha: password, lembrar: remember });
      navigate(safeReturnTo(), { replace: true });
    } catch (err) {
      setLoading(false);
      setError(err?.message || "Credenciais inválidas. Verifique e tente novamente.");
    }
  };

  return (
    <div className="app-shell safe-top flex flex-col">
      <div className="relative overflow-hidden bg-brand-yellow px-6 pb-12 pt-16 text-ink">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-brand-yellow-soft/50 blur-2xl" />
        <div className="absolute -left-10 top-10 h-32 w-32 rotate-12 rounded-3xl bg-brand-yellow-soft/40 blur-xl" />
        <div className="relative flex flex-col items-center text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-elevated">
            <LineArt name="truck" className="h-10 w-10 text-ink" />
          </span>
          <p className="mt-4 text-label-sm uppercase tracking-widest text-ink/60">App Operacional do Motorista</p>
          <h1 className="text-headline-md leading-tight">NGS Transportes</h1>
        </div>
      </div>

      <div className="-mt-6 flex-1 rounded-t-[32px] bg-background px-6 pb-10 pt-7">
        <h2 className="text-headline-lg">Acesse seu turno</h2>
        <p className="mt-1 text-body-md text-muted-foreground">Digite suas credenciais para sincronizar suas rotas</p>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-destructive bg-error-container/40 p-3 text-body-md text-destructive">
            <Icon name="error" size={18} /> {error}
          </div>
        )}

        <form onSubmit={submit} className="mt-7 space-y-4">
          <div>
            <label className="mb-1.5 block text-label-sm text-muted-foreground">CPF ou Matrícula</label>
            <div className="flex min-h-[52px] items-center gap-2 rounded-2xl border border-input bg-card px-3.5 focus-within:ring-2 focus-within:ring-primary-container">
              <Icon name="badge" size={20} className="text-muted-foreground" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(formatarIdentificador(e.target.value))}
                className="flex-1 bg-transparent text-body-md font-semibold outline-none placeholder:font-normal placeholder:text-stone"
                placeholder="000.000.000-00 ou nº de matrícula"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-label-sm text-muted-foreground">Senha de Acesso</label>
            <div className="flex min-h-[52px] items-center gap-2 rounded-2xl border border-input bg-card px-3.5 focus-within:ring-2 focus-within:ring-primary-container">
              <Icon name="lock" size={20} className="text-muted-foreground" />
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent text-body-md font-semibold outline-none placeholder:font-normal placeholder:text-stone"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShow(!show)} aria-label="Mostrar senha" className="text-muted-foreground">
                <Icon name={show ? "visibility_off" : "visibility"} size={20} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-body-md">
            <label className="flex items-center gap-2 font-medium text-muted-foreground">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded accent-primary-container" /> Lembrar de mim
            </label>
            <button type="button" onClick={() => navigate("/forgot")} className="font-bold text-primary-deep">Esqueci minha senha</button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rp-tap flex w-full items-center justify-center gap-2 rounded-full bg-primary-container min-h-[52px] text-label-lg text-primary-foreground shadow-cta transition active:scale-[0.99] disabled:opacity-70"
          >
            {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <><Icon name="login" size={20} /> Entrar no Sistema</>}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-center gap-2 text-label-sm font-semibold text-primary-deep">
          <Icon name="cloud_done" size={16} /> Sincronização em nuvem ativa
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-body-md font-bold"><Icon name="support_agent" size={20} className="text-primary-deep" /> Dúvidas ou problemas de acesso?</div>
          <p className="mt-1 text-body-sm text-muted-foreground">Fale direto com a central de operações</p>
          <a href="tel:08007682776" className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-body-md font-bold text-accent-foreground">
            <Icon name="call" size={18} /> 0800 768 2776
          </a>
        </div>

        <p className="mt-6 text-center text-label-sm text-muted-foreground">NGS Driver v2.4.12-PRO • Terminal Embarcado</p>
      </div>
    </div>
  );
}