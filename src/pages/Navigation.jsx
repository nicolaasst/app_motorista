import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getDriver } from "@/lib/driver";
import { Icon } from "@/components/rp/Icon";
import { CollapsibleStopCard } from "@/components/rp/CollapsibleStopCard";
import { NavMap } from "@/components/route/NavMap";
import { SyncStatusBar } from "@/components/route/SyncStatusBar";
import { useDriverTracking } from "@/hooks/useDriverTracking";
import { useRouteNavigation } from "@/hooks/useRouteNavigation";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { useRouteChangeAlert } from "@/hooks/useRouteChangeAlert";

const pad = (n) => String(n).padStart(2, "0");
const PENDING_STATUS = ["nao_iniciada", "em_rota", "em_atendimento", "reagendada"];

const fmtDistance = (m) =>
  m == null ? "--" : m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;

const fmtEta = (s) => {
  if (s == null) return null;
  const min = Math.max(1, Math.round(s / 60));
  return min >= 60 ? `${Math.floor(min / 60)}h ${pad(min % 60)}m` : `${min} min`;
};

export default function Navigation() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      let target = null;
      if (id) {
        try {
          target = await base44.entities.Stop.get(id);
        } catch {
          target = null;
        }
      }
      let route = null;
      if (target) {
        route = await base44.entities.Route.get(target.route_id);
      } else {
        const { driverId } = await getDriver();
        const routes = await base44.entities.Route.filter(
          { driver_id: driverId, status: "em_operacao" },
          "-date",
          1,
        );
        route = routes[0];
      }
      if (!route) {
        if (alive) setData({ route: null });
        return;
      }
      const stops = await base44.entities.Stop.filter({ route_id: route.id }, "sequence", 200);
      const next = target || stops.find((s) => PENDING_STATUS.includes(s.status)) || null;
      if (alive) setData({ route, stops, next });
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (!data) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-navy">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-lime" />
      </div>
    );
  }

  if (!data.route) return <NoActiveRoute />;

  return <NavigationScreen route={data.route} stops={data.stops} nextStop={data.next} />;
}

function NoActiveRoute() {
  const navigate = useNavigate();
  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center gap-3 bg-navy px-8 text-center text-white">
      <Icon name="explore_off" size={44} className="text-lime" />
      <p className="text-headline-sm">Nenhuma rota em operação</p>
      <p className="text-body-md text-white/70">
        Inicie uma rota para acompanhar o trajeto em tempo real.
      </p>
      <button
        onClick={() => navigate("/")}
        className="rp-tap mt-2 inline-flex items-center gap-2 rounded-full bg-primary-container px-5 py-3 text-label-lg font-bold text-primary-foreground"
      >
        <Icon name="home" size={20} /> Voltar ao Início
      </button>
    </div>
  );
}

function NavigationScreen({ route, stops, nextStop }) {
  const navigate = useNavigate();
  const tracking = useDriverTracking({ route, enabled: true });
  const nav = useRouteNavigation({
    route,
    stops,
    nextStop,
    position: tracking.position,
    heading: tracking.heading,
    accuracy: tracking.accuracy,
  });
  const sync = useSyncStatus();
  const change = useRouteChangeAlert({ routeId: route.id });

  const driverPos =
    tracking.position ||
    (route.origin?.lat ? { lat: route.origin.lat, lng: route.origin.lng } : null) ||
    (nextStop?.lat ? { lat: nextStop.lat, lng: nextStop.lng } : null);

  const leg = nav.activeLeg;
  const phone = (nextStop?.contact_phone || "").replace(/\D/g, "");
  const eta = fmtEta(leg?.duration);

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background">
      <div className="relative min-h-0 flex-1 overflow-hidden bg-navy">
        <NavMap
          position={driverPos}
          heading={tracking.heading}
          accuracy={tracking.accuracy}
          track={tracking.track}
          activeLeg={nav.activeLeg}
          futureLegs={nav.futureLegs}
          recalculating={nav.recalculating}
          offRoute={nav.offRoute}
          offRouteFrom={nav.offRouteFrom}
          stops={stops}
          nextStopId={nextStop?.id}
          onStopClick={(s) => navigate(`/stop/${s.id}`)}
        />

        <div className="pointer-events-none absolute inset-x-3 top-3 z-[1000] flex items-start justify-between gap-2">
          <div className="pointer-events-auto">
            <SyncStatusBar
              online={sync.online}
              pending={sync.pending}
              status={sync.status}
              onSync={sync.sync}
            />
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-label-sm font-bold text-white backdrop-blur">
            <Icon
              name="satellite_alt"
              size={16}
              className={tracking.gpsOk ? "text-lime" : "text-white/50"}
            />
            {tracking.gpsOk ? `GPS ±${Math.round(tracking.accuracy || 0)}m` : "GPS fraco"}
          </span>
        </div>

        <div className="absolute inset-x-3 top-[3.75rem] z-[1000] rounded-3xl bg-card p-4 shadow-elevated">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary-deep">
              <Icon
                name={nav.recalculating ? "autorenew" : "turn_right"}
                size={28}
                className={nav.recalculating ? "animate-spin" : ""}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-code-lg leading-none">{fmtDistance(leg?.distance)}</p>
              <p className="truncate text-body-md font-semibold text-muted-foreground">
                {nextStop
                  ? `Parada #${pad(nextStop.sequence)} • ${nextStop.district || nextStop.address_line || ""}`
                  : "Sem parada ativa"}
              </p>
            </div>
            {eta && (
              <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-label-md">{eta}</span>
            )}
          </div>

          {(nav.recalculating || nav.offRoute) && (
            <div
              className={`mt-3 flex items-center gap-2 border-t border-border pt-3 text-body-md font-semibold ${
                nav.offRoute ? "text-status-amber-fg" : "text-muted-foreground"
              }`}
            >
              <Icon name={nav.offRoute ? "wrong_location" : "sync"} size={18} />
              {nav.offRoute ? "Fora de rota — traçando novo caminho" : "Recalculando trajeto…"}
            </div>
          )}
        </div>

        {change.alert && (
          <div className="absolute inset-x-3 top-[11.5rem] z-[1100] flex items-start gap-2 rounded-2xl bg-status-amber p-3 text-status-amber-fg shadow-elevated">
            <Icon name="swap_vert" size={18} className="mt-0.5 shrink-0" />
            <p className="flex-1 text-body-sm font-semibold">
              {change.alert.added.length
                ? `A central adicionou ${change.alert.added.length} nova(s) parada(s) à sua rota.`
                : "A central alterou a ordem das suas paradas."}
            </p>
            <button
              type="button"
              aria-label="Fechar aviso"
              onClick={change.dismiss}
              className="flex h-6 w-6 items-center justify-center rounded-full"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        )}

        <div className="absolute bottom-4 left-3 z-[1000] rounded-2xl bg-black/65 px-4 py-3 backdrop-blur">
          <p className="text-label-sm uppercase text-white/60">Velocidade</p>
          <p className="text-code-lg leading-none text-white">
            {tracking.speedKmh} <span className="text-body-md text-white/70">KM/H</span>
          </p>
          {tracking.stopped && <p className="mt-1 text-label-sm font-bold text-lime">PARADO</p>}
        </div>
      </div>

      <div className="relative z-10 max-h-[70dvh] shrink-0 overflow-y-auto overscroll-contain">
        {nextStop ? (
          <CollapsibleStopCard
            stop={nextStop}
            phone={phone}
            onArrive={() => navigate(`/stop/${nextStop.id}`)}
          />
        ) : (
          <div className="rounded-t-3xl bg-background px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-5 shadow-elevated">
            <p className="text-headline-sm">Todas as paradas concluídas</p>
            <p className="mt-1 text-body-md text-muted-foreground">
              Você pode finalizar a rota para liberar o checklist de retorno.
            </p>
            <button
              onClick={() => navigate("/route-complete")}
              className="rp-tap mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary-container min-h-[52px] text-label-lg font-bold text-primary-foreground"
            >
              <Icon name="flag" size={20} /> Concluir Rota
            </button>
          </div>
        )}
      </div>
    </div>
  );
}