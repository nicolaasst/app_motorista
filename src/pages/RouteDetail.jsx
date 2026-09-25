import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { comprovantesDasRotas, insucessosDasRotas, paradasDaRota, rota as buscarRota, trilhaDaRota } from "@/api/app-motorista";
import { Icon } from "@/components/rp/Icon";
import { RouteMap } from "@/components/route/RouteMap";

const brl = (n) => Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—");
const fmtDate = (iso) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "—";
const fmtDuration = (start, end) => {
  if (!start || !end) return "—";
  const mins = Math.round((new Date(end) - new Date(start)) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m` : `${m}m`;
};

const STOP_STYLE = {
  entregue: { badge: "bg-status-green-fg", label: "Entregue", icon: "check_circle" },
  falha: { badge: "bg-status-red-fg", label: "Falha", icon: "cancel" },
  em_rota: { badge: "bg-status-amber-fg", label: "Em Rota", icon: "local_shipping" },
  em_atendimento: { badge: "bg-status-amber-fg", label: "Em Atendimento", icon: "support" },
  nao_iniciada: { badge: "bg-stone", label: "Pendente", icon: "schedule" },
  reagendada: { badge: "bg-stone", label: "Reagendada", icon: "event_repeat" },
};

const SHIFT_LABEL = { manha: "Turno Manhã", tarde: "Turno Tarde", integral: "Turno Integral" };

function routeStatus(route, stops) {
  const isDone = ["encerrada", "retorno_ok", "concluida"].includes(route.status);
  if (!isDone) return { l: "Rota Ativa", c: "amber" };
  const hasFail = stops.some((s) => s.status === "falha");
  const hasPending = stops.some((s) => s.status === "nao_iniciada" || s.status === "reagendada");
  if (hasFail || hasPending) return { l: "Concluído c/ Pendência", c: "amber" };
  return { l: "100% Concluído", c: "green" };
}

export default function RouteDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [rotaBase, stops, proofs, failures, trilha] = await Promise.all([
        buscarRota(id),
        paradasDaRota(id, 200),
        comprovantesDasRotas([id], 500),
        insucessosDasRotas([id], 500),
        trilhaDaRota(id).catch(() => []),
      ]);
      // O mapa (RouteMap) lê a trilha em route.gps_track, como antes.
      const route = rotaBase ? { ...rotaBase, gps_track: trilha } : rotaBase;
      if (alive) setData({ route, stops, proofs, failures });
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (!data) {
    return (
      <div className="screen-pad pt-16">
        <div className="h-40 rounded-2xl bg-card shadow-elevated animate-pulse" />
        <div className="mt-4 h-48 rounded-2xl bg-card shadow-elevated animate-pulse" />
        <div className="mt-4 h-24 rounded-2xl bg-card shadow-elevated animate-pulse" />
      </div>
    );
  }

  const { route, stops, proofs, failures } = data;
  const sortedStops = [...stops].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  const total = sortedStops.length || route.planned_stops || 0;
  const entregues = sortedStops.filter((s) => s.status === "entregue").length;
  const falhas = sortedStops.filter((s) => s.status === "falha").length;
  const emRota = sortedStops.filter((s) => s.status === "em_rota" || s.status === "em_atendimento").length;
  const pendentes = sortedStops.filter((s) => s.status === "nao_iniciada" || s.status === "reagendada").length;
  const km = route.odometer_end && route.odometer_start ? Math.max(0, route.odometer_end - route.odometer_start) : route.planned_km || 0;
  const st = routeStatus(route, sortedStops);
  const pct = total ? Math.round((entregues / total) * 100) : 0;

  const proofByStop = {};
  proofs.forEach((p) => {
    proofByStop[p.stop_id] = p;
  });
  const failByStop = {};
  failures.forEach((f) => {
    failByStop[f.stop_id] = f;
  });

  const unsynced = [...proofs, ...failures].some((x) => x.sync_status && x.sync_status !== "ok");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="safe-top sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-xl">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-foreground active:scale-95"
          >
            <Icon name="arrow_back" size={24} />
          </button>
          <h1 className="truncate text-headline-sm">Detalhe De Trajeto</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate("/support")}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground"
          >
            <Icon name="support_agent" size={22} />
          </button>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Icon name="person" size={18} />
          </span>
        </div>
      </header>

      {/* Operational header */}
      <section className="flex flex-col bg-card px-5 pb-4 pt-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="rounded-full bg-muted px-3 py-1 text-code-sm font-bold">{route.code}</span>
          <span className={`chip status-${st.c}`}>
            <span className={`h-2 w-2 rounded-full bg-current ${st.c === "amber" ? "animate-pulse" : ""}`} />
            <span className="uppercase tracking-wider">{st.l}</span>
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-headline-md">{route.sector || route.code}</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-body-sm text-muted-foreground">
              <Icon name="calendar_today" size={15} />
              {fmtDate(route.date)} • {fmtTime(route.started_at)} - {fmtTime(route.finished_at)}
            </p>
          </div>
          {route.shift && (
            <span className="shrink-0 rounded-full bg-brand-yellow-soft px-2.5 py-1 text-label-sm font-bold text-ink">
              {SHIFT_LABEL[route.shift] || route.shift}
            </span>
          )}
        </div>
      </section>

      {unsynced && (
        <div className="flex items-center gap-2 bg-status-amber-bg px-4 py-2 text-body-sm font-bold text-status-amber-fg">
          <Icon name="cloud_sync" size={18} /> Trajeto parcialmente sincronizado — alguns dados ainda pendentes
        </div>
      )}

      {/* Map */}
      <section className="relative h-80 w-full overflow-hidden bg-navy">
        <RouteMap route={route} stops={sortedStops} dark onStopClick={(s) => navigate(`/stop/${s.id}`)} />
        {/* Legend HUD */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5 rounded-2xl bg-ink/90 px-3 py-2 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-status-green-fg" />
            <span className="text-[10px] font-bold text-white">Concluída</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-status-amber-fg" />
            <span className="text-[10px] font-bold text-white">Em Rota</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-status-red-fg" />
            <span className="text-[10px] font-bold text-white">Ocorrência</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-stone" />
            <span className="text-[10px] font-bold text-white">Pendente</span>
          </div>
        </div>
      </section>

      {/* Summary card overlapping map */}
      <section className="relative z-10 -mt-4 px-5">
        <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-elevated">
          {/* Distance + Time */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-3 rounded-xl bg-muted p-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-ink">
                <Icon name="alt_route" size={22} />
              </span>
              <div>
                <p className="text-body-sm text-muted-foreground">Distância Total</p>
                <p className="text-headline-sm font-bold tracking-tight">
                  {brl(km)} <span className="text-body-sm font-normal text-muted-foreground">km</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-muted p-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-ink">
                <Icon name="timer" size={22} />
              </span>
              <div>
                <p className="text-body-sm text-muted-foreground">Tempo em Rota</p>
                <p className="text-headline-sm font-bold tracking-tight">{fmtDuration(route.started_at, route.finished_at)}</p>
              </div>
            </div>
          </div>
          {/* Status counters */}
          <div className="grid grid-cols-4 gap-2 pt-1 text-center">
            <div className="flex flex-col items-center justify-center rounded-xl bg-status-green-bg p-2">
              <span className="text-headline-md font-bold leading-none text-status-green-fg">{entregues}</span>
              <span className="mt-1 text-[10px] font-bold uppercase text-status-green-fg">Entregues</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl bg-status-amber-bg p-2">
              <span className="text-headline-md font-bold leading-none text-status-amber-fg">{emRota}</span>
              <span className="mt-1 text-[10px] font-bold uppercase text-status-amber-fg">Em Rota</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl bg-muted p-2">
              <span className="text-headline-md font-bold leading-none text-muted-foreground">{pendentes}</span>
              <span className="mt-1 text-[10px] font-bold uppercase text-muted-foreground">Pendentes</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl bg-status-red-bg p-2">
              <span className="text-headline-md font-bold leading-none text-status-red-fg">{falhas}</span>
              <span className="mt-1 text-[10px] font-bold uppercase text-status-red-fg">Falhas</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stop list */}
      <section className="mt-6 px-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-headline-sm font-bold">Sequência de Paradas</h3>
          <span className="rounded-full bg-muted px-2.5 py-1 text-label-sm font-bold text-muted-foreground">
            {entregues} de {total} concluídas
          </span>
        </div>
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>

        <div className="flex flex-col gap-3 pb-8">
          {sortedStops.map((s) => {
            const meta = STOP_STYLE[s.status] || STOP_STYLE.nao_iniciada;
            const proof = proofByStop[s.id];
            const fl = failByStop[s.id];
            return (
              <button
                key={s.id}
                onClick={() => navigate(`/stop/${s.id}`)}
                className="rp-tap flex items-center justify-between gap-3 rounded-2xl bg-card p-4 text-left shadow-elevated transition-colors active:bg-muted"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-code-md font-bold text-white shadow-sm ${meta.badge}`}
                  >
                    {String(s.sequence).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate text-body-lg font-bold">{s.recipient_name}</h4>
                      {s.status === "entregue" && (
                        <Icon name="check_circle" size={18} filled className="shrink-0 text-status-green-fg" />
                      )}
                    </div>
                    <p className="truncate text-body-md text-muted-foreground">{s.address_line}</p>
                    <div className="mt-1 flex items-center gap-3 text-muted-foreground">
                      <span className="text-code-sm font-bold text-muted-foreground">
                        {s.finished_at ? fmtTime(s.finished_at) : "—"}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                      <span className="text-code-sm font-bold text-muted-foreground">
                        {s.window_start ? `Janela ${s.window_start}` : "—"}
                      </span>
                    </div>
                    {proof && (
                      <p className="mt-1 text-body-sm font-semibold text-status-green-fg">
                        Recebido: {proof.receiver_name}
                      </p>
                    )}
                    {fl && (
                      <p className="mt-1 text-body-sm font-semibold text-status-red-fg">
                        {fl.reason.replace(/_/g, " ")}
                      </p>
                    )}
                  </div>
                </div>
                <Icon name="chevron_right" size={22} className="shrink-0 text-muted-foreground" />
              </button>
            );
          })}
          {sortedStops.length === 0 && (
            <p className="text-body-md text-muted-foreground">Sem paradas registradas para esta rota.</p>
          )}
        </div>
      </section>
    </div>
  );
}