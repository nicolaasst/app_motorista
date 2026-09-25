import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

const PENDING_STATUS = ["nao_iniciada", "em_rota", "em_atendimento", "reagendada"];
const POLL_MS = 30000;

// Compara periodicamente as paradas pendentes com o estado anterior conhecido.
// Paradas já finalizadas não contam como mudança.
export function useRouteChangeAlert({ routeId, enabled = true }) {
  const [alert, setAlert] = useState(null);
  const prevRef = useRef(null);

  useEffect(() => {
    if (!enabled || !routeId) return;
    let alive = true;

    const check = async () => {
      let stops = [];
      try {
        stops = await base44.entities.Stop.filter({ route_id: routeId }, "sequence", 200);
      } catch {
        return;
      }
      if (!alive) return;

      const pending = stops
        .filter((s) => PENDING_STATUS.includes(s.status))
        .map((s) => ({ id: s.id, sequence: s.sequence, name: s.recipient_name }));
      const sig = pending.map((p) => p.id).join(",");

      const prev = prevRef.current;
      if (prev && prev.sig !== sig) {
        const prevIds = prev.sig ? prev.sig.split(",") : [];
        const added = pending.filter((p) => !prevIds.includes(p.id));
        const keptNow = pending.filter((p) => prevIds.includes(p.id)).map((p) => p.id).join(",");
        const keptBefore = prevIds.filter((id) => pending.some((p) => p.id === id)).join(",");
        const reordered = !added.length && keptNow !== keptBefore;
        if (added.length || reordered) {
          setAlert({ added, reordered, at: Date.now() });
        }
      }
      prevRef.current = { sig, pending };
    };

    check();
    const timer = setInterval(check, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [enabled, routeId]);

  return { alert, dismiss: () => setAlert(null) };
}

export default useRouteChangeAlert;