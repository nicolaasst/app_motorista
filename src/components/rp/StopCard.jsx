import { useNavigate } from "react-router-dom";
import { Icon } from "./Icon";
import { StatusPill } from "./StatusPill";

const statusPill = {
  "a-caminho": { s: "blue", t: "A Caminho" },
  pendente: { s: "gray", t: "Pendente" },
  entregue: { s: "green", t: "Entregue" },
  falha: { s: "red", t: "Falha" },
};

export function StopCard({ stop, isNext = false, onNavigate, onDetail }) {
  const navigate = useNavigate();
  const sp = statusPill[stop.status] || statusPill.pendente;
  const volCount = Array.isArray(stop.volumes) ? stop.volumes.length : stop.volumes || 0;
  const goDetail = () => (onDetail ? onDetail(stop) : navigate(`/stop/${stop.id}`));
  const goNav = () => (onNavigate ? onNavigate(stop) : navigate(`/stop/${stop.id}/navigate`));
  return (
    <div onClick={goDetail} className={`card cursor-pointer p-4 transition active:scale-[0.99] ${isNext ? "ring-2 ring-primary-container" : ""}`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-code-md ${isNext ? "bg-onyx text-lime" : "bg-muted text-muted-foreground"}`}>
          {stop.seq || stop.id}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StatusPill status={sp.s}>{sp.t}</StatusPill>
            {isNext && <span className="text-label-sm text-primary-deep">Próxima</span>}
          </div>
          <p className="mt-1 truncate text-label-md">{stop.name}</p>
          <p className="flex items-center gap-1 truncate text-body-md text-muted-foreground">
            <Icon name="pin_drop" size={14} /> {stop.address}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-label-sm text-muted-foreground">
        <span className="flex items-center gap-1"><Icon name="schedule" size={14} /> {stop.window}</span>
        <span className="flex items-center gap-1"><Icon name="package_2" size={14} /> {volCount} volumes</span>
        {stop.nf && <span className="text-primary-deep">{stop.nf}</span>}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); goNav(); }}
          className="rp-tap inline-flex items-center gap-1 rounded-full bg-primary-container px-3 py-1.5 text-label-sm text-primary-foreground"
        >
          <Icon name="navigation" size={16} /> Navegar
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); goDetail(); }}
          className="rp-tap inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-label-sm text-muted-foreground"
        >
          <Icon name="info" size={16} /> Ver Detalhes
        </button>
      </div>
    </div>
  );
}

export default StopCard;