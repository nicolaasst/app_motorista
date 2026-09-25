import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getDriver } from "@/lib/driver";
import { Icon } from "@/components/rp/Icon";
import { Card } from "@/components/rp/Card";
import { maskOdometer } from "@/lib/masks";
import { EMPTY_VALUE } from "@/lib/utils";

const ITEMS = [
  { key: "pneus", icon: "radio_button_checked", label: "Pneus e Calibragem", desc: "Sem desgaste excessivo / devidamente calibrados" },
  { key: "luzes", icon: "lightbulb", label: "Luzes, Faróis e Setas", desc: "Funcionamento pleno da iluminação e sinalização" },
  { key: "fluidos", icon: "local_gas_station", label: "Nível de Óleo e Combustível", desc: "Fluidos verificados e tanque acima de 50%" },
  { key: "documentos", icon: "verified_user", label: "Documentação e CRLV-e", desc: "Porte obrigatório físico ou digital em dia" },
  { key: "lat", icon: "directions_car", label: "Lataria e Avarias Externas", desc: "Sem riscos profundos, batidas ou mossas" },
];

export default function PreOpChecklist() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [values, setValues] = useState(ITEMS.map(() => null));
  const [odometer, setOdometer] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { driver, driverId } = await getDriver();
      const routes = await base44.entities.Route.filter({ driver_id: driverId }, "-date", 1);
      const route = routes[0];
      const vehicles = await base44.entities.Vehicle.list();
      const vehicle = vehicles.find((v) => v.fleet === driver?.fleet) || vehicles[0];
      if (alive) {
        setData({ driver, route, vehicle });
        if (vehicle?.last_odometer_km) setOdometer(String(vehicle.last_odometer_km));
      }
    })();
    return () => { alive = false; };
  }, []);

  const setVal = (i, v) => { const n = [...values]; n[i] = v; setValues(n); };
  const okCount = values.filter((v) => v === true).length;
  const allOk = values.every((v) => v === true) && Number(odometer) > 0;

  const start = async () => {
    if (!allOk || !data?.route) return;
    setSaving(true);
    const odo = Number(odometer);
    const items = ITEMS.map((it, i) => ({ key: it.key, label: it.label, ok: values[i], note: values[i] === false ? "Reprovado" : null }));
    await base44.entities.VehicleChecklist.create({
      route_id: data.route.id, type: "pre", items, odometer_km: odo,
      declaration_accepted: true, completed_at: new Date().toISOString(),
    });
    await base44.entities.Route.update(data.route.id, {
      status: "em_operacao",
      started_at: new Date().toISOString(),
      odometer_start: odo,
    });
    if (data.vehicle && odo > (data.vehicle.last_odometer_km || 0)) {
      await base44.entities.Vehicle.update(data.vehicle.id, { last_odometer_km: odo });
    }
    navigate("/");
  };

  if (!data) return <div className="screen-pad pt-16"><div className="card h-40 animate-pulse" /><div className="card mt-4 h-24 animate-pulse" /><div className="card mt-4 h-24 animate-pulse" /></div>;

  const { driver, route, vehicle } = data;
  const shiftLabel = route?.shift === "manha" ? "Matutino" : route?.shift === "tarde" ? "Vespertino" : "Integral";

  return (
    <div className="app-shell flex flex-col">
      <header className="bg-card border-b border-border px-5 pb-6 pt-12 text-foreground">
        <div className="flex items-center gap-2 text-label-sm text-muted-foreground"><Icon name="shield" size={16} /> Checklist Pré-Operacional</div>
        <h1 className="mt-1 text-headline-lg">Etapa 1 de 2</h1>
        <p className="mt-1 text-body-md text-muted-foreground">Inspeção obrigatória de segurança antes de assumir a direção.</p>
      </header>

      <div className="flex-1 space-y-4 px-5 pb-28 pt-5">
        <Card>
          <div className="flex items-center gap-2 text-label-sm text-primary-deep"><Icon name="local_shipping" size={16} /> Veículo Alocado • Liberado p/ inspeção</div>
          <p className="mt-2 text-body-lg font-extrabold leading-tight">{vehicle?.brand_model || EMPTY_VALUE}</p>
          <p className="text-body-sm text-muted-foreground">{vehicle?.body_type || "Furgão"} • Frota {vehicle?.fleet || EMPTY_VALUE}</p>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-muted px-3 py-2.5">
            <div className="flex items-center gap-2 text-body-md font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-primary-foreground text-label-sm">BRA</span>
              {vehicle?.plate || EMPTY_VALUE}
            </div>
            <span className="text-label-sm text-muted-foreground">Frota {vehicle?.fleet || EMPTY_VALUE}</span>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3.5"><div className="flex items-center gap-1.5 text-label-sm text-muted-foreground"><Icon name="person" size={14} /> Motorista</div><p className="mt-1 text-body-md font-bold">{driver?.full_name || EMPTY_VALUE}</p></Card>
          <Card className="p-3.5"><div className="flex items-center gap-1.5 text-label-sm text-muted-foreground"><Icon name="schedule" size={14} /> Turno</div><p className="mt-1 text-body-md font-bold">{shiftLabel}</p></Card>
        </div>

        <Card>
          <div className="flex items-center gap-2 text-body-md font-bold"><Icon name="speed" size={20} className="text-primary-deep" /> Quilometragem Inicial (KM)</div>
          <p className="text-body-sm text-muted-foreground">Último: {maskOdometer(String(vehicle?.last_odometer_km || 0))} km</p>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-input bg-card px-3">
            <input value={odometer} onChange={(e) => setOdometer(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="min-h-[44px] flex-1 bg-transparent text-code-lg font-bold outline-none" />
            <span className="text-body-md font-bold text-muted-foreground">km</span>
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-body-md font-bold">Itens de Verificação</p>
          <span className="chip status-green">{okCount} de {ITEMS.length} conformes</span>
        </div>

        {ITEMS.map((item, i) => (
          <div key={item.key} className="card p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Icon name={item.icon} size={20} /></span>
              <div className="flex-1">
                <p className="text-body-md font-bold leading-tight">{item.label}</p>
                <p className="text-body-sm text-muted-foreground">{item.desc}</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => setVal(i, true)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-label-sm font-bold ${values[i] === true ? "bg-primary-container text-primary-foreground" : "bg-muted text-muted-foreground"}`}><Icon name="check_circle" size={16} /> Sim</button>
                  <button type="button" onClick={() => setVal(i, false)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-label-sm font-bold ${values[i] === false ? "bg-destructive text-white" : "bg-muted text-muted-foreground"}`}><Icon name="cancel" size={16} /> Não</button>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="rounded-2xl border border-status-amber-bg bg-status-amber-bg/40 p-3.5 text-body-sm text-status-amber-fg">
          <b>Atesta conformidade</b> das condições do veículo conforme normas vigentes do Código de Trânsito Brasileiro e diretrizes operacionais de transporte seguro.
        </div>

        <button onClick={start} disabled={!allOk || saving} className="rp-tap flex w-full items-center justify-center gap-2 rounded-full bg-primary-container min-h-[52px] text-label-lg text-primary-foreground shadow-cta disabled:opacity-50">
          {saving ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <><Icon name="play_arrow" size={20} /> Iniciar Turno e Carregar Rotas</>}
        </button>
      </div>
    </div>
  );
}