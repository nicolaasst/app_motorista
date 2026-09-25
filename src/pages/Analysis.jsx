import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getDriver } from "@/lib/driver";
import { Icon } from "@/components/rp/Icon";
import { Sheet } from "@/components/rp/Sheet";
import { PeriodFilter } from "@/components/analysis/PeriodFilter";
import { SummaryCards } from "@/components/analysis/SummaryCards";
import { EvolutionChart } from "@/components/analysis/EvolutionChart";
import { RouteList } from "@/components/analysis/RouteList";
import { PullToRefresh } from "@/components/rp/PullToRefresh";

const CACHE_KEY = "analysis-cache-v1";

const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function formatMonth(d) {
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function buildPeriod(preset, custom) {
  const today = new Date();
  if (preset === "hoje") return { preset, start: ymd(today), end: ymd(today), label: "Hoje" };
  if (preset === "semana") {
    const s = new Date(today);
    s.setDate(today.getDate() - 6);
    return { preset, start: ymd(s), end: ymd(today), label: "Últimos 7 dias" };
  }
  if (preset === "mes") {
    const s = new Date(today.getFullYear(), today.getMonth(), 1);
    return { preset, start: ymd(s), end: ymd(today), label: formatMonth(today) };
  }
  return { preset: "custom", start: custom.start, end: custom.end, label: "Personalizado" };
}

function buildDaySeries(period, dailyMap) {
  const result = [];
  const start = new Date(period.start + "T00:00:00");
  const end = new Date(period.end + "T00:00:00");
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = ymd(d);
    result.push(dailyMap[key] || { date: key, entregas: 0, km: 0 });
  }
  return result;
}

export default function Analysis() {
  const [raw, setRaw] = useState(null);
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [fetchError, setFetchError] = useState(false);
  const [period, setPeriod] = useState(buildPeriod("semana"));
  const [customOpen, setCustomOpen] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const fetchData = async () => {
    try {
      const { driverId } = await getDriver();
      const [routes, stops, proofs, failures] = await Promise.all([
        base44.entities.Route.filter({ driver_id: driverId }, "-date", 200),
        base44.entities.Stop.list("sequence", 2000),
        base44.entities.DeliveryProof.list("created_date", 2000),
        base44.entities.FailureReport.list("created_date", 2000),
      ]);
      const data = { routes, stops, proofs, failures };
      setRaw(data);
      setFetchError(false);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch {
        /* storage full */
      }
    } catch {
      setFetchError(true);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached && alive) setRaw(JSON.parse(cached));
      } catch {
        /* ignore cache parse errors */
      }
      await fetchData();
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const handlePreset = (val) => {
    if (val === "custom") {
      setCustomStart(period.start);
      setCustomEnd(period.end);
      setCustomOpen(true);
      return;
    }
    setPeriod(buildPeriod(val));
  };

  const applyCustom = () => {
    if (customStart && customEnd && customStart <= customEnd) {
      setPeriod({ preset: "custom", start: customStart, end: customEnd, label: "Personalizado" });
      setCustomOpen(false);
    }
  };

  const agg = useMemo(() => {
    if (!raw) return null;
    const { routes, stops, proofs, failures } = raw;
    const stopToRoute = {};
    stops.forEach((s) => {
      stopToRoute[s.id] = s.route_id;
    });
    const routeById = {};
    routes.forEach((r) => {
      routeById[r.id] = r;
    });
    const stopsByRoute = {};
    stops.forEach((s) => {
      (stopsByRoute[s.route_id] ||= []).push(s);
    });

    const inRange = routes.filter((r) => r.date >= period.start && r.date <= period.end);
    const periodRouteIds = new Set(inRange.map((r) => r.id));

    let totalKm = 0;
    let totalMs = 0;
    const dailyMap = {};

    for (const r of inRange) {
      const km = r.odometer_end && r.odometer_start
        ? Math.max(0, r.odometer_end - r.odometer_start)
        : r.planned_km || 0;
      totalKm += km;
      if (r.started_at && r.finished_at) {
        const ms = new Date(r.finished_at) - new Date(r.started_at);
        if (ms > 0) totalMs += ms;
      }
      dailyMap[r.date] ||= { date: r.date, entregas: 0, km: 0 };
      dailyMap[r.date].km += km;
    }

    const periodProofs = proofs.filter((p) => periodRouteIds.has(stopToRoute[p.stop_id]));
    const periodFailures = failures.filter((f) => periodRouteIds.has(stopToRoute[f.stop_id]));
    const totalDone = periodProofs.length;
    const totalFail = periodFailures.length;

    periodProofs.forEach((p) => {
      const r = routeById[stopToRoute[p.stop_id]];
      if (r && dailyMap[r.date]) dailyMap[r.date].entregas += 1;
    });

    const enrichedRoutes = inRange.map((r) => {
      const rs = stopsByRoute[r.id] || [];
      const done = rs.filter((s) => s.status === "entregue").length;
      const fail = rs.filter((s) => s.status === "falha").length;
      const km = r.odometer_end && r.odometer_start
        ? Math.max(0, r.odometer_end - r.odometer_start)
        : r.planned_km || 0;
      const hasPending = fail > 0 || !["concluida", "retorno_ok", "encerrada"].includes(r.status);
      return { ...r, stopCount: rs.length || r.planned_stops || 0, done, fail, km, hasPending };
    });

    return {
      totalKm,
      totalDone,
      totalFail,
      totalRoutes: inRange.length,
      totalMs,
      daily: buildDaySeries(period, dailyMap),
      routes: enrichedRoutes,
    };
  }, [raw, period]);

  const stale = !online || fetchError;

  if (!raw) {
    return (
      <div className="screen-pad pt-12">
        <div className="h-16 rounded-2xl bg-card shadow-elevated animate-pulse" />
        <div className="mt-4 h-12 rounded-full bg-muted animate-pulse" />
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="h-28 rounded-2xl bg-card shadow-elevated animate-pulse" />
          <div className="h-28 rounded-2xl bg-card shadow-elevated animate-pulse" />
        </div>
        <div className="mt-4 h-52 rounded-2xl bg-card shadow-elevated animate-pulse" />
      </div>
    );
  }

  return (
    <div className="screen-pad pt-12">
      <PullToRefresh onRefresh={fetchData}>
      {/* Header */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-label-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Painel de Campo
            </span>
            <h1 className="text-headline-lg leading-tight tracking-tight">Desempenho Operacional</h1>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted shadow-sm">
            <Icon name="insights" size={20} className="text-foreground" />
          </span>
        </div>
        {/* Telemetry pill */}
        <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-muted px-3 py-1.5 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-deep" />
          </span>
          <span className="text-label-sm font-medium text-muted-foreground">
            {stale ? "Dados desatualizados • offline" : "Sincronizado via Telemetria"}
          </span>
        </div>
      </section>

      {stale && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-status-amber-bg px-3 py-2.5 text-body-sm font-semibold text-status-amber-fg">
          <Icon name="cloud_off" size={18} /> Sem conexão — exibindo os últimos dados sincronizados
        </div>
      )}

      {/* Period filter */}
      <div className="mt-4">
        <PeriodFilter value={period.preset} onChange={handlePreset} />
      </div>

      {/* KPI grid */}
      <div className="mt-4">
        <SummaryCards agg={agg} periodLabel={period.label} />
      </div>

      {/* Evolution chart */}
      <div className="mt-4">
        <EvolutionChart daily={agg.daily} />
      </div>

      {/* Bonus banner */}
      {agg.totalRoutes > 0 && (
        <section className="relative mt-4 flex flex-col overflow-hidden rounded-2xl bg-onyx p-4 text-primary-foreground shadow-elevated">
          <div className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-lime opacity-20 blur-2xl" />
          <div className="relative z-10 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Icon name="emoji_events" size={22} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-label-sm font-extrabold uppercase tracking-wider text-primary">Meta Batida</span>
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              </div>
              <p className="mt-0.5 text-body-md leading-tight">
                {agg.totalFail === 0
                  ? "Desempenho impecável no período — todas as entregas concluídas sem ocorrências."
                  : `${agg.totalDone} entregas concluídas no período consolidado.`}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Recent routes */}
      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-headline-sm font-bold">Trajetos Recentes</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-code-sm font-bold text-muted-foreground">
            {agg.routes.length}
          </span>
        </div>
      </div>

      <div className="mt-3">
        <RouteList routes={agg.routes} />
      </div>

      </PullToRefresh>

      <Sheet open={customOpen} onClose={() => setCustomOpen(false)} title="Período Personalizado">
        <div className="space-y-3">
          <label className="block">
            <span className="text-label-sm text-muted-foreground">Data inicial</span>
            <input
              type="date"
              value={customStart}
              max={customEnd || undefined}
              onChange={(e) => setCustomStart(e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-card px-3 py-3 text-body-md font-bold"
            />
          </label>
          <label className="block">
            <span className="text-label-sm text-muted-foreground">Data final</span>
            <input
              type="date"
              value={customEnd}
              min={customStart || undefined}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-card px-3 py-3 text-body-md font-bold"
            />
          </label>
          <button
            onClick={applyCustom}
            className="rp-tap flex w-full items-center justify-center gap-2 rounded-full bg-primary-container min-h-[48px] text-label-lg font-bold text-primary-foreground"
          >
            <Icon name="check" size={20} /> Aplicar
          </button>
        </div>
      </Sheet>
    </div>
  );
}