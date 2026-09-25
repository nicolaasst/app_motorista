import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getDriver } from "@/lib/driver";
import { Icon } from "@/components/rp/Icon";
import { Card } from "@/components/rp/Card";
import { LineArt } from "@/components/rp/LineArt";
import { EmptyState } from "@/components/rp/EmptyState";
import { ILLUSTRATIONS } from "@/lib/illustrations";
import { EMPTY_VALUE } from "@/lib/utils";
import { syncNow } from "@/lib/syncEngine";

const pad = (n) => String(n).padStart(2, "0");
const hhmm = (iso) => (iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : EMPTY_VALUE);
const brl = (n) => Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const duration = (a, b) => {
  if (!a || !b) return EMPTY_VALUE;
  const ms = new Date(b) - new Date(a);
  if (ms <= 0) return EMPTY_VALUE;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${pad(h)}h ${pad(m)}m`;
};

export default function RouteCompletion() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { driver, driverId } = await getDriver();
      const routes = await base44.entities.Route.filter({ driver_id: driverId }, "-date", 5);
      const route = routes[0];
      if (!route) { if (alive) setData({ none: true }); return; }
      const [stops, volumes] = await Promise.all([
        base44.entities.Stop.filter({ route_id: route.id }, "sequence", 200),
        base44.entities.Volume.filter({ route_id: route.id }, "-created_date", 400),
      ]);
      if (alive) setData({ driver, route, stops, volumes });
    })();
    return () => { alive = false; };
  }, []);

  if (!data) return <div className="screen-pad pt-16"><div className="card h-40 animate-pulse" /><div className="card mt-4 h-32 animate-pulse" /></div>;
  if (data.none) return (
    <EmptyState
      fullScreen
      illustration={ILLUSTRATIONS.roundedWaving}
      title="Tudo certo por hoje"
      subtitle="Nenhuma rota ativa no momento"
      action={
        <button onClick={() => navigate("/")} className="rp-tap mt-3 inline-flex items-center gap-2 rounded-full bg-primary-container px-5 py-3 text-label-lg font-bold text-primary-foreground">
          <Icon name="home" size={20} /> Voltar ao Início
        </button>
      }
    />
  );

  const { driver, route, stops, volumes } = data;
  const total = stops.length || route.planned_stops || 0;
  const done = stops.filter((s) => s.status === "entregue").length;
  const failed = stops.filter((s) => s.status === "falha").length;
  const successPct = total ? Math.round((done / total) * 100) : 0;
  const distance = route.odometer_end && route.odometer_start ? Math.max(0, route.odometer_end - route.odometer_start) : route.planned_km || 0;
  const endRef = route.finished_at || stops.map((s) => s.finished_at).filter(Boolean).sort().pop();
  const dur = duration(route.started_at, endRef);

  // cadence: entregue stops by hour
  const byHour = {};
  stops.filter((s) => s.status === "entregue" && s.finished_at).forEach((s) => {
    const h = new Date(s.finished_at).getHours();
    byHour[h] = (byHour[h] || 0) + 1;
  });
  const hours = Object.keys(byHour).map(Number).sort((a, b) => a - b);
  const maxC = Math.max(1, ...Object.values(byHour));
  const avg = hours.length ? (done / hours.length).toFixed(1) : "0";

  // pending returns: volumes retained for return
  const returns = volumes.filter((v) => v.return_status === "devolver" || v.return_status === "devolvido");
  const failedStop = stops.find((s) => s.status === "falha");

  const proceed = async () => {
    // Espera a sincronização pendente terminar antes de concluir a rota,
    // para não finalizar em paralelo com um envio ainda em andamento.
    setSyncing(true);
    await syncNow();
    if (route.status === "em_operacao") {
      await base44.entities.Route.update(route.id, { status: "concluida" });
    }
    setSyncing(false);
    navigate("/turn-closing");
  };

  return (
    <div className="app-shell flex flex-col">
      <header className="relative overflow-hidden bg-background px-5 pb-8 pt-14 text-foreground">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-yellow/30 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <img src={ILLUSTRATIONS.squareCambalhota} alt="" className="h-16 w-16 object-contain" />
          <div>
            <div className="text-body-md font-bold text-primary-deep">Rota concluída!</div>
            <h1 className="text-headline-lg">{successPct}% Executado</h1>
            <p className="text-body-sm text-muted-foreground">Turno Encerrado</p>
          </div>
        </div>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-body-md font-bold">
          <Icon name="check_circle" size={18} /> Parabéns, {(driver?.full_name || "Motorista").split(" ")[0]}! Rota Finalizada
        </div>
      </header>

      <div className="flex-1 space-y-4 px-5 pb-28 pt-5">
        <Card>
          <div className="flex items-center gap-2 text-body-md font-bold text-muted-foreground">
            <Icon name="receipt_long" size={16} /> {route.code}
            <span className="ml-auto chip status-green">Ritmo Excelente</span>
          </div>
          <p className="mt-1 text-body-sm font-semibold text-muted-foreground">Resumo de Produtividade • Concluído às {endRef ? hhmm(endRef) : EMPTY_VALUE}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted p-3">
              <div className="flex items-center gap-1.5 text-label-sm text-muted-foreground"><Icon name="inventory_2" size={14} /> Paradas</div>
              <p className="mt-1 text-headline-lg font-extrabold">{total}</p>
              <p className="text-body-sm text-muted-foreground">100% visitadas</p>
            </div>
            <div className="rounded-xl bg-status-green-bg p-3">
              <div className="flex items-center gap-1.5 text-label-sm text-status-green-fg"><Icon name="check_circle" size={14} /> {successPct}%</div>
              <p className="mt-1 text-headline-lg font-extrabold text-status-green-fg">{done}</p>
              <p className="text-body-sm text-status-green-fg">Entregues com sucesso</p>
            </div>
          </div>
          {failed > 0 && (
            <div className="mt-2 rounded-xl bg-status-red-bg/60 p-3">
              <p className="text-body-md font-bold text-status-red-fg">{failed} devolução • {failedStop ? "Parada #" + pad(failedStop.sequence) : EMPTY_VALUE}</p>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3.5">
            <div className="flex items-center gap-1.5 text-label-sm text-muted-foreground"><Icon name="speed" size={14} /> Odômetro</div>
            <p className="mt-1 text-headline-sm font-extrabold">{brl(distance)}km</p>
            <p className="text-body-sm text-muted-foreground">Planejado: {brl(route.planned_km)} km</p>
          </Card>
          <Card className="p-3.5">
            <div className="flex items-center gap-1.5 text-label-sm text-muted-foreground"><Icon name="schedule" size={14} /> Tempo em Trânsito</div>
            <p className="mt-1 text-headline-sm font-extrabold">{dur}</p>
            <p className="text-body-sm text-muted-foreground">Início {hhmm(route.started_at)} • Término {endRef ? hhmm(endRef) : EMPTY_VALUE}</p>
          </Card>
        </div>

        {returns.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 text-body-md font-bold text-status-amber-fg"><Icon name="undo" size={18} /> Devolução Pendente • Doca Central</div>
            <p className="mt-1 text-body-sm text-muted-foreground">{returns.length} volume(s) retido(s) precisa(m) ser descarregado(s) na base.</p>
            <div className="mt-3 space-y-2">
              {returns.map((v) => (
                <div key={v.id} className="flex items-center gap-2 rounded-xl bg-muted p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground"><Icon name="inventory" size={18} /></span>
                  <div className="flex-1"><p className="text-body-sm font-bold">Identificador do Pacote</p><p className="text-body-sm text-muted-foreground">{v.vol_code || v.label}</p></div>
                  <button className="flex items-center gap-1.5 rounded-lg bg-primary-container px-3 py-2 text-label-sm font-bold text-primary-foreground"><Icon name="qr_code_scanner" size={16} /> Validar</button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {hours.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 text-body-md font-extrabold"><Icon name="bar_chart" size={20} className="text-primary-deep" /> Cadência de Entregas por Hora</div>
            <p className="text-body-sm font-semibold text-muted-foreground">Média: {avg} /h</p>
            <div className="mt-3 flex items-end justify-between gap-1.5" style={{ height: 120 }}>
              {hours.map((h) => {
                const c = byHour[h];
                const failHour = failedStop && new Date(failedStop.finished_at || failedStop.arrived_at).getHours() === h;
                return (
                  <div key={h} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex w-full flex-1 items-end justify-center">
                      <div className={`w-full max-w-7 rounded-t-md ${failHour ? "bg-status-red-fg" : "bg-primary-container"}`} style={{ height: `${Math.max((c / maxC) * 80, 6)}px` }} />
                    </div>
                    <span className="text-label-sm text-muted-foreground">{pad(h)}h</span>
                    <span className={`text-label-sm font-extrabold ${failHour ? "text-status-red-fg" : "text-foreground"}`}>{c}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <button
          onClick={proceed}
          disabled={syncing}
          className="rp-tap flex w-full items-center justify-center gap-2 rounded-full bg-primary-container min-h-[52px] text-label-lg text-primary-foreground shadow-cta disabled:opacity-60"
        >
          {syncing ? (
            <>
              <Icon name="cloud_sync" size={20} className="animate-spin" /> Sincronizando pendências…
            </>
          ) : (
            <>
              Prosseguir para Checklist de Retorno <Icon name="arrow_forward" size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}