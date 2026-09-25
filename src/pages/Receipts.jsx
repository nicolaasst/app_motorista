import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getDriver } from "@/lib/driver";
import { Icon } from "@/components/rp/Icon";
import { LineArt } from "@/components/rp/LineArt";
import { EmptyState } from "@/components/rp/EmptyState";
import { ILLUSTRATIONS } from "@/lib/illustrations";
import { EMPTY_VALUE } from "@/lib/utils";
import { PullToRefresh } from "@/components/rp/PullToRefresh";

const TABS = [
  { id: "todos", label: "Todos" },
  { id: "pendente_assinatura", label: "Aguardando Assinatura" },
  { id: "assinado", label: "Assinados" },
  { id: "pago", label: "Pagos" },
];
const STATUS_META = {
  previsto: { s: "gray", t: "Previsto" },
  pendente_assinatura: { s: "amber", t: "Aguardando Assinatura" },
  em_contestacao: { s: "red", t: "Em Contestação" },
  assinado: { s: "blue", t: "Assinado" },
  pago: { s: "green", t: "Assinado & Pago" },
};
const brl = (n) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (iso) => iso ? new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : EMPTY_VALUE;
const periodLabel = (r) => r ? `${fmtDate(r.period_start)} a ${fmtDate(r.period_end)}` : EMPTY_VALUE;

export default function Receipts() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState(null);
  const [tab, setTab] = useState("todos");

  const load = async () => {
    const { driverId } = await getDriver();
    const r = await base44.entities.Receipt.filter({ driver_id: driverId }, "-period_start", 60);
    setReceipts(r);
  };

  useEffect(() => {
    load();
  }, []);

  const list = (receipts || []).filter((r) => (tab === "todos" ? true : r.status === tab));
  const current = (receipts || []).find((r) => r.status === "pendente_assinatura") || (receipts || [])[0];
  const lastPaid = (receipts || []).find((r) => r.status === "pago");
  const pendingCount = (receipts || []).filter((r) => r.status === "pendente_assinatura").length;

  return (
    <PullToRefresh onRefresh={load}>
    <div className="screen-pad pt-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg leading-tight">Recibos</h1>
          <p className="flex items-center gap-1 text-body-sm font-semibold text-status-green-fg"><span className="h-1.5 w-1.5 rounded-full bg-status-green-fg" /> Sincronizado • Fechamento Quinzenal</p>
        </div>
      </header>

      <div className="mt-4 card overflow-hidden">
        <div className="bg-muted p-4 text-foreground">
          <div className="flex items-center gap-2 text-label-sm text-muted-foreground">
            <Icon name="verified" size={16} /> Base ERP Ativa
            <span className="ml-auto chip bg-card text-foreground">{current ? STATUS_META[current.status]?.t : EMPTY_VALUE}</span>
          </div>
          <p className="mt-1 text-body-md font-semibold text-muted-foreground">{current ? periodLabel(current) : EMPTY_VALUE}</p>
          <p className="text-display-lg font-extrabold">{current ? brl(current.net) : EMPTY_VALUE}</p>
          <p className="mt-1 flex items-center gap-1 text-body-sm text-muted-foreground"><Icon name="event" size={14} /> Data de depósito prevista: <b className="text-foreground">{current?.deposit_date ? fmtDate(current.deposit_date) : EMPTY_VALUE}</b></p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border">
          <div className="p-4">
            <div className="flex items-center gap-1.5 text-label-sm text-status-green-fg"><Icon name="check_circle" size={16} /> Último Pago</div>
            <p className="mt-1 text-headline-sm font-extrabold">{lastPaid ? brl(lastPaid.net) : EMPTY_VALUE}</p>
            <p className="text-body-sm text-muted-foreground">{lastPaid?.paid_at ? fmtDate(lastPaid.paid_at) : EMPTY_VALUE}</p>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-1.5 text-label-sm text-status-amber-fg"><Icon name="pending_actions" size={16} /> Pendentes</div>
            <p className="mt-1 text-body-md font-extrabold">{pendingCount} • Requer assinatura</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-label-sm font-bold transition ${tab === t.id ? "bg-primary-container text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{t.label}</button>
        ))}
      </div>

      <div className="mt-3 space-y-4">
        {receipts === null && <><div className="card h-28 animate-pulse" /><div className="card h-28 animate-pulse" /></>}
        {list.map((r) => {
          const m = STATUS_META[r.status] || STATUS_META.previsto;
          const isPending = r.status === "pendente_assinatura";
          return (
            <div key={r.id}>
              <p className="mb-1 text-label-sm text-muted-foreground">{periodLabel(r)}</p>
              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-body-md font-extrabold">{r.code}</p>
                  <div className="flex items-center gap-2">
                    {(r.status === "pago" || r.status === "assinado") && r.pdf_url && (
                      <a href={r.pdf_url} target="_blank" rel="noreferrer" aria-label="Baixar PDF" className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-label-sm font-bold text-ink">
                        <Icon name="picture_as_pdf" size={16} /> PDF
                      </a>
                    )}
                    <span className={`chip status-${m.s}`}>{m.t}</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-body-sm font-semibold text-muted-foreground">{r.fortnight === 1 ? "1ª Quinzena" : "2ª Quinzena"}</p>
                    <p className="text-headline-lg font-extrabold">{brl(r.net)}</p>
                  </div>
                  {isPending ? (
                    <button onClick={() => navigate(`/receipts/${r.id}`)} className="flex items-center gap-1.5 rounded-xl bg-primary-container px-3 py-2 text-label-sm font-bold text-primary-foreground"><Icon name="draw" size={16} /> Revisar e Assinar</button>
                  ) : (
                    <button onClick={() => navigate(`/receipts/${r.id}`)} className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-label-sm font-bold text-primary-deep"><Icon name="receipt_long" size={16} /> Visualizar Comprovante</button>
                  )}
                </div>
                {r.gross && r.gross !== r.net && (
                  <div className="mt-3 border-t border-border pt-3 text-body-sm text-muted-foreground">
                    <p>Bruto {brl(r.gross)} • Descontos {brl(r.gross - r.net)}</p>
                    {r.paid_via && <p className="font-bold text-status-green-fg">Pago {r.paid_at ? fmtDate(r.paid_at) : ""} • {r.paid_via}</p>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {receipts !== null && list.length === 0 && (
          <EmptyState
            illustration={ILLUSTRATIONS.circleThinking}
            title="Nada por aqui ainda"
            subtitle="Seus recibos quinzenais aparecem aqui assim que forem gerados"
          />
        )}
      </div>

      <div className="mt-6 card p-4">
        <div className="flex items-center gap-2 text-body-md font-bold"><Icon name="help" size={20} className="text-primary-deep" /> Suporte Financeiro</div>
        <p className="mt-1 text-body-sm text-muted-foreground">Dúvidas sobre cálculo de diárias, descontos de combustível ou fechamento de metas?</p>
        <button onClick={() => navigate("/support")} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-body-md font-bold text-accent-foreground"><Icon name="chat" size={18} /> Falar com o Financeiro NGS</button>
      </div>
    </div>
    </PullToRefresh>
  );
}