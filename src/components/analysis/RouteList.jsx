import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/rp/Icon";

const brl = (n) =>
  Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtDate = (iso) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—";

export function RouteList({ routes }) {
  const navigate = useNavigate();

  if (!routes.length) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-card p-8 text-center shadow-elevated">
        <Icon name="alt_route" size={32} className="text-muted-foreground" />
        <p className="text-body-md font-bold">Nenhuma rota no período</p>
        <p className="text-body-sm text-muted-foreground">Selecione outro período para ver os trajetos</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {routes.map((r) => (
        <button
          key={r.id}
          onClick={() => navigate(`/history/${r.id}`)}
          className="rp-tap flex flex-col gap-2 rounded-2xl bg-card p-4 text-left shadow-elevated transition-transform active:scale-[0.99]"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col">
              <span className="text-label-sm text-muted-foreground">{fmtDate(r.date)}</span>
              <h3 className="truncate text-headline-sm font-bold">{r.sector || r.code}</h3>
            </div>
            <span className={`chip status-${r.hasPending ? "amber" : "green"} shrink-0`}>
              <span className="h-2 w-2 rounded-full bg-current" />
              {r.hasPending ? "Com Pendência" : "100% SLA"}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-code-md font-bold text-muted-foreground">{r.code}</span>
            <div className="flex items-center gap-3 text-body-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Icon name="straighten" size={16} className="text-muted-foreground" />
                {brl(r.km)} km
              </span>
              <span className="flex items-center gap-1">
                <Icon name="inventory_2" size={16} className="text-muted-foreground" />
                {r.stopCount} paradas
              </span>
              <span className="flex items-center gap-1">
                <Icon name="schedule" size={16} className="text-muted-foreground" />
                {r.done} entregues
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export default RouteList;