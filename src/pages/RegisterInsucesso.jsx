import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { SubHeader } from "@/components/rp/SubHeader";
import { Icon } from "@/components/rp/Icon";
import { StatusPill } from "@/components/rp/StatusPill";
import { Card } from "@/components/rp/Card";
import { Button } from "@/components/rp/Button";
import { ConfirmDialog } from "@/components/rp/ConfirmDialog";
import { SelectionRow } from "@/components/rp/SelectionRow";
import { ResultOverlay } from "@/components/rp/ResultOverlay";
import { enqueue, putBlob } from "@/lib/offlineQueue";

const pad = (n) => String(n).padStart(2, "0");

const REASONS = [
  { value: "cliente_ausente", icon: "door_front", label: "Cliente Ausente / Fechado", desc: "Sem resposta no interfone, porta trancada ou expediente finalizado", photo: true },
  { value: "endereco_nao_localizado", icon: "wrong_location", label: "Endereço Não Localizado / Incorreto", desc: "Numeração inexistente, logradouro não confere no GPS", photo: true },
  { value: "recusado", icon: "do_not_disturb_on", label: "Recusado pelo Destinatário", desc: "Mercadoria não solicitada, desacordo comercial ou pedido cancelado", photo: false },
  { value: "avaria", icon: "broken_image", label: "Avaria ou Dano no Produto", desc: "Foto Obrigatória • Embalagem rasgada, vazamento ou integridade violada", photo: true },
  { value: "acesso_risco", icon: "minor_crash", label: "Problema de Acesso / Risco", desc: "Bloqueio policial, via interditada ou restrição física do veículo", photo: true },
  { value: "outro", icon: "more_horiz", label: "Outro Motivo Operacional", desc: "Exige detalhamento obrigatório no campo de observações", photo: false },
];

export default function RegisterInsucesso() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stop, setStop] = useState(null);
  const [volumes, setVolumes] = useState([]);
  const [reason, setReason] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [obs, setObs] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await base44.entities.Stop.get(id);
      setStop(s);
      const vs = await base44.entities.Volume.filter({ stop_id: id }, "created_date", 50);
      setVolumes(vs);
    })();
  }, [id]);

  const reasonObj = REASONS[reason];
  const needsPhoto = reasonObj?.photo;
  const needsObs = reason === 5;
  const canSubmit = reason !== null && (!needsPhoto || photo) && (!needsObs || obs.length >= 10) && !saving;

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    // Sem conexão a evidência fica no dispositivo e sobe junto com a ocorrência.
    if (!navigator.onLine) {
      const blobKey = `failure:${id}:${Date.now()}`;
      await putBlob(blobKey, file);
      setPhoto({ blobKey, preview });
      return;
    }
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      setPhoto({ file_uri, preview });
    } catch {
      const blobKey = `failure:${id}:${Date.now()}`;
      await putBlob(blobKey, file);
      setPhoto({ blobKey, preview });
    }
  };

  const submit = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    const base = {
      reason: reasonObj.value,
      notes: obs.slice(0, 300),
      lat: stop?.lat,
      lng: stop?.lng,
      reported_at: now,
    };
    // Offline (ou foto ainda local): entra na fila e sobe ao sincronizar.
    if (!navigator.onLine || photo?.blobKey) {
      enqueue({
        kind: "failure",
        key: `failure:${id}`,
        stop_id: id,
        route_id: stop?.route_id,
        payload: {
          ...base,
          blobKey: photo?.blobKey,
          photoUri: photo?.file_uri,
          returnVolumes: volumes.length > 0,
        },
      });
      setOffline(true);
      setSaving(false);
      setConfirmOpen(false);
      setShowResult(true);
      return;
    }
    await base44.entities.FailureReport.create({
      stop_id: id,
      ...base,
      photos: photo ? [{ url: photo.file_uri, taken_at: now, lat: stop?.lat, lng: stop?.lng }] : [],
      contact_attempts: [],
      sync_status: "ok",
    });
    await base44.entities.Stop.update(id, { status: "falha", finished_at: now });
    if (volumes.length) {
      await base44.entities.Volume.updateMany({ stop_id: id }, { $set: { return_status: "devolver" } });
    }
    setSaving(false);
    setShowResult(true);
  };

  if (!stop) {
    return (
      <div>
        <SubHeader title="Registrar Insucesso" />
        <div className="screen-pad pt-4"><div className="card h-32 animate-pulse" /></div>
      </div>
    );
  }

  return (
    <div>
      <SubHeader title="Registrar Insucesso" subtitle="Parada Operacional" right={<Icon name="report_problem" size={22} className="text-destructive" />} />
      <div className="screen-pad pt-4 space-y-4">
        <div className="flex items-center gap-3 rounded-2xl bg-status-red/50 p-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-status-red text-status-red-fg text-code-md">{pad(stop.sequence)}</span>
          <div>
            <p className="text-body-lg font-extrabold">{stop.recipient_name}</p>
            <p className="text-body-sm text-muted-foreground">{volumes.length} volume(s) da parada</p>
          </div>
          <StatusPill status="red" className="ml-auto">Insucesso</StatusPill>
        </div>

        <div className="flex items-start gap-2 rounded-2xl border border-status-blue bg-status-blue/40 p-3 text-body-md text-status-blue-fg">
          <Icon name="info" size={18} className="mt-0.5 shrink-0" />
          <p><b>Notificação Imediata à Central</b> — O romaneio técnico será reordenado, o cliente formalmente notificado e a central de tráfego registrará a ocorrência em tempo real.</p>
        </div>

        <div>
          <p className="mb-2 text-body-lg font-extrabold">Motivo Principal da Falha <span className="text-label-sm text-muted-foreground">• SELEÇÃO ÚNICA</span></p>
          <div className="space-y-2">
            {REASONS.map((r, i) => (
              <SelectionRow
                key={r.value}
                icon={r.icon}
                label={r.label}
                description={r.desc}
                active={reason === i}
                onClick={() => setReason(i)}
              />
            ))}
          </div>
        </div>

        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-body-lg font-extrabold"><Icon name="photo_camera" size={20} className="text-primary-deep" /> Evidência Fotográfica</div>
            <span className="chip bg-status-green text-status-green-fg"><Icon name="my_location" size={14} /> GPS ATIVO</span>
          </div>
          {photo ? (
            <div className="mt-3 relative rounded-2xl">
              <img src={photo.preview} alt="evidência" className="h-40 w-full rounded-2xl object-cover" />
              <button onClick={() => setPhoto(null)} aria-label="Remover foto" className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white">
                <Icon name="close" size={16} />
              </button>
            </div>
          ) : (
            <label className={`rp-tap mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-3 text-label-md ${needsPhoto ? "border-destructive text-destructive" : "border-primary-container text-primary-deep"}`}>
              <Icon name="add_a_photo" size={20} /> {needsPhoto ? "Foto obrigatória • Fachada ou avaria" : "Adicionar Foto (opcional)"}
              <input type="file" accept="image/*" capture="environment" onChange={onPhoto} className="hidden" />
            </label>
          )}
          <p className="mt-2 flex items-center gap-1 text-body-sm font-semibold text-primary-deep"><Icon name="verified" size={14} /> Carimbo temporal e coordenadas anexados ao registro.</p>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-body-lg font-extrabold"><Icon name="check_circle" size={20} className="text-primary-deep" /> Observações da Ocorrência</div>
          <textarea
            value={obs}
            onChange={(e) => setObs(e.target.value.slice(0, 300))}
            rows={3}
            placeholder="Detalhe o que ocorreu (mín. 10 caracteres)..."
            className="mt-2 w-full rounded-2xl border border-input bg-card p-3 text-body-md outline-none focus:border-primary-container"
          />
          <p className="text-right text-label-sm text-muted-foreground">{obs.length} / 300</p>
        </Card>

        <div className="grid grid-cols-2 gap-3 pb-2">
          <Button variant="outline" onClick={() => navigate(-1)}><Icon name="undo" size={20} /> Cancelar</Button>
          <Button variant="danger" disabled={!canSubmit} loading={saving} onClick={() => setConfirmOpen(true)}><Icon name="cancel" size={20} /> Confirmar Falha</Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={submit}
        title="Confirmar insucesso?"
        description={`${volumes.length} volume(s) será(ão) marcado(s) para devolução à doca.`}
        confirmLabel="Confirmar"
        danger
      />

      {showResult && (
        <ResultOverlay
          type="occurrence"
          message="Ocorrência registrada"
          detail={
            offline
              ? "Salvo no dispositivo — sincroniza ao voltar a conexão"
              : `${volumes.length} volume(s) para devolução`
          }
          onClose={() => navigate("/")}
        />
      )}
    </div>
  );
}