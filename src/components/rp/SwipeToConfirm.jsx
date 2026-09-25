import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { hapticsSucesso } from "@/lib/haptics";

// Swipe-to-confirm control for irreversible actions (arrival, next-stop, route finish).
// The driver drags the puck ~85% of the track; releasing early springs back with no action.
export function SwipeToConfirm({ label = "Arraste para confirmar", icon, onConfirm, disabled, compact = false, className = "" }) {
  const trackRef = useRef(null);
  const [max, setMax] = useState(0);
  const [x, setX] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);
  const [armed, setArmed] = useState(false);
  const PUCK = compact ? 40 : 52;

  useEffect(() => {
    const measure = () => {
      if (!trackRef.current) return;
      setMax(Math.max(0, trackRef.current.clientWidth - PUCK));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const threshold = max * 0.85;

  const onDown = (e) => {
    if (disabled || max <= 0) return;
    dragging.current = true;
    startX.current = e.clientX - x;
    setArmed(false);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!dragging.current) return;
    setX(Math.max(0, Math.min(max, e.clientX - startX.current)));
  };
  const onUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (x >= threshold) {
      setArmed(true);
      setX(max);
      hapticsSucesso();
      setTimeout(() => {
        onConfirm?.();
        setX(0);
        setArmed(false);
      }, 220);
    } else {
      setX(0);
    }
  };

  const pct = max ? Math.round((x / max) * 100) : 0;

  return (
    <div
      ref={trackRef}
      className={`relative flex items-center rounded-full w-full overflow-hidden select-none ${compact ? "min-h-[44px]" : "min-h-[56px]"} ${disabled ? "opacity-50" : ""} ${className}`}
      style={{ background: armed ? "hsl(var(--status-green-bg))" : "hsl(var(--muted))" }}
    >
      <div className="absolute inset-y-0 left-0 rounded-full bg-primary/25" style={{ width: `${pct}%` }} />
      <div className={`pointer-events-none absolute inset-0 flex items-center justify-center ${compact ? "pr-11" : "pr-16"}`}>
        <span className={`flex items-center gap-2 font-bold transition-opacity duration-150 ${compact ? "text-label-md" : "text-label-lg"} ${x > 6 ? "opacity-0" : "text-muted-foreground"}`}>
          {icon && <Icon name={icon} size={compact ? 16 : 20} />} {label}
        </span>
      </div>
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="rp-tap relative z-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-cta"
        style={{ width: PUCK, height: PUCK, transform: `translateX(${x}px)`, touchAction: "none" }}
      >
        <Icon name={armed ? "check" : "double_arrow"} size={compact ? 20 : 24} />
      </div>
    </div>
  );
}

export default SwipeToConfirm;