import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useModoPaisagem } from "@/lib/useOrientacao";
import { Icon } from "./Icon";
import { SwipeToConfirm } from "./SwipeToConfirm";

const pad = (n) => String(n).padStart(2, "0");

/**
 * Collapsible stop info card for the navigation screen.
 * Drag down (or tap handle) to collapse to a summary bar;
 * drag up (or tap) to expand back to full details with map space freed.
 */
export function CollapsibleStopCard({ stop, phone, onArrive }) {
  const [expanded, setExpanded] = useState(true);
  const paisagem = useModoPaisagem();
  const startY = useRef(0);
  const dragging = useRef(false);

  const fullPhone = (phone || "").replace(/\D/g, "");

  const onDragStart = (e) => {
    dragging.current = true;
    startY.current = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
  };
  const onDragMove = (e) => {
    if (!dragging.current) return;
    const y = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
    const delta = y - startY.current;
    if (Math.abs(delta) > 60) {
      dragging.current = false;
      if (delta > 0) setExpanded(false);
      else setExpanded(true);
    }
  };
  const onDragEnd = () => { dragging.current = false; };

  // Em landscape a altura útil é curta — começa colapsado para o mapa e o
  // swipe compacto de chegada ficarem visíveis sem rolagem.
  useEffect(() => {
    if (paisagem) setExpanded(false);
  }, [paisagem]);

  return (
    <div className="rounded-t-3xl bg-background px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-3 shadow-elevated">
      {/* Drag handle — always visible */}
      <div
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onClick={() => !dragging.current && setExpanded((v) => !v)}
        className="rp-tap mx-auto mb-2 flex h-7 w-16 cursor-grab touch-none items-center justify-center rounded-full active:cursor-grabbing"
      >
        <span className={`h-1 w-10 rounded-full bg-muted transition-colors ${expanded ? "bg-muted" : "bg-primary-deep"}`} />
      </div>

      {/* Summary bar — always visible */}
      <div className="flex items-center gap-2">
        <span className="chip bg-onyx text-lime">PARADA #{pad(stop.sequence)}</span>
        <span className="truncate text-body-sm font-semibold text-muted-foreground">{stop.kind}</span>
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Recolher" : "Expandir"}
          className="rp-tap ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-muted"
        >
          <Icon name={expanded ? "expand_more" : "expand_less"} size={20} />
        </button>
      </div>
      <h2 className="mt-1 truncate text-headline-sm">{stop.recipient_name}</h2>

      {/* Expandable detail section */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
            className="overflow-hidden"
          >
            <p className="flex items-center gap-1 pt-1 text-body-md text-muted-foreground">
              <Icon name="pin_drop" size={16} />
              {[stop.address_line, stop.district, stop.city].filter(Boolean).join(" - ")}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-muted py-2">
                <p className="text-code-md">{stop.eta || "--:--"}</p>
                <p className="text-label-sm text-muted-foreground">Chegada</p>
              </div>
              <div className="rounded-xl bg-muted py-2">
                <p className="text-code-md">8 min</p>
                <p className="text-label-sm text-muted-foreground">Tempo</p>
              </div>
              <div className="rounded-xl bg-muted py-2">
                <p className="text-code-md">2.4 km</p>
                <p className="text-label-sm text-muted-foreground">Distância</p>
              </div>
            </div>
            <SwipeToConfirm
              className="mt-4"
              label="Cheguei no Local da Entrega"
              icon="pin_drop"
              onConfirm={onArrive}
            />
            {fullPhone && (
              <div className="mt-3 flex gap-2">
                <a href={`tel:${fullPhone}`} className="rp-tap flex flex-1 items-center justify-center gap-2 rounded-full border border-border py-2.5 text-label-md">
                  <Icon name="phone_in_talk" size={18} /> Ligar
                </a>
                <a href={`https://wa.me/55${fullPhone}`} className="rp-tap flex flex-1 items-center justify-center gap-2 rounded-full border border-border py-2.5 text-label-md text-primary-deep">
                  <Icon name="chat" size={18} /> WhatsApp
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed quick actions */}
      {!expanded && (
        <motion.div
          key="collapsed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 flex items-center gap-2"
        >
          {fullPhone && (
            <>
              <a href={`tel:${fullPhone}`} className="rp-tap flex h-11 w-11 items-center justify-center rounded-full border border-border">
                <Icon name="phone_in_talk" size={20} />
              </a>
              <a href={`https://wa.me/55${fullPhone}`} className="rp-tap flex h-11 w-11 items-center justify-center rounded-full border border-border text-primary-deep">
                <Icon name="chat" size={20} />
              </a>
            </>
          )}
          <SwipeToConfirm compact label="Cheguei" icon="pin_drop" onConfirm={onArrive} className="flex-1" />
        </motion.div>
      )}
    </div>
  );
}

export default CollapsibleStopCard;