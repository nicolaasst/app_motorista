import { Icon } from "@/components/rp/Icon";
import { EMPTY_VALUE } from "@/lib/utils";

const brl = (n) =>
  Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function fmtDuration(ms) {
  if (!ms || ms <= 0) return EMPTY_VALUE;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function SummaryCards({ agg, periodLabel }) {
  const { totalKm, totalDone, totalFail, totalRoutes, totalMs } = agg;
  const successRate = totalDone + totalFail > 0 ? Math.round((totalDone / (totalDone + totalFail)) * 1000) / 10 : 100;
  const avgPerStop = totalDone > 0 ? Math.max(1, Math.round(totalMs / totalDone / 60000)) : 0;

  const cards = [
    {
      label: "KM Rodados",
      icon: "speed",
      value: brl(totalKm),
      unit: "km",
      subIcon: "trending_up",
      subText: `${totalRoutes} trajeto(s)`,
    },
    {
      label: "Entregas",
      icon: "task_alt",
      value: totalDone,
      unit: "",
      subIcon: "check_circle",
      subText: `${successRate}% sucesso`,
    },
    {
      label: "Trajetos",
      icon: "route",
      value: totalRoutes,
      unit: "rotas",
      subIcon: "timer",
      subText: totalFail === 0 ? "100% no prazo" : `${totalFail} insucesso(s)`,
    },
    {
      label: "Tempo Total",
      icon: "timelapse",
      value: fmtDuration(totalMs),
      unit: "",
      subIcon: "schedule",
      subText: `Média ${avgPerStop}m/parada`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="flex flex-col justify-between rounded-2xl bg-card p-4 shadow-elevated"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-label-sm font-semibold uppercase text-muted-foreground">{c.label}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-primary-deep">
              <Icon name={c.icon} size={18} />
            </span>
          </div>
          <div>
            <div className="text-code-lg font-bold tracking-tight">
              {c.value}{" "}
              {c.unit && <span className="text-body-sm font-medium text-muted-foreground">{c.unit}</span>}
            </div>
            <div className="mt-1 flex items-center gap-1 text-primary-deep">
              <Icon name={c.subIcon} size={14} />
              <span className="text-label-sm font-semibold">{c.subText}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SummaryCards;