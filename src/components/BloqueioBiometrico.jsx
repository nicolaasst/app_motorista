import { useCallback, useEffect, useRef, useState } from "react";
import { App as CapApp } from "@capacitor/app";
import { useAuth } from "@/lib/AuthContext";
import { biometriaAtiva, confirmarBiometria, TEMPO_BLOQUEIO_MS } from "@/lib/biometria";
import { ehNativo } from "@/lib/nativo";
import { Icon } from "@/components/rp/Icon";

/**
 * Bloqueia o app (tela cheia) quando ele volta do segundo plano depois de TEMPO_BLOQUEIO_MS
 * e a biometria está ativa. Só no app nativo, só com sessão aberta. Sem biometria válida,
 * a saída é encerrar a sessão e entrar de novo com senha.
 */
export default function BloqueioBiometrico() {
  const { isAuthenticated, logout } = useAuth();
  const [bloqueado, setBloqueado] = useState(false);
  const saiuEm = useRef(null);

  const desbloquear = useCallback(async () => {
    if (await confirmarBiometria("Desbloquear o NGS Driver")) setBloqueado(false);
  }, []);

  useEffect(() => {
    if (!ehNativo() || !isAuthenticated) return undefined;
    let remover = null;
    let vivo = true;
    CapApp.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) {
        saiuEm.current = Date.now();
        return;
      }
      const fora = saiuEm.current ? Date.now() - saiuEm.current : 0;
      saiuEm.current = null;
      if (biometriaAtiva() && fora >= TEMPO_BLOQUEIO_MS) {
        setBloqueado(true);
        void desbloquear();
      }
    }).then((h) => {
      if (vivo) remover = h;
      else h.remove();
    });
    return () => {
      vivo = false;
      remover?.remove();
    };
  }, [isAuthenticated, desbloquear]);

  if (!bloqueado) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="App bloqueado" className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background px-8 text-center">
      <Icon name="lock" size={48} />
      <p className="text-body-lg font-bold">App bloqueado</p>
      <p className="text-body-sm text-muted-foreground">Confirme com a biometria do aparelho para continuar.</p>
      <button type="button" onClick={() => void desbloquear()} className="rp-tap rounded-2xl bg-primary px-6 py-3 text-label-lg font-bold text-primary-foreground">
        Desbloquear
      </button>
      <button type="button" onClick={() => void logout()} className="rp-tap text-label-md font-bold text-muted-foreground underline">
        Sair e entrar com senha
      </button>
    </div>
  );
}
