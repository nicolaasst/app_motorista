import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/rp/Icon";

const brl = (n) => Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—");
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  const today = new Date();
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  const prefix = sameDay(d, today) ? "Hoje, " : sameDay(d, yest) ? "Ontem, " : "";
  return prefix + d.toLocaleDateString("pt-BR", { day: "2-digit", month: sameDay(d, today) || sameDay(d, yest) ? "long" : "long", year: sameDay(d, today) || sameDay(d, yest) ? undefined : "numeric" });
};
const fmtDuration = (start, end) => {
  if (!start || !end) return "—";
  const mins = Math.round((new Date(end) - new Date(start)) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m` : `${m}m`;
};

function statusFor(route, stops) {
  const isDone = ["encerrada", "retorno_ok", "concluida"].includes(route.status);
  if (!isDone) {
    const map = {
      planejada: { l: "Planejada", c: "gray" },
      checklist_ok: { l: "Checklist OK", c: "blue" },
      em_operacao: { l: "Em Operação", c: "amber" },
    };
    return map[route.status] || { l: route.status, c: "gray" };
  }
  const hasFail = stops.some((s) => s.status === "falha");
  const hasPending = stops.some((s) => s.status === "nao_iniciada" || s.status === "reagendada");
  if (hasFail || hasPending) return { l: "Concluído c/ Pendência", c: "amber" };
  return { l: "100% Concluído", c: "green" };
}

export function RouteHistoryCard({ route, stops }) {
  const navigate = useNavigate();
  const routeStops = stops.filter((s) => s.route_id === route.id);
  const entregues = routeStops.filter((s) => s.status === "entregue").length;
  const insucessos = routeStops.filter((s) => s.status === "falha").length;
  const totalParadas = routeStops.length || route.planned_stops || 0;
  const km = route.odometer_end && route.odometer_start ? Math.max(0, route.odometer_end - route.odometer_start) : route.planned_km || 0;
  const st = statusFor(route, routeStops);
  const originName = route.origin?.name || "Doca Central (Origem)";
  const slaOk = insucessos === 0 && entregues === totalParadas;
  const destColor =
    st.c === "green" ? "bg-status-green-fg" : st.c === "amber" ? "bg-status-amber-fg" : "bg-muted-foreground";

  return (
    <button
      onClick={() => navigate(`/history/${route.id}`)}
      className="rp-tap w-full rounded-2xl bg-card p-5 text-left shadow-elevated transition-transform active:scale-[0.99]"
    >
      {/* Top: date + status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="calendar_today" size={20} className="text-primary-deep" />
          <span className="text-label-md font-bold">{fmtDate(route.date)}</span>
        </div>
        <span className={`chip status-${st.c}`}>
          <span className="h-2 w-2 rounded-full bg-current" />
          {st.l}
        </span>
      </div>

      {/* Visual trajeto: origin → destination */}
      <div className="mt-3.5 flex items-start gap-3">
        <div className="flex flex-col items-center pt-1">
          <span className="h-2.5 w-2.5 rounded-full bg-ink" />
          <span className="my-0.5 h-7 w-0.5 bg-border" />
          <span className={`h-2.5 w-2.5 rounded-full ${destColor}`} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-body-sm text-muted-foreground">{originName}</span>
            <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-code-sm font-bold text-muted-foreground">
              {fmtTime(route.started_at)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="truncate text-headline-sm font-bold">{route.sector || route.code}</span>
            <span
              className={`shrink-0 rounded px-2 py-0.5 text-code-sm font-bold ${
                st.c === "green" ? "bg-status-green-bg text-status-green-fg" : "bg-muted text-muted-foreground"
              }`}
            >
              {fmtTime(route.finished_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Romaneio box */}
      <div className="mt-4 flex items-center justify-between rounded-xl bg-muted p-3">
        <div className="flex flex-col">
          <span className="text-label-sm text-muted-foreground">Romaneio Fiscal</span>
          <span className="text-code-md font-bold tracking-wider">{route.code}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-label-sm font-bold text-status-green-fg shadow-sm">
          <Icon name="receipt_long" size={16} />
          {entregues} Canhotos OK
        </div>
      </div>

      {/* Metrics grid */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="flex items-center gap-2">
          <Icon name="straighten" size={18} className="text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-label-sm text-muted-foreground">Distância</span>
            <span className="text-body-md font-bold">{brl(km)} km</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="inventory_2" size={18} className="text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-label-sm text-muted-foreground">Paradas</span>
            <span className="text-body-md font-bold">{entregues} de {totalParadas}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="schedule" size={18} className="text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-label-sm text-muted-foreground">Duração</span>
            <span className="text-body-md font-bold">{fmtDuration(route.started_at, route.finished_at)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between pt-2">
        <span className="flex items-center gap-1 text-label-sm text-muted-foreground">
          <Icon name="verified" size={16} className="text-primary-deep" />
          {slaOk ? "SLA 100% de pontualidade" : `${insucessos} ocorrência(s)`}
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
          <Icon name="chevron_right" size={20} className="text-foreground" />
        </span>
      </div>
    </button>
  );
}

export default RouteHistoryCard;