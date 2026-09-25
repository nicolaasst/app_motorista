import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Icon } from "@/components/rp/Icon";

export function EvolutionChart({ daily }) {
  const [metric, setMetric] = useState("entregas");

  const data = daily.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "EEE", { locale: ptBR }),
  }));

  const values = data.map((d) => d[metric] || 0);
  const max = Math.max(...values, 1);
  const peakIdx = values.indexOf(Math.max(...values));
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const target = Math.ceil(avg);
  const n = data.length;

  const W = 340;
  const H = 168;
  const padTop = 26;
  const padBottom = 26;
  const chartH = H - padTop - padBottom;
  const slot = n > 0 ? W / n : W;
  const barW = Math.min(30, slot * 0.62);
  const labelInterval = Math.max(1, Math.floor(n / 7));

  return (
    <div className="rounded-2xl bg-card p-5 shadow-elevated">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-label-sm font-semibold uppercase text-muted-foreground">Evolução Diária</span>
          <h2 className="text-headline-sm font-bold">
            {metric === "entregas" ? "Volume de Entregas" : "Quilometragem"}
          </h2>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-muted p-1">
          <button
            onClick={() => setMetric("entregas")}
            className={`rp-tap rounded-full px-3 py-1.5 text-label-sm font-bold transition ${
              metric === "entregas" ? "bg-onyx text-white" : "text-muted-foreground"
            }`}
          >
            Entregas
          </button>
          <button
            onClick={() => setMetric("km")}
            className={`rp-tap rounded-full px-3 py-1.5 text-label-sm font-bold transition ${
              metric === "km" ? "bg-onyx text-white" : "text-muted-foreground"
            }`}
          >
            KM
          </button>
        </div>
      </div>

      {/* Benchmark badge bar */}
      <div className="mt-3 flex items-center justify-between rounded-full bg-muted px-3 py-2">
        <div className="flex items-center gap-1.5 text-primary-deep">
          <Icon name="verified" size={18} />
          <span className="text-label-sm font-bold">
            {avg.toFixed(1)} {metric === "entregas" ? "entregas/dia" : "km/dia"}
          </span>
        </div>
        <span className="text-code-sm font-medium text-muted-foreground">{n} dias</span>
      </div>

      {/* Chart */}
      <div className="relative w-full pt-6 pb-2">
        {n > 0 ? (
          <svg className="w-full overflow-visible" viewBox={`0 0 ${W} ${H}`} style={{ height: 168 }}>
            {target > 0 && (
              <line
                x1="0"
                x2={W}
                y1={padTop + chartH - (target / max) * chartH}
                y2={padTop + chartH - (target / max) * chartH}
                stroke="hsl(var(--muted-foreground))"
                strokeOpacity="0.4"
                strokeDasharray="4 4"
              />
            )}
            {data.map((d, i) => {
              const v = d[metric] || 0;
              const h = (v / max) * chartH;
              const x = i * slot + slot / 2 - barW / 2;
              const y = padTop + chartH - h;
              const isPeak = i === peakIdx && v > 0;
              const showLabel = i % labelInterval === 0 || i === n - 1;
              return (
                <g key={d.date}>
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={Math.max(h, 2)}
                    rx={barW / 2}
                    className={isPeak ? "fill-primary" : "fill-muted"}
                  />
                  <text
                    x={x + barW / 2}
                    y={y - 7}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="Space Mono, monospace"
                    className={isPeak ? "fill-primary-deep" : "fill-muted-foreground"}
                  >
                    {v}
                  </text>
                  {showLabel && (
                    <text
                      x={x + barW / 2}
                      y={H - 8}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="600"
                      className="fill-muted-foreground"
                    >
                      {d.label.slice(0, 3)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        ) : (
          <div className="flex h-40 items-center justify-center text-body-sm text-muted-foreground">
            Sem dados no período
          </div>
        )}
      </div>
    </div>
  );
}

export default EvolutionChart;