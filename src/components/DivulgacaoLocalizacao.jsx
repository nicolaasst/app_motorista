import { Icon } from "@/components/rp/Icon";
import { Sheet } from "@/components/rp/Sheet";
import { LINKS_LEGAIS } from "@/lib/linksLegais";

/**
 * Divulgação destacada da localização, mostrada ANTES da permissão do sistema.
 * "Agora não" volta para a tela anterior: sem a localização o app não acompanha a rota.
 */
export default function DivulgacaoLocalizacao({ open, onAceitar, onRecusar }) {
  return (
    <Sheet open={open} onClose={onRecusar} title="Localização durante a rota">
      <div className="space-y-3 pb-2">
        <div className="rounded-2xl bg-muted p-4">
          <p className="flex items-center gap-2 text-body-md font-extrabold"><Icon name="location_on" size={20} /> O que o app coleta</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-body-sm">
            <li>Sua <strong>localização precisa</strong>, <strong>também com o app em segundo plano e a tela bloqueada</strong>, enquanto houver uma rota em andamento.</li>
            <li>Uma notificação permanente (“rota em andamento”) fica visível enquanto isso acontece.</li>
            <li>A coleta para quando você encerra a rota. Fora da rota, nada é coletado.</li>
          </ul>
        </div>
        <p className="text-body-sm text-muted-foreground">
          Para quê: mostrar você no mapa, a central acompanhar a carga e o comprovante de entrega registrar o local. Sem essa permissão o app não consegue acompanhar a rota.
        </p>
        {LINKS_LEGAIS.privacidade && (
          <a href={LINKS_LEGAIS.privacidade} target="_blank" rel="noreferrer" className="text-label-md font-bold underline">
            Ler a política de privacidade
          </a>
        )}
        <button onClick={onAceitar} className="rp-tap flex w-full items-center justify-center rounded-full bg-primary py-3 text-label-lg font-bold text-primary-foreground">
          Entendi, continuar
        </button>
        <button onClick={onRecusar} className="rp-tap w-full rounded-full border border-border py-3 text-label-lg font-bold">Agora não</button>
      </div>
    </Sheet>
  );
}
