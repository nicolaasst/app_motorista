import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { minhasRotas, motoristaAtual, notificacoes, paradasDaRota, volumesDaRota } from "@/api/app-motorista";
import { AppHeader } from "@/components/rp/AppHeader";
import { Icon } from "@/components/rp/Icon";
import { StatusPill } from "@/components/rp/StatusPill";
import { StopCard } from "@/components/rp/StopCard";
import { ProgressBar } from "@/components/rp/ProgressBar";
import { EmptyState } from "@/components/rp/EmptyState";
import { SwipeToConfirm } from "@/components/rp/SwipeToConfirm";
import { PullToRefresh } from "@/components/rp/PullToRefresh";
import { ILLUSTRATIONS } from "@/lib/illustrations";

const STOP_STATUS_MAP = {
  em_rota: "a-caminho",
  em_atendimento: "a-caminho",
  nao_iniciada: "pendente",
  entregue: "entregue",
  falha: "falha",
  reagendada: "pendente",
};

const pad = (n) => String(n).padStart(2, "0");
const hhmm = (iso) => (iso ? format(new Date(iso), "HH:mm") : "");

export default function Home() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  const load = async () => {
    const [{ driver }, routes, notifs] = await Promise.all([
      motoristaAtual(),
      minhasRotas({ status: "em_operacao", limite: 5 }),
      notificacoes({ naoLidas: true, limite: 50 }),
    ]);
    const route = routes[0];
    if (!route) {
      setData({ driver, route: null, unread: notifs.length });
      return;
    }
    const [stops, volumes] = await Promise.all([
      paradasDaRota(route.id, 50),
      volumesDaRota(route.id, 200),
    ]);
    const byStop = {};
    for (const v of volumes) (byStop[v.stop_id] ||= []).push(v);
    setData({ driver, route, stops, volumesByStop: byStop, unread: notifs.length });
  };

  useEffect(() => {
    load();
  }, []);

  if (!data) {
    return (
      <div>
        <AppHeader title="Rota" />
        <div className="screen-pad pt-4">
          <div className="card h-28 animate-pulse" />
          <div className="card mt-4 h-40 animate-pulse" />
          <div className="mt-5 h-6 w-40 animate-pulse rounded" />
          <div className="mt-3 card h-24 animate-pulse" />
          <div className="mt-3 card h-24 animate-pulse" />
        </div>
      </div>
    );
  }

  const { driver, route, stops, volumesByStop, unread } = data;

  // No active route state — vitrine navy screen with mascot
  if (!route) {
    return (
      <PullToRefresh onRefresh={load}>
        <EmptyState
          fullScreen
          illustration={ILLUSTRATIONS.trianglePointing}
          title="Nenhuma rota por aqui"
          subtitle="Assim que uma rota for atribuída a você, ela aparece nesta tela"
          action={
            <button
              onClick={() => navigate("/support")}
              className="rp-tap mt-3 inline-flex items-center gap-2 rounded-full bg-primary-container px-5 py-3 text-label-lg font-bold text-primary-foreground"
            >
              <Icon name="support_agent" size={20} /> Falar com a Central
            </button>
          }
        />
      </PullToRefresh>
    );
  }

  const firstName = (driver?.full_name || "Motorista").split(" ")[0];
  const todayLabel = format(new Date(route.date), "d 'de' MMMM", { locale: ptBR });
  const shiftLabel = { manha: "Turno Manhã", tarde: "Turno Tarde", integral: "Turno Integral" }[route.shift] || route.shift;
  const totalStops = route.planned_stops || stops.length;
  const completedStops = stops.filter((s) => s.status === "entregue").length;
  const pct = totalStops ? Math.round((completedStops / totalStops) * 100) : 0;
  const remaining = totalStops - completedStops;

  const pending = stops
    .filter((s) => s.status === "em_rota" || s.status === "nao_iniciada" || s.status === "reagendada")
    .sort((a, b) => a.sequence - b.sequence);
  const upcoming = pending.slice(0, 3);
  const nextStop = pending[0];
  const doneStops = stops.filter((s) => s.status === "entregue").sort((a, b) => b.sequence - a.sequence);
  const lastDone = doneStops[0];

  const toCardShape = (s) => ({
    id: s.id,
    seq: pad(s.sequence),
    status: STOP_STATUS_MAP[s.status] || "pendente",
    name: s.recipient_name,
    address: [s.address_line, s.district].filter(Boolean).join(" • "),
    window: s.window_end ? `${s.window_start} - ${s.window_end}` : s.window_start,
    volumes: volumesByStop[s.id] || (volumesByStop[s.id] ? volumesByStop[s.id].length : 0),
    nf: volumesByStop[s.id]?.[0]?.nf_number ? `NF-e ${volumesByStop[s.id][0].nf_number}` : undefined,
  });

  return (
    <PullToRefresh onRefresh={load}>
      <div>
        <AppHeader title="Rota" notifications={unread} />
        <div className="screen-pad pt-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-headline-lg">Olá, {firstName}</h1>
                <Icon name="verified" size={20} className="text-primary" />
              </div>
              <p className="text-body-sm text-muted-foreground">
                Hoje, {todayLabel} • {shiftLabel}
              </p>
            </div>
            <StatusPill status="green">Em Operação</StatusPill>
          </div>

          <div className="card mt-4 overflow-hidden">
            <div className="bg-muted p-4 text-foreground">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon name="inventory_2" size={16} />
                <span className="text-code-md">{route.code}</span>
              </div>
              <p className="mt-1 text-headline-md">{route.sector}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-card py-2">
                  <p className="text-code-lg">{totalStops}</p>
                  <p className="text-label-sm text-muted-foreground">Paradas</p>
                </div>
                <div className="rounded-xl bg-card py-2">
                  <p className="text-code-lg">{route.planned_km?.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
                  <p className="text-label-sm text-muted-foreground">Quilômetros</p>
                </div>
                <div className="rounded-xl bg-card py-2">
                  <p className="text-code-lg">{route.eta_end}</p>
                  <p className="text-label-sm text-muted-foreground">Previsão</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between text-label-sm">
                <span className="text-muted-foreground">
                  {completedStops} de {totalStops} concluídas
                </span>
                <span className="text-primary-deep">{pct}% concluído</span>
              </div>
              <ProgressBar value={pct} className="mt-2" />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Icon name="alt_route" size={18} className="text-muted-foreground" />
              <h2 className="text-headline-sm">Sequência de Paradas</h2>
            </div>
            <span className="text-label-sm text-muted-foreground">{remaining} restantes</span>
          </div>

          <div className="mt-3 space-y-3">
            {upcoming.map((s, i) => (
              <StopCard key={s.id} stop={toCardShape(s)} isNext={i === 0} />
            ))}

            {lastDone && (
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-green text-status-green-fg">
                    <Icon name="check" size={20} />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <StatusPill status="green">Entregue</StatusPill>
                      {lastDone.finished_at && (
                        <span className="text-label-sm text-muted-foreground">às {hhmm(lastDone.finished_at)}</span>
                      )}
                    </div>
                    <p className="mt-1 text-label-md">{lastDone.recipient_name}</p>
                    <p className="text-body-md text-muted-foreground">
                      {[lastDone.address_line, lastDone.district].filter(Boolean).join(" • ")} • {(volumesByStop[lastDone.id] || []).length} volumes
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <SwipeToConfirm
            className="mt-5"
            label={nextStop ? `Iniciar Próxima Parada (Parada #${pad(nextStop.sequence)})` : "Finalizar Rota"}
            icon="play_circle"
            onConfirm={() => (nextStop ? navigate(`/stop/${nextStop.id}/navigate`) : navigate("/route-complete"))}
          />
        </div>
      </div>
    </PullToRefresh>
  );
}