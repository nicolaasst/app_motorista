import { useState } from "react";
import { Icon } from "@/components/rp/Icon";
import { Sheet } from "@/components/rp/Sheet";
import { useAuth } from "@/lib/AuthContext";
import { useBiometria } from "@/lib/BiometriaContext";
import { ehNativo } from "@/lib/nativo";

/**
 * Oferta única, depois do primeiro login com senha: "Ativar o acesso por biometria?".
 * Aparece só no app, com biometria disponível e cadastrada no aparelho, enquanto o motorista ainda não decidiu.
 * "Agora não" é uma decisão: não pergunta de novo (dá para ligar depois no Perfil).
 */
export default function OfertaBiometria() {
  const { isAuthenticated } = useAuth();
  const { pronto, aparelho, ativa, decidido, bloqueado, ativar, desativar } = useBiometria();
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const aberta = ehNativo() && pronto && isAuthenticated && aparelho.disponivel && !ativa && !decidido && !bloqueado;
  if (!aberta) return null;

  const rotulo = aparelho.tipo === "rosto" ? "o rosto" : aparelho.tipo === "digital" ? "a digital" : "a biometria";
  const aceitar = async () => {
    setOcupado(true);
    setErro("");
    const r = await ativar();
    setOcupado(false);
    if (!r.ok && !r.cancelado) setErro(r.mensagem);
  };

  return (
    <Sheet open onClose={() => void desativar()} title="Entrar mais rápido?">
      <div className="space-y-3 pb-2 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted"><Icon name={aparelho.tipo === "rosto" ? "face" : "fingerprint"} size={32} /></span>
        <p className="text-body-md">Da próxima vez, abra o app com {rotulo} do aparelho em vez de digitar a senha.</p>
        <p className="text-body-sm text-muted-foreground">O app não guarda a sua biometria: quem confere é o próprio aparelho. Você pode desligar quando quiser no Perfil.</p>
        {erro && <p role="alert" className="text-body-sm font-semibold text-destructive">{erro}</p>}
        <button type="button" disabled={ocupado} onClick={() => void aceitar()} className="rp-tap flex w-full items-center justify-center rounded-full bg-primary py-3 text-label-lg font-bold text-primary-foreground disabled:opacity-60">
          {ocupado ? "Aguardando…" : "Ativar"}
        </button>
        <button type="button" onClick={() => void desativar()} className="rp-tap w-full rounded-full border border-border py-3 text-label-lg font-bold">Agora não</button>
      </div>
    </Sheet>
  );
}
