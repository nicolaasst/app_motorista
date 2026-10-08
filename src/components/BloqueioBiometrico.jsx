import { useEffect, useRef } from "react";
import { Icon } from "@/components/rp/Icon";
import { useBiometria } from "@/lib/BiometriaContext";

/**
 * Tela de bloqueio (cobre o app inteiro, opaca) enquanto a biometria não é confirmada.
 * Pede a biometria sozinha ao aparecer; falhou/cancelou/indisponível → o motorista tenta de novo ou entra com a senha.
 */
export default function BloqueioBiometrico() {
  const { bloqueado, erro, ocupado, aparelho, desbloquear, usarSenha } = useBiometria();
  const pediu = useRef(false);

  useEffect(() => {
    if (!bloqueado) {
      pediu.current = false;
      return;
    }
    if (!pediu.current) {
      pediu.current = true;
      void desbloquear();
    }
  }, [bloqueado, desbloquear]);

  if (!bloqueado) return null;
  const rotulo = aparelho.tipo === "rosto" ? "o rosto" : aparelho.tipo === "digital" ? "a digital" : "a biometria";
  return (
    <div role="dialog" aria-modal="true" aria-label="App bloqueado" className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background px-8 text-center">
      <Icon name={aparelho.tipo === "rosto" ? "face" : "fingerprint"} size={56} />
      <p className="text-headline-sm font-extrabold">App bloqueado</p>
      <p className="text-body-md text-muted-foreground">Use {rotulo} do aparelho para continuar.</p>
      {erro && <p role="alert" className="rounded-2xl bg-error-container/40 px-4 py-2 text-body-sm font-semibold text-destructive">{erro}</p>}
      <button type="button" disabled={ocupado} onClick={() => void desbloquear()} className="rp-tap rounded-full bg-primary px-6 py-3 text-label-lg font-bold text-primary-foreground disabled:opacity-60">
        {ocupado ? "Aguardando…" : "Usar biometria"}
      </button>
      <button type="button" onClick={() => void usarSenha()} className="rp-tap text-label-md font-bold text-muted-foreground underline">
        Entrar com senha
      </button>
    </div>
  );
}
