import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, WhatsApp, ChevronRight, Check, X } from "./ForgotIcons";
import { OtpInput } from "@/components/ui/otp-input";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 OTP, 2 Nova Senha
  const [otp, setOtp] = useState("");
  const [otpStatus, setOtpStatus] = useState("idle");
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [seconds, setSeconds] = useState(45);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const rules = [
    { label: "Mín. 8 dígitos", ok: pwd.length >= 8 },
    { label: "Pelo menos 1 número", ok: /\d/.test(pwd) },
    { label: "Letra maiúscula", ok: /[A-Z]/.test(pwd) },
    { label: "Senhas coincidem", ok: pwd.length > 0 && pwd === confirm },
  ];

  const validarOtp = () => {
    if (otp.length < 6) {
      setOtpStatus("error");
      return;
    }
    setOtpStatus("success");
    setStep(2);
  };

  const steps = [
    { n: 1, label: "Identificação" },
    { n: 2, label: "Validação OTP" },
    { n: 3, label: "Nova Senha" },
  ];

  return (
    <div className="app-shell safe-top flex flex-col">
      <div className="bg-card border-b border-border px-6 pb-8 pt-14 text-foreground">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recuperação de Acesso</p>
            <h1 className="text-lg font-extrabold">NGS Driver</h1>
          </div>
        </div>
        <div className="flex items-center">
          {steps.map((s, i) => (
            <div key={s.n} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${step >= s.n ? "bg-primary-container text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {s.n}
                </span>
                <span className="mt-1 text-[10px] font-semibold text-muted-foreground">{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`mx-1 h-0.5 flex-1 rounded ${step > s.n ? "bg-primary-container" : "bg-border"}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 pb-10 pt-6">
        {step === 1 && (
          <>
            <p className="text-sm font-semibold text-muted-foreground">Código de 6 dígitos enviado para:</p>
            <p className="mt-1 text-lg font-extrabold">+55 (11) 98765-••••</p>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="chip bg-accent text-accent-foreground">SMS / WhatsApp</span>
              <button className="font-bold text-primary">Número desatualizado? Solicitar alteração</button>
            </div>

            <p className="mt-6 mb-2 text-xs font-bold text-muted-foreground">Código de Autenticação (OTP)</p>
            <OtpInput
              length={6}
              mode="numeric"
              value={otp}
              onChange={(v) => { setOtp(v); setOtpStatus("idle"); }}
              status={otpStatus}
              hint="Digite o código enviado"
              errorMessage="Código incompleto — digite os 6 dígitos enviados"
              successMessage="Código validado!"
            />

            <div className="mt-5 flex items-center justify-between text-sm">
              <span className="font-semibold text-muted-foreground">Reenviar em: <b className="text-foreground">00:{String(seconds).padStart(2, "0")}s</b></span>
              <button disabled={seconds > 0} className="inline-flex items-center gap-1.5 font-bold text-primary disabled:opacity-40">
                <WhatsApp className="h-4 w-4" /> Reenviar via WhatsApp
              </button>
            </div>

            <button
              onClick={validarOtp}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30"
            >
              Validar Código <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-extrabold">Definir Nova Senha</h2>
            <p className="mt-1 text-sm text-muted-foreground">Crie uma senha segura para sua conta.</p>

            <div className="mt-5 space-y-3">
              <input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="Definir Nova Senha"
                className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm font-semibold outline-none focus:border-primary"
              />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirmar Nova Senha"
                className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm font-semibold outline-none focus:border-primary"
              />
            </div>

            <p className="mt-4 mb-2 text-xs font-bold text-muted-foreground">Regras de Segurança:</p>
            <div className="grid grid-cols-2 gap-2">
              {rules.map((r) => (
                <div key={r.label} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${r.ok ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                  {r.ok ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />} {r.label}
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate("/login")}
              disabled={!rules.every((r) => r.ok)}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-50"
            >
              Validar Código e Redefinir Senha
            </button>
            <button onClick={() => navigate("/login")} className="mt-3 w-full rounded-xl border border-border py-3 text-sm font-bold text-muted-foreground">
              Cancelar e voltar para o Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}