import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { contexto, minhasRotas } from "@/api/app-motorista";
import { SubHeader } from "@/components/rp/SubHeader";
import { Icon } from "@/components/rp/Icon";
import { Card } from "@/components/rp/Card";
import { Button } from "@/components/rp/Button";
import { SelectionRow } from "@/components/rp/SelectionRow";
import { enviarProva } from "@/lib/enviarProva";
import { capturarPosicao } from "@/lib/posicao";

// Emergência: fluxo próprio, fora da fila de chamados (Fase 3).
// Dois toques (tipo → acionar); a posição do aparelho vai junto; sem conexão o
// acionamento fica no topo da fila e a tela oferece a ligação para a central.
const TIPOS = [
  { value: "acidente", icon: "car_crash", label: "Acidente" },
  { value: "roubo_assalto", icon: "local_police", label: "Roubo / Assalto" },
  { value: "mal_subito", icon: "medical_services", label: "Mal súbito" },
  { value: "pane_local_risco", icon: "warning", label: "Pane em local de risco" },
  { value: "outro", icon: "emergency", label: "Outra emergência" },
];

const TELEFONE_PADRAO = "08007682776";
const formatarTelefone = (t) =>
  /^0800\d{7}$/.test(t) ? `0800 ${t.slice(4, 7)} ${t.slice(7)}` : t;

export default function Emergency() {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null); // { estado, mensagem, posicao }
  const [telefone, setTelefone] = useState(TELEFONE_PADRAO);
  const [rotaId, setRotaId] = useState(null);

  useEffect(() => {
    contexto()
      .then((c) => c.config?.telefone_central && setTelefone(c.config.telefone_central.replace(/\D/g, "")))
      .catch(() => {});
    minhasRotas({ status: "em_operacao", limite: 1 })
      .then((r) => setRotaId(r[0]?.id || null))
      .catch(() => {});
  }, []);

  const acionar = async () => {
    if (!tipo || enviando) return;
    setEnviando(true);
    const posicao = await capturarPosicao({ timeoutMs: 5000, maxIdadeMs: 5 * 60 * 1000 });
    const r = await enviarProva({
      kind: "emergency",
      key: "emergency",
      route_id: rotaId,
      payload: { tipo, posicao, acionada_em: new Date().toISOString() },
    });
    setResultado({ ...r, posicao });
    setEnviando(false);
  };

  const ligar = (
    <a
      href={`tel:${telefone}`}
      className="rp-tap flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-destructive text-label-lg text-white"
    >
      <Icon name="call" size={20} /> Ligar para a central • {formatarTelefone(telefone)}
    </a>
  );

  if (resultado) {
    const enviado = resultado.estado === "enviado";
    return (
      <div>
        <SubHeader title="Emergência" subtitle="Central de operações" />
        <div className="screen-pad space-y-4 pt-6">
          <Card className="p-5 text-center">
            <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${enviado ? "bg-status-green-bg text-status-green-fg" : "bg-status-amber-bg text-status-amber-fg"}`}>
              <Icon name={enviado ? "task_alt" : "cloud_off"} size={36} />
            </span>
            <h1 className="mt-3 text-headline-sm">{enviado ? "Central acionada" : resultado.estado === "offline" ? "Sem conexão agora" : "Não foi possível acionar"}</h1>
            <p className="mt-1 text-body-md text-muted-foreground">
              {enviado
                ? "A central recebeu sua emergência e sua localização. Mantenha-se em local seguro."
                : resultado.estado === "offline"
                  ? "O acionamento ficou salvo e sai assim que houver sinal. Ligue para a central agora."
                  : resultado.mensagem}
            </p>
            {resultado.posicao ? (
              <p className="mt-2 text-label-sm text-muted-foreground">
                Posição enviada: {resultado.posicao.lat.toFixed(5)}, {resultado.posicao.lng.toFixed(5)}
              </p>
            ) : (
              <p className="mt-2 text-label-sm text-status-amber-fg">GPS indisponível — informe sua localização por telefone.</p>
            )}
          </Card>
          {ligar}
          <Button variant="outline" className="w-full" onClick={() => navigate(-1)}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SubHeader title="Emergência" subtitle="Prioridade máxima" />
      <div className="screen-pad space-y-4 pt-4">
        <Card className="border-destructive/30 bg-error-container/30 p-4">
          <p className="flex items-center gap-2 text-body-md font-bold text-destructive"><Icon name="emergency" size={20} /> Use só em situação de risco</p>
          <p className="mt-1 text-body-sm text-muted-foreground">A central é avisada na hora, com a sua localização. Para dúvidas e problemas comuns, use a Central de Apoio.</p>
        </Card>

        <section>
          <p className="mb-2 text-label-sm text-muted-foreground">O que está acontecendo?</p>
          <div className="space-y-2">
            {TIPOS.map((t) => (
              <SelectionRow key={t.value} icon={t.icon} label={t.label} active={tipo === t.value} onClick={() => setTipo(t.value)} />
            ))}
          </div>
        </section>

        <Button variant="danger" className="w-full" loading={enviando} disabled={!tipo} onClick={acionar}>
          <Icon name="sos" size={20} /> Acionar emergência
        </Button>
        {ligar}
      </div>
    </div>
  );
}
