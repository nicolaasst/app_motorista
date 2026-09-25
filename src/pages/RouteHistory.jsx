import { useEffect, useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getDriver } from "@/lib/driver";
import { Icon } from "@/components/rp/Icon";
import { Sheet } from "@/components/rp/Sheet";
import { LineArt } from "@/components/rp/LineArt";
import { RouteHistoryCard } from "@/components/route/RouteHistoryCard";
import { PullToRefresh } from "@/components/rp/PullToRefresh";

const PERIODS = [
  { id: "hoje", label: "Hoje" },
  { id: "semana", label: "Esta Semana" },
  { id: "mes", label: "Este Mês" },
  { id: "custom", label: "Personalizado" },
];
const PAGE_SIZE = 12;

function ymd(d) {
  return d.toISOString().slice(0, 10);
}
function inPeriod(dateStr, period, customStart, customEnd) {
  if (!dateStr) return false;
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  if (period === "hoje") return dateStr === ymd(today);
  if (period === "semana") {
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    return d >= weekAgo && d <= today;
  }
  if (period === "mes") return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  if (period === "custom") {
    if (!customStart || !customEnd) return true;
    return d >= new Date(customStart + "T00:00:00") && d <= new Date(customEnd + "T23:59:59");
  }
  return true;
}

const brl = (n) => Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default function RouteHistory() {
  const [routes, setRoutes] = useState(null);
  const [stops, setStops] = useState([]);
  const [period, setPeriod] = useState("mes");
  const [query, setQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);

  const load = async () => {
    const { driverId } = await getDriver();
    const [r, s] = await Promise.all([
      base44.entities.Route.filter({ driver_id: driverId }, "-date", 200),
      base44.entities.Stop.list("sequence", 2000),
    ]);
    setRoutes(r);
    setStops(s);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = (routes || [])
    .filter((r) => inPeriod(r.date, period, customStart, customEnd))
    .filter(
      (r) =>
        r.code.toLowerCase().includes(query.toLowerCase()) ||
        (r.sector || "").toLowerCase().includes(query.toLowerCase())
    );

  // Period summary metrics
  const summary = useMemo(() => {
    const routeIds = new Set(filtered.map((r) => r.id));
    let km = 0;
    let entregas = 0;
    let falhas = 0;
    for (const r of filtered) {
      km += r.odometer_end && r.odometer_start ? Math.max(0, r.odometer_end - r.odometer_start) : r.planned_km || 0;
    }
    for (const s of stops) {
      if (!routeIds.has(s.route_id)) continue;
      if (s.status === "entregue") entregas++;
      if (s.status === "falha") falhas++;
    }
    const total = entregas + falhas;
    const sla = total > 0 ? Math.round((entregas / total) * 1000) / 10 : filtered.length ? 100 : 0;
    return { km, entregas, sla, total: filtered.length };
  }, [filtered, stops]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [period, query, customStart, customEnd]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length));
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [filtered.length]);

  const visible = filtered.slice(0, visibleCount);
  const periodLabel = PERIODS.find((p) => p.id === period)?.label || "—";

  return (
    <PullToRefresh onRefresh={load}>
    <div className="screen-pad pt-12">
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <h1 className="text-headline-lg leading-tight tracking-tight">Histórico de Trajetos</h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-body-sm text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-status-green-fg" />
            {routes?.length || 0} rotas registradas • 100% canhotos sincronizados
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted shadow-sm">
          <Icon name="sync" size={22} className="text-foreground" />
        </span>
      </header>

      {/* Period chips */}
      <div className="-mx-5 mt-2 flex items-center gap-1.5 overflow-x-auto px-5 py-2">
        {PERIODS.map((p) => {
          const active = period === p.id;
          return (
            <button
              key={p.id}
              onClick={() => (p.id === "custom" ? setShowFilter(true) : setPeriod(p.id))}
              className={`rp-tap flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-label-md font-bold shadow-sm transition active:scale-95 ${
                active ? "bg-primary-container text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"
              }`}
            >
              {active && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
              {p.id === "custom" && <Icon name="calendar_month" size={16} />}
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mt-1 w-full">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground">
          <Icon name="search" size={22} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por romaneio, bairro ou rota..."
          className="w-full rounded-full border border-input bg-card py-3 pl-12 pr-4 text-body-md font-medium outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground"
          >
            <Icon name="cancel" size={20} />
          </button>
        )}
      </div>

      {/* Period summary card */}
      {routes !== null && filtered.length > 0 && (
        <section className="mt-4 rounded-2xl bg-card p-4 shadow-elevated">
          <div className="flex items-center justify-between pb-2">
            <span className="text-label-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Desempenho do Período
            </span>
            <span className="flex items-center gap-1 text-code-sm font-bold text-status-green-fg">
              <Icon name="verified" size={14} /> Meta Batida
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <div className="flex flex-col items-center rounded-xl bg-muted p-3 text-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-ink">
                <Icon name="route" size={18} />
              </span>
              <span className="mt-1 text-headline-md font-extrabold leading-none">{brl(summary.km)}</span>
              <span className="mt-1 text-label-sm text-muted-foreground">KM Rodados</span>
            </div>
            <div className="flex flex-col items-center rounded-xl bg-muted p-3 text-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-ink">
                <Icon name="package_2" size={18} />
              </span>
              <span className="mt-1 text-headline-md font-extrabold leading-none">{summary.entregas}</span>
              <span className="mt-1 text-label-sm text-muted-foreground">Entregas</span>
            </div>
            <div className="flex flex-col items-center rounded-xl bg-muted p-3 text-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-ink">
                <Icon name="workspace_premium" size={18} />
              </span>
              <span className="mt-1 text-headline-md font-extrabold leading-none">{summary.sla}%</span>
              <span className="mt-1 text-label-sm text-muted-foreground">Taxa SLA</span>
            </div>
          </div>
        </section>
      )}

      {/* Route list */}
      <div className="mt-4 flex flex-col gap-4">
        {routes === null && (
          <div className="flex flex-col gap-4">
            <div className="h-32 rounded-2xl bg-card shadow-elevated animate-pulse" />
            <div className="h-32 rounded-2xl bg-card shadow-elevated animate-pulse" />
            <div className="h-32 rounded-2xl bg-card shadow-elevated animate-pulse" />
          </div>
        )}

        {routes !== null && visible.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-card p-8 text-center shadow-elevated">
            <LineArt name="pin" className="h-10 w-10 text-muted-foreground" />
            <p className="text-body-md font-bold">Nenhum trajeto encontrado</p>
            <p className="text-body-sm text-muted-foreground">Não há rotas para o período {periodLabel.toLowerCase()}.</p>
          </div>
        )}

        {visible.map((r) => (
          <RouteHistoryCard key={r.id} route={r} stops={stops} />
        ))}

        {visibleCount < filtered.length && <div ref={sentinelRef} className="h-8" />}
      </div>

      {routes !== null && filtered.length > 0 && (
        <p className="mt-4 text-center text-label-sm text-muted-foreground">
          {Math.min(visibleCount, filtered.length)} de {filtered.length} trajetos
        </p>
      )}

      <Sheet open={showFilter} onClose={() => setShowFilter(false)} title="Período Personalizado">
        <div className="space-y-4">
          <div>
            <label className="text-label-md font-bold text-muted-foreground">De</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-input bg-card px-4 py-3 text-body-md font-medium outline-none"
            />
          </div>
          <div>
            <label className="text-label-md font-bold text-muted-foreground">Até</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-input bg-card px-4 py-3 text-body-md font-medium outline-none"
            />
          </div>
          <button
            onClick={() => {
              setPeriod("custom");
              setShowFilter(false);
            }}
            disabled={!customStart || !customEnd}
            className="rp-tap flex w-full items-center justify-center rounded-full bg-primary-container min-h-[48px] text-label-lg font-bold text-primary-foreground disabled:opacity-40"
          >
            Aplicar
          </button>
        </div>
      </Sheet>
    </div>
    </PullToRefresh>
  );
}