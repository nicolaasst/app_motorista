import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { SubHeader } from "@/components/rp/SubHeader";
import { Icon } from "@/components/rp/Icon";
import { StatusPill } from "@/components/rp/StatusPill";
import { Card } from "@/components/rp/Card";
import { Button } from "@/components/rp/Button";
import { ConfirmDialog } from "@/components/rp/ConfirmDialog";
import { BarcodeScanner } from "@/components/rp/BarcodeScanner";

const pad = (n) => String(n).padStart(2, "0");

const STATUS_META = {
  em_rota: { s: "blue", t: "A Caminho" },
  em_atendimento: { s: "amber", t: "Em Atendimento" },
  nao_iniciada: { s: "gray", t: "Pendente" },
  entregue: { s: "green", t: "Entregue" },
  falha: { s: "red", t: "Falha" },
  reagendada: { s: "gray", t: "Reagendada" },
};

const KIND_ICON = { sensivel: "inventory_2", seco: "package_2", documento: "mail" };
const KIND_LABEL = { sensivel: "Sensível", seco: "Seco", documento: "Documento" };

const digits = (s) => (s || "").replace(/\D/g, "");

export default function StopDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanMode, setScanMode] = useState("volume");
  const [scanResult, setScanResult] = useState(null);
  const [scanKind, setScanKind] = useState("success");
  const [scannedCount, setScannedCount] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [biping, setBiping] = useState(false);

  const load = async () => {
    const stop = await base44.entities.Stop.get(id);
    const [route, volumes] = await Promise.all([
      base44.entities.Route.get(stop.route_id),
      base44.entities.Volume.filter({ stop_id: id }, "created_date", 50),
    ]);
    setData({ stop, route, volumes });
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (!data) {
    return (
      <div>
        <SubHeader title="Parada" />
        <div className="screen-pad pt-4"><div className="card h-40 animate-pulse" /><div className="card mt-4 h-32 animate-pulse" /></div>
      </div>
    );
  }

  const { stop, route, volumes } = data;
  const meta = STATUS_META[stop.status] || STATUS_META.nao_iniciada;
  const fullAddress = [stop.address_line, stop.district, stop.city, stop.state, stop.cep].filter(Boolean).join(" - ");
  const phone = digits(stop.contact_phone);
  const pendingCount = volumes.filter((v) => v.scan_status !== "bipado").length;
  const allBiped = volumes.length > 0 && pendingCount === 0;

  const copy = () => {
    navigator.clipboard?.writeText(fullAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bipar = async (v) => {
    setBiping(true);
    const now = new Date().toISOString();
    const prevVolumes = volumes;
    setData((d) => ({ ...d, volumes: d.volumes.map((x) => (x.id === v.id ? { ...x, scan_status: "bipado", scanned_at: now } : x)) }));
    try {
      await base44.entities.Volume.update(v.id, { scan_status: "bipado", scanned_at: now });
      await load();
    } catch {
      setData((d) => ({ ...d, volumes: prevVolumes }));
    }
    setBiping(false);
  };

  const openScanner = (mode) => {
    setScanMode(mode);
    setScanResult(null);
    setScanKind("success");
    setScannedCount(0);
    setScanOpen(true);
  };

  const handleScan = async (code) => {
    const now = new Date().toISOString();
    if (scanMode === "nf") {
      // Batch: match all volumes with this nf_number
      const matched = volumes.filter(
        (v) => v.nf_number === code || v.nfe_key === code
      );
      if (matched.length === 0) {
        setScanKind("invalid");
        setScanResult(`NF ${code} não pertence a esta parada`);
        return;
      }
      const alreadyAll = matched.every((v) => v.scan_status === "bipado");
      if (alreadyAll) {
        setScanKind("duplicate");
        setScanResult(`NF ${code} já bipada`);
        return;
      }
      setBiping(true);
      const matchedIds = new Set(matched.map((m) => m.id));
      const prevVolumes = volumes;
      setData((d) => ({ ...d, volumes: d.volumes.map((x) => (matchedIds.has(x.id) ? { ...x, scan_status: "bipado", scanned_at: now } : x)) }));
      try {
        await base44.entities.Volume.updateMany(
          { stop_id: id, nf_number: code },
          { $set: { scan_status: "bipado", scanned_at: now } }
        );
        await load();
      } catch {
        setData((d) => ({ ...d, volumes: prevVolumes }));
      }
      setBiping(false);
      setScannedCount((c) => c + 1);
      setScanKind("success");
      setScanResult(`${matched.length} volume(s) da NF ${code} bipados`);
    } else {
      // Individual: match by ean, vol_code, or nf_number
      const vol = volumes.find(
        (v) => v.ean === code || v.vol_code === code || v.nf_number === code
      );
      if (!vol) {
        setScanKind("invalid");
        setScanResult(`Código ${code} não pertence a esta parada`);
        return;
      }
      if (vol.scan_status === "bipado") {
        setScanKind("duplicate");
        setScanResult(`${vol.label || vol.vol_code} já bipado`);
        return;
      }
      setBiping(true);
      const prevVolumes = volumes;
      setData((d) => ({ ...d, volumes: d.volumes.map((x) => (x.id === vol.id ? { ...x, scan_status: "bipado", scanned_at: now } : x)) }));
      try {
        await base44.entities.Volume.update(vol.id, { scan_status: "bipado", scanned_at: now });
        await load();
      } catch {
        setData((d) => ({ ...d, volumes: prevVolumes }));
      }
      setBiping(false);
      setScannedCount((c) => c + 1);
      setScanKind("success");
      setScanResult(`${vol.label || vol.vol_code} bipado`);
    }
  };

  const onConfirm = () => {
    if (allBiped) navigate(`/stop/${id}/confirm`);
    else setConfirmOpen(true);
  };

  return (
    <div>
      <SubHeader
        title={`Parada #${pad(stop.sequence)} de ${route.planned_stops}`}
        subtitle={stop.recipient_name}
        right={<StatusPill status={meta.s}>{meta.t}</StatusPill>}
      />
      <div className="screen-pad pt-4 space-y-4">
        <div className="flex items-center gap-2 text-label-md text-primary-deep">
          <Icon name="traffic" size={18} /> Trânsito Livre
        </div>

        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-onyx text-lime text-code-md">{pad(stop.sequence)}</span>
            <div>
              <span className="chip bg-accent text-accent-foreground"><Icon name="domain" size={14} /> Ponto {stop.kind === "comercial" ? "Comercial" : stop.kind}</span>
              <h1 className="mt-1 text-headline-sm">{stop.recipient_name}</h1>
            </div>
          </div>
          {stop.doc_cnpj && <p className="mt-2 text-body-sm text-muted-foreground">CNPJ: {stop.doc_cnpj}</p>}
          <div className="mt-3 flex items-start gap-2 rounded-2xl bg-muted p-3">
            <Icon name="pin_drop" size={18} className="mt-0.5 shrink-0 text-primary-deep" />
            <div className="flex-1">
              <p className="text-body-md font-semibold">{stop.address_line}</p>
              <p className="text-body-sm text-muted-foreground">{[stop.district, `${stop.city} - ${stop.state}`, stop.cep].filter(Boolean).join(" - ")}</p>
            </div>
            <button onClick={copy} aria-label="Copiar endereço" className="rp-tap text-muted-foreground">
              <Icon name="content_copy" size={18} />
            </button>
          </div>
          {copied && <p className="mt-1 flex items-center gap-1 text-body-sm font-semibold text-primary-deep"><Icon name="done" size={14} /> Endereço copiado!</p>}
          <div className="mt-3 flex items-center gap-2 text-body-md font-semibold">
            <Icon name="schedule" size={18} className="text-primary-deep" /> Janela de Entrega:
            <span className="text-code-md text-primary-deep">{stop.window_end ? `${stop.window_start} - ${stop.window_end}` : stop.window_start}</span>
          </div>
        </Card>

        {(stop.contact_name || phone) && (
          <Card>
            <p className="text-label-sm uppercase text-muted-foreground">Responsável</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground"><Icon name="person" size={20} /></span>
              <div className="flex-1">
                <p className="text-body-md font-bold">{stop.contact_name || "—"}</p>
                {stop.contact_role && <p className="text-body-sm text-muted-foreground">{stop.contact_role}</p>}
              </div>
            </div>
            {phone && (
              <div className="mt-3 flex gap-2">
                <a
                  href={`https://wa.me/55${phone}?text=${encodeURIComponent(`Olá ${stop.contact_name || ""}, sou o motorista da NGS chegando com sua entrega`)}`}
                  className="rp-tap flex flex-1 items-center justify-center gap-2 rounded-full border border-primary-container py-2.5 text-label-md text-primary-deep"
                >
                  <Icon name="chat" size={18} /> WhatsApp
                </a>
                <a href={`tel:${phone}`} className="rp-tap flex flex-1 items-center justify-center gap-2 rounded-full border border-border py-2.5 text-label-md">
                  <Icon name="phone_in_talk" size={18} /> Ligar
                </a>
              </div>
            )}
          </Card>
        )}

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-body-lg font-extrabold">Volumes da Entrega</p>
            <span className="chip bg-muted text-muted-foreground">{volumes.length} {volumes.length === 1 ? "item" : "itens"}</span>
          </div>
          {volumes[0]?.nf_number && <p className="text-code-sm text-primary-deep">NF-e {volumes[0].nf_number}</p>}
          <div className="mt-3 space-y-2">
            {volumes.map((v) => (
              <div key={v.id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                <Icon name={KIND_ICON[v.kind] || "package_2"} size={20} className="text-primary-deep" />
                <div className="flex-1">
                  <p className="text-body-md font-bold leading-tight">{v.label}</p>
                  <p className="text-code-sm text-muted-foreground">EAN: {v.ean} • {v.weight_kg} kg</p>
                </div>
                <StatusPill status={v.scan_status === "bipado" ? "green" : "amber"}>
                  {v.scan_status === "bipado" ? "Bipado" : "Pendente"}
                </StatusPill>
              </div>
            ))}
            {volumes.length === 0 && <p className="mt-2 text-body-md text-muted-foreground">Nenhum volume catalogado para esta parada.</p>}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => openScanner("volume")}
              className="rp-tap flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary-container py-3 text-label-md text-primary-deep"
            >
              <Icon name="barcode_scanner" size={20} /> Bipar Volume
            </button>
            <button
              onClick={() => openScanner("nf")}
              className="rp-tap flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink py-3 text-label-md text-ink"
            >
              <Icon name="qr_code_2" size={20} /> Bipar NF (Lote)
            </button>
          </div>
        </Card>

        {stop.access_instructions && (
          <div className="rounded-2xl border border-status-blue bg-status-blue/40 p-4">
            <div className="flex items-center gap-2 text-body-md font-bold text-status-blue-fg"><Icon name="info" size={18} /> Instruções de Acesso</div>
            <p className="mt-1 text-body-md text-status-blue-fg">{stop.access_instructions}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pb-2">
          <Button variant="primary" onClick={onConfirm}><Icon name="task_alt" size={20} /> Confirmar Entrega</Button>
          <Button variant="outline" className="!border-destructive !text-destructive" onClick={() => navigate(`/stop/${id}/failure`)}><Icon name="report_problem" size={20} /> Ocorrência</Button>
        </div>
      </div>

      {scanOpen && (
        <BarcodeScanner
          mode={scanMode}
          onScan={handleScan}
          lastResult={scanResult}
          resultKind={scanKind}
          scannedCount={scannedCount}
          onClose={() => setScanOpen(false)}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => { setConfirmOpen(false); navigate(`/stop/${id}/confirm`); }}
        title={`${pendingCount} volume(s) pendente(s)`}
        description="Bipar agora ou registrar entrega parcial?"
        confirmLabel="Entrega parcial"
        cancelLabel="Bipar agora"
      />
    </div>
  );
}