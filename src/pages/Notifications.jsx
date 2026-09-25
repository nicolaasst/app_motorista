import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getDriver } from "@/lib/driver";
import { SubHeader } from "@/components/rp/SubHeader";
import { Icon } from "@/components/rp/Icon";
import { StatusPill } from "@/components/rp/StatusPill";
import { LineArt } from "@/components/rp/LineArt";
import { EmptyState } from "@/components/rp/EmptyState";
import { ILLUSTRATIONS } from "@/lib/illustrations";
import { PullToRefresh } from "@/components/rp/PullToRefresh";

const TYPE_META = {
  rota: { s: "blue", icon: "local_shipping" },
  recibo: { s: "green", icon: "receipt_long" },
  chamado: { s: "amber", icon: "support_agent" },
  alerta: { s: "red", icon: "warning" },
  sistema: { s: "gray", icon: "system_update" },
};
const fmtTime = (iso) => (iso ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—");

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);

  const load = async () => {
    const { driverId } = await getDriver();
    const list = await base44.entities.Notification.filter({ driver_id: driverId }, "-created_date", 50);
    setItems(list);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const open = async (n) => {
    if (!n.read) await base44.entities.Notification.update(n.id, { read: true });
    if (n.deep_link) { navigate(n.deep_link); return; }
    load();
  };

  return (
    <div>
      <SubHeader title="Notificações" subtitle="Avisos da central" />
      <PullToRefresh onRefresh={load}>
      <div className="screen-pad pt-4 space-y-3">
        {items === null && <div className="space-y-3"><div className="card h-20 animate-pulse" /><div className="card h-20 animate-pulse" /></div>}
        {items?.length === 0 && (
          <EmptyState
            illustration={ILLUSTRATIONS.circleThinking}
            title="Nada por aqui ainda"
            subtitle="Avisos da central aparecem aqui"
          />
        )}
        {items?.map((n) => {
          const m = TYPE_META[n.type] || TYPE_META.sistema;
          return (
            <button key={n.id} onClick={() => open(n)} className={`card w-full p-4 text-left ${n.read ? "opacity-70" : ""}`}>
              <div className="flex items-start gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl status-${m.s}`}><Icon name={m.icon} size={20} /></span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-body-md font-bold leading-tight">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary-container" />}
                  </div>
                  {n.body && <p className="mt-0.5 text-body-sm text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-label-sm text-muted-foreground">{fmtTime(n.created_at)}</p>
                </div>
                <StatusPill status={m.s} className="mt-0.5">{n.type}</StatusPill>
              </div>
            </button>
          );
        })}
      </div>
      </PullToRefresh>
    </div>
  );
}