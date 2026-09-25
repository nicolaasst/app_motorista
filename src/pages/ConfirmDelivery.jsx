import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dataUrlParaBlob, parada, volumesDaParada } from "@/api/app-motorista";
import { SubHeader } from "@/components/rp/SubHeader";
import { Icon } from "@/components/rp/Icon";
import { Card } from "@/components/rp/Card";
import { Button } from "@/components/rp/Button";
import { MaskedInput } from "@/components/rp/MaskedInput";
import SignaturePad from "@/components/SignaturePad";
import { Sheet } from "@/components/rp/Sheet";
import { SelectionRow } from "@/components/rp/SelectionRow";
import { maskRgOrCpf } from "@/lib/masks";
import { ResultOverlay } from "@/components/rp/ResultOverlay";
import { putBlob } from "@/lib/offlineQueue";
import { enviarProva } from "@/lib/enviarProva";
import { capturarPosicao } from "@/lib/posicao";
import { comprimirImagem } from "@/lib/imagem";

const RECEIVER_TYPES = [
  { value: "proprio_destinatario", label: "Próprio destinatário" },
  { value: "conjuge_familiar", label: "Cônjuge/Familiar" },
  { value: "porteiro_portaria", label: "Porteiro/Portaria" },
  { value: "recepcao_zelador", label: "Recepção/Zelador" },
  { value: "vizinho", label: "Vizinho" },
  { value: "funcionario_local", label: "Funcionário do local" },
  { value: "outro", label: "Outro" },
];

export default function ConfirmDelivery() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stop, setStop] = useState(null);
  const [volumes, setVolumes] = useState([]);
  const [name, setName] = useState("");
  const [doc, setDoc] = useState("");
  const [receiverType, setReceiverType] = useState("");
  const [receiverTypeOther, setReceiverTypeOther] = useState("");
  const [isHolder, setIsHolder] = useState(false);
  const [signed, setSigned] = useState(null); // data URL PNG da assinatura (null = sem assinatura)
  const [photo, setPhoto] = useState(null); // { blobKey, preview }
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [offline, setOffline] = useState(false);
  const [rejeicao, setRejeicao] = useState(null);
  const [typeSheet, setTypeSheet] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await parada(id);
      setStop(s);
      const vs = await volumesDaParada(id, 50);
      setVolumes(vs);
      setName(s.contact_name || "");
    })();
  }, [id]);

  const confirmedCount = volumes.filter((v) => confirmed[v.id]).length;
  const allConfirmed = volumes.length > 0 && confirmedCount === volumes.length;
  const toggle = (vid) => setConfirmed((c) => ({ ...c, [vid]: !c[vid] }));
  const toggleAll = () => {
    if (allConfirmed) setConfirmed({});
    else setConfirmed(Object.fromEntries(volumes.map((v) => [v.id, true])));
  };

  const stepDone = { sig: signed, photo: !!photo, idOk: name.trim().length > 3 && doc.replace(/\D/g, "").length >= 8, vol: confirmedCount > 0 };
  const typeOk = receiverType && (receiverType !== "outro" || receiverTypeOther.trim().length >= 2);
  const canSubmit = stepDone.idOk && typeOk && signed && !!photo && confirmedCount > 0 && !saving;

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    // A foto fica no aparelho e sobe junto com a entrega (com ou sem conexão).
    const blobKey = `proof:${id}:${Date.now()}`;
    await putBlob(blobKey, await comprimirImagem(file));
    setPhoto({ blobKey, preview });
  };

  const submit = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    // Posição do APARELHO no momento da entrega (antes gravava a da parada — B-02).
    const posicao = await capturarPosicao();
    const assinaturaKey = `signature:${id}:${Date.now()}`;
    await putBlob(assinaturaKey, dataUrlParaBlob(signed));
    const r = await enviarProva({
      kind: "delivery",
      key: `delivery:${id}`,
      stop_id: id,
      route_id: stop.route_id,
      payload: {
        recebedor: {
          nome: name.trim(),
          documento: doc,
          titular: isHolder,
          tipo: receiverType,
          tipo_outro: receiverType === "outro" ? receiverTypeOther.trim() : null,
        },
        notes: notes.slice(0, 300),
        posicao,
        delivered_at: now,
        dispositivo: { ua: navigator.userAgent, volumes_conferidos: confirmedCount, volumes_total: volumes.length },
        anexos: [
          { campo: "assinatura", tipo: "assinatura_entrega", blobKey: assinaturaKey },
          ...(photo?.blobKey ? [{ campo: "foto", tipo: "foto_entrega", blobKey: photo.blobKey }] : []),
        ],
      },
    });
    setSaving(false);
    if (r.estado === "rejeitado") {
      setRejeicao(r.mensagem);
      return;
    }
    setOffline(r.estado === "offline");
    setShowSuccess(true);
  };

  if (!stop) {
    return (
      <div>
        <SubHeader title="Confirmar Entrega" />
        <div className="screen-pad pt-4"><div className="card h-40 animate-pulse" /></div>
      </div>
    );
  }

  return (
    <div>
      <SubHeader title="Confirmar Entrega" subtitle={`Parada • ${stop.recipient_name}`} />
      <div className="screen-pad pt-4 space-y-4">
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-body-lg font-extrabold"><Icon name="inventory_2" size={20} className="text-primary-deep" /> Volumes da Parada</div>
            {volumes.length > 0 && (
              <button type="button" onClick={toggleAll} className="text-body-md font-bold text-ink underline underline-offset-2">
                {allConfirmed ? "Desmarcar todos" : "Marcar todos"}
              </button>
            )}
          </div>
          <p className="text-body-sm text-muted-foreground">Toque em cada volume para confirmar a entrega</p>
          <div className="mt-3 space-y-2">
            {volumes.map((v) => {
              const on = !!confirmed[v.id];
              return (
                <button key={v.id} type="button" onClick={() => toggle(v.id)} className={`rp-tap flex w-full min-h-[56px] items-center gap-3 rounded-2xl border p-3.5 text-left transition active:scale-[0.99] ${on ? "border-transparent bg-brand-yellow/15" : "border-outline bg-card"}`}>
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${on ? "border-ink bg-ink text-white" : "border-outline bg-card"}`}>
                    {on && <Icon name="check" size={16} />}
                  </span>
                  <div className="flex-1">
                    <p className="text-body-md font-bold leading-tight">{v.vol_code || v.label || `Volume ${v.sequence ?? ""}`}</p>
                    {v.nf_number && <p className="text-body-sm text-muted-foreground">NF-e {v.nf_number}</p>}
                  </div>
                </button>
              );
            })}
            {volumes.length === 0 && <p className="text-body-md text-muted-foreground">Nenhum volume vinculado a esta parada.</p>}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-body-md font-bold">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full ${stepDone.sig ? "bg-status-green text-status-green-fg" : "bg-muted text-muted-foreground"}`}><Icon name={stepDone.sig ? "check" : "draw"} size={16} /></span>
            1 Assinatura Digital
            <span className={`ml-auto chip ${stepDone.sig ? "bg-status-green text-status-green-fg" : "bg-muted text-muted-foreground"}`}>{stepDone.sig ? "Concluído" : "Pendente"}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-body-md font-bold">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full ${stepDone.photo ? "bg-status-green text-status-green-fg" : "bg-muted text-muted-foreground"}`}><Icon name={stepDone.photo ? "check" : "photo_camera"} size={16} /></span>
            2 Foto Comprovante
            <span className={`ml-auto chip ${stepDone.photo ? "bg-status-green text-status-green-fg" : "bg-muted text-muted-foreground"}`}>{stepDone.photo ? "Concluído" : "Pendente"}</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-body-lg font-extrabold"><Icon name="badge" size={20} className="text-primary-deep" /> Identificação do Recebedor</div>
          <p className="text-label-sm text-muted-foreground">Obrigatório</p>
          <div className="mt-3 space-y-2">
            <MaskedInput label="Nome Completo de Quem Recebeu" icon="person" placeholder="Nome do recebedor" value={name} onValue={(m) => setName(m)} />
            <MaskedInput label="RG ou CPF do Recebedor" icon="fingerprint" mono placeholder="00.000.000-0" mask={maskRgOrCpf} value={doc} onValue={(m) => setDoc(m)} inputMode="numeric" />
            <div>
              <label className="mb-1.5 block text-label-sm text-muted-foreground">Tipo de Recebedor</label>
              <button type="button" onClick={() => setTypeSheet(true)} className="rp-tap flex min-h-[52px] w-full items-center gap-2 rounded-2xl border border-input bg-card px-3 text-left">
                <Icon name="group" size={20} className="text-muted-foreground" />
                <span className={`flex-1 py-3 text-body-md ${receiverType ? "font-semibold" : "text-muted-foreground"}`}>
                  {RECEIVER_TYPES.find((t) => t.value === receiverType)?.label || "Selecione..."}
                </span>
                <Icon name="expand_more" size={20} className="text-muted-foreground" />
              </button>
              {receiverType === "outro" && (
                <input
                  value={receiverTypeOther}
                  onChange={(e) => setReceiverTypeOther(e.target.value)}
                  placeholder="Especifique o tipo..."
                  className="mt-2 w-full rounded-2xl border border-input bg-card px-3 py-3 text-body-md outline-none focus:border-primary-container"
                />
              )}
            </div>
          </div>
          <label className="mt-3 flex items-center gap-2 text-body-md text-muted-foreground">
            <input type="checkbox" checked={isHolder} onChange={(e) => setIsHolder(e.target.checked)} className="h-4 w-4 rounded accent-primary-container" /> Recebedor é o titular ou responsável legal
          </label>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-body-lg font-extrabold"><Icon name="draw" size={20} className="text-primary-deep" /> Assinatura no Vidro</div>
          <p className="text-body-sm font-semibold text-primary-deep">Biometria Ativa • LAT: {stop.lat?.toFixed(4)} | LNG: {stop.lng?.toFixed(4)}</p>
          <div className="mt-3"><SignaturePad onChange={setSigned} label="Assine com o dedo ou caneta stylus sobre a linha" /></div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-body-lg font-extrabold"><Icon name="photo_camera" size={20} className="text-primary-deep" /> Comprovante Fotográfico</div>
          {photo ? (
            <div className="mt-3 relative rounded-2xl">
              <img src={photo.preview} alt="comprovante" className="h-44 w-full rounded-2xl object-cover" />
              <span className="absolute bottom-2 left-2 rounded-lg bg-primary-container px-2 py-1 text-label-sm text-primary-foreground">Foto anexada</span>
            </div>
          ) : (
            <label className="rp-tap mt-3 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-primary-container py-8 text-primary-deep">
              <Icon name="add_a_photo" size={28} />
              <span className="text-label-md">Toque para fotografar o canhoto</span>
              <input type="file" accept="image/*" capture="environment" onChange={onPhoto} className="hidden" />
            </label>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-body-lg font-extrabold"><Icon name="notes" size={20} className="text-primary-deep" /> Observações da Entrega</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 300))}
            rows={3}
            placeholder="Opcional"
            className="mt-2 w-full rounded-2xl border border-input bg-card p-3 text-body-md outline-none focus:border-primary-container"
          />
          <p className="text-right text-label-sm text-muted-foreground">{notes.length} / 300</p>
        </Card>

        <p className="text-center text-body-md font-bold text-muted-foreground">
          {confirmedCount} de {volumes.length} volumes confirmados
        </p>
        <Button className="w-full" loading={saving} disabled={!canSubmit} onClick={submit}>
          <Icon name="task_alt" size={20} /> Concluir e Transmitir Entrega
        </Button>
        <p className="text-center text-body-sm font-semibold text-primary-deep">Sincronização imediata em nuvem ativa</p>
      </div>

      {/* Receiver type sheet */}
      <Sheet open={typeSheet} onClose={() => setTypeSheet(false)} title="Tipo de Recebedor">
        <div className="space-y-2">
          {RECEIVER_TYPES.map((t) => (
            <SelectionRow
              key={t.value}
              icon="group"
              label={t.label}
              active={receiverType === t.value}
              onClick={() => {
                setReceiverType(t.value);
                setTypeSheet(false);
              }}
            />
          ))}
        </div>
      </Sheet>

      {showSuccess && (
        <ResultOverlay
          type="success"
          message="Entrega confirmada!"
          detail={
            offline
              ? "Salvo no dispositivo — sincroniza ao voltar a conexão"
              : receiverType === "outro"
                ? `Recebedor: ${receiverTypeOther}`
                : RECEIVER_TYPES.find((t) => t.value === receiverType)?.label
          }
          onClose={() => navigate("/")}
        />
      )}
      {rejeicao && (
        <ResultOverlay
          type="error"
          message="Entrega não registrada"
          detail={rejeicao}
          onClose={() => setRejeicao(null)}
        />
      )}
    </div>
  );
}