import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { encerrarTurno, meuVeiculo, minhasRotas, novaChave, volumesDaRota } from "@/api/app-motorista";
import { getDriver } from "@/lib/driver";
import { Icon } from "@/components/rp/Icon";
import { Card } from "@/components/rp/Card";
import { EMPTY_VALUE } from "@/lib/utils";

const ITEMS = [
  { key: "combustivel", icon: "local_gas_station", label: "Combustível e Fluidos", desc: "Tanque reposto conforme política da frota / sem alertas no painel." },
  { key: "lataria", icon: "directions_car", label: "Lataria e Novas Avarias", desc: "Nenhum novo risco, batida ou amassado durante a rota operacional." },
  { key: "pneus", icon: "radio_button_checked", label: "Pneus e Calibragem", desc: "Sem furos, bolhas ou danos laterais durante a operação de hoje." },
  { key: "limpeza", icon: "cleaning_services", label: "Limpeza da Cabine e Baú", desc: "Lixo recolhido e baú limpo, varrido e 100% descarregado." },
  { key: "chaves", icon: "key", label: "Devolução de Chaves e CRLV", desc: "Chave física, documento CRLV e cartão de combustível entregues na guarita." },
];

export default function TurnClosing() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [values, setValues] = useState(ITEMS.map(() => null));
  const [odometer, setOdometer] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [chave] = useState(() => novaChave());

  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ driver }, concluidas, recentes] = await Promise.all([
        getDriver(),
        minhasRotas({ status: ["concluida", "retorno_ok"], limite: 1 }),
        minhasRotas({ limite: 1 }),
      ]);
      const route = concluidas[0] || recentes[0];
      const [vehicle, volumes] = route ? await Promise.all([meuVeiculo(route.id), volumesDaRota(route.id, 400)]) : [null, []];
      if (alive) {
        setData({ driver, route, vehicle, volumes });
        const baseOdo = route?.odometer_end || vehicle?.last_odometer_km || 0;
        setOdometer(String(baseOdo));
      }
    })();
    return () => { alive = false; };
  }, []);

  const setVal = (i, v) => { const n = [...values]; n[i] = v; setValues(n); };
  const okCount = values.filter((v) => v === true).length;
  const allOk = values.every((v) => v === true) && agreed && Number(odometer) > 0;

  const encerrar = async () => {
    if (!allOk || !data?.route) return;
    setSaving(true);
    const odo = Number(odometer);
    const items = ITEMS.map((it, i) => ({ key: it.key, label: it.label, ok: values[i], note: values[i] === false ? "Reprovado" : null }));
    try {
      // Checklist de retorno + encerramento + hodômetro do veículo numa transação no servidor.
      await encerrarTurno({ chave, rotaId: data.route.id, itens: items, odometro: odo });
      navigate("/");
    } catch (e) {
      setErro(e?.message || "Não foi possível encerrar o turno. Tente novamente.");
      setSaving(false);
    }
  };

  if (!data) return <div className="screen-pad pt-16"><div className="card h-40 animate-pulse" /><div className="card mt-4 h-32 animate-pulse" /></div>;

  const { driver, route, vehicle, volumes } = data;
  const kmPercorrido = route?.odometer_start && Number(odometer) ? Math.max(0, Number(odometer) - route.odometer_start) : route?.planned_km || 0;
  const returns = volumes.filter((v) => v.return_status === "devolvido" || v.return_status === "devolver");

  return (
    <div className="app-shell flex flex-col">
      <header className="bg-card border-b border-border px-5 pb-6 pt-12 text-foreground">
        <p className="text-label-sm text-muted-foreground">Etapa Final • Fechamento de Turno</p>
        <h1 className="text-headline-lg">Retorno à Base</h1>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-body-md font-bold"><Icon name="local_shipping" size={18} /> {vehicle?.plate || EMPTY_VALUE}</div>
      </header>

      <div className="flex-1 space-y-4 px-5 pb-28 pt-5">
        <Card>
          <p className="text-body-lg font-extrabold leading-tight">{vehicle?.brand_model || EMPTY_VALUE}</p>
          <p className="text-body-sm text-muted-foreground">{vehicle?.body_type || "Furgão"} • Frota {vehicle?.fleet || EMPTY_VALUE}</p>
          <div className="mt-3 flex items-center gap-2 text-body-md font-semibold"><Icon name="person" size={16} className="text-primary-deep" /> Motorista • {driver?.full_name || EMPTY_VALUE}</div>
          <p className="text-body-sm text-muted-foreground">Turno Operacional: {route?.shift === "manha" ? "Manhã" : route?.shift === "tarde" ? "Tarde" : "Integral"} (Encerramento)</p>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-body-md font-extrabold"><Icon name="speed" size={20} className="text-primary-deep" /> Odômetro de Fechamento</div>
          <p className="text-body-sm font-semibold text-status-green-fg">+{Math.round(kmPercorrido)} km na rota</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-muted py-2.5">
              <p className="text-label-sm text-muted-foreground">KM Inicial (Saída)</p>
              <p className="text-headline-sm font-extrabold">{(route?.odometer_start || vehicle?.last_odometer_km || 0).toLocaleString("pt-BR")} km</p>
            </div>
            <div className="rounded-xl bg-muted py-2.5">
              <p className="text-label-sm text-muted-foreground">KM Percorrido</p>
              <p className="text-headline-sm font-extrabold text-primary-deep">{Math.round(kmPercorrido)} km</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-input bg-card px-3">
            <input value={odometer} onChange={(e) => setOdometer(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="min-h-[44px] flex-1 bg-transparent text-code-lg font-bold outline-none" />
            <span className="text-body-sm font-bold text-muted-foreground">KM no Painel</span>
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-body-md font-extrabold">Itens Obrigatórios de Pátio</p>
          <span className="chip status-green">{okCount}/{ITEMS.length} conferidos</span>
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

        {returns.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 text-body-md font-extrabold"><Icon name="undo" size={20} className="text-primary-deep" /> Devoluções & Sobras</div>
            <span className="chip status-amber">{returns.length} Pendência(s) Baixada(s)</span>
            <div className="mt-3 space-y-2">
              {returns.map((v) => (
                <div key={v.id} className="flex items-center gap-3 rounded-xl bg-muted p-3">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${v.return_status === "devolvido" ? "bg-status-green-bg text-status-green-fg" : "bg-status-amber-bg text-status-amber-fg"}`}><Icon name={v.return_status === "devolvido" ? "check_circle" : "pending"} size={18} /></span>
                  <div className="flex-1"><p className="text-body-sm font-bold">{v.vol_code || v.label}</p><p className="text-body-sm text-muted-foreground">Doca: {v.return_dock || EMPTY_VALUE}</p></div>
                  <span className={`chip ${v.return_status === "devolvido" ? "status-green" : "status-amber"}`}>{v.return_status === "devolvido" ? "Recebido" : "Pendente"}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="rounded-2xl border border-status-amber-bg bg-status-amber-bg/50 p-4">
          <div className="flex items-center gap-2 text-body-md font-bold text-status-amber-fg"><Icon name="assignment_turned_in" size={20} /> Termo de Encerramento Operacional</div>
          <p className="mt-1 text-body-sm text-status-amber-fg">Ao encerrar o turno, atesto que o veículo foi entregue nas condições declaradas acima e todas as ocorrências de campo foram devidamente registradas no sistema NGS.</p>
          <label className="mt-3 flex items-center gap-2 text-body-md font-bold text-status-amber-fg">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="h-4 w-4 rounded accent-primary-container" /> Declaro verídicas as informações do checklist
          </label>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-label-sm font-semibold text-status-green-fg"><Icon name="sync" size={14} /> Sincronização em nuvem ativa • Pronto para envio</p>

        {erro && <p className="mb-2 text-center text-body-sm font-semibold text-destructive">{erro}</p>}
        <button onClick={encerrar} disabled={!allOk || saving} className="rp-tap flex w-full items-center justify-center gap-2 rounded-full bg-primary-container min-h-[52px] text-label-lg text-primary-foreground shadow-cta disabled:opacity-50">
          {saving ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <><Icon name="logout" size={20} /> Encerrar Turno e Liberar Veículo</>}
        </button>
      </div>
    </div>
  );
}