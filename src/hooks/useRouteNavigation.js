import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { atualizarPolyline } from "@/api/app-motorista";
import { fetchRoute } from "@/lib/routing";
import { alongRouteBearing, angleDiff, distanceToPolyline } from "@/lib/geo";

const PENDING_STATUS = ["nao_iniciada", "em_rota", "em_atendimento", "reagendada"];

const DEVIATION_HOLD_MS = 2500; // desvio precisa se manter antes de recalcular
const OPPOSITE_HOLD_MS = 3500;
const OPPOSITE_DEG = 110;
const REROUTE_COOLDOWN_MS = 9000;
const MIN_THRESHOLD_M = 45;
const MAX_THRESHOLD_M = 140;
const MAX_FUTURE_LEGS = 10;

export function useRouteNavigation({
  route,
  stops,
  nextStop,
  position,
  heading,
  accuracy,
  enabled = true,
}) {
  const [activeLeg, setActiveLeg] = useState(null);
  const [futureLegs, setFutureLegs] = useState([]);
  const [recalculating, setRecalculating] = useState(false);
  const [offRoute, setOffRoute] = useState(false);
  const [offRouteFrom, setOffRouteFrom] = useState(null);

  const posRef = useRef(position);
  posRef.current = position;
  const headingRef = useRef(heading);
  headingRef.current = heading;
  const routeRef = useRef(route);
  routeRef.current = route;
  const nextStopRef = useRef(nextStop);
  nextStopRef.current = nextStop;

  const offRouteRef = useRef(false);
  const lastRerouteRef = useRef(0);
  const deviationSinceRef = useRef(0);
  const deviationPointRef = useRef(null);
  const oppositeSinceRef = useRef(0);
  const lastPolylineRef = useRef(null);

  const routeLeg = useCallback(async (from, to) => {
    if (!from || !to?.lat || !to?.lng) return;
    setRecalculating(true);
    try {
      const leg = await fetchRoute(from, { lat: to.lat, lng: to.lng }, { bearing: headingRef.current });
      setActiveLeg(leg);
      const routeId = routeRef.current?.id;
      if (routeId && leg.polyline && leg.polyline !== lastPolylineRef.current) {
        lastPolylineRef.current = leg.polyline;
        if (typeof navigator === "undefined" || navigator.onLine) {
          atualizarPolyline(routeId, leg.polyline).catch(() => {});
        }
      }
    } catch {
      // falha definitiva: mantém a última rota calculada em tela
    } finally {
      setRecalculating(false);
    }
  }, []);

  // Traçado motorista -> próxima parada
  const hasPosition = !!position;
  useEffect(() => {
    if (!enabled) return;
    const to = nextStop;
    if (!to?.lat || !to?.lng) {
      setActiveLeg(null);
      return;
    }
    const from = posRef.current || routeRef.current?.origin || null;
    if (!from) return;
    let alive = true;
    setRecalculating(true);
    fetchRoute(from, { lat: to.lat, lng: to.lng }, { bearing: headingRef.current })
      .then((leg) => {
        if (!alive) return;
        setActiveLeg(leg);
        const routeId = routeRef.current?.id;
        if (routeId && leg.polyline && leg.polyline !== lastPolylineRef.current) {
          lastPolylineRef.current = leg.polyline;
          if (typeof navigator === "undefined" || navigator.onLine) {
            atualizarPolyline(routeId, leg.polyline).catch(() => {});
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setRecalculating(false);
      });
    return () => {
      alive = false;
    };
  }, [enabled, nextStop?.id, nextStop?.lat, nextStop?.lng, hasPosition]);

  // Traçado futuro: das paradas seguintes em diante
  const pending = useMemo(
    () =>
      (stops || [])
        .filter((s) => PENDING_STATUS.includes(s.status))
        .sort((a, b) => (a.sequence || 0) - (b.sequence || 0)),
    [stops],
  );
  const futureKey = pending
    .slice(1, MAX_FUTURE_LEGS + 2)
    .map((s) => `${s.id}:${s.status}`)
    .join(">");

  useEffect(() => {
    if (!enabled) return;
    const chain = pending.slice(1, MAX_FUTURE_LEGS + 2);
    if (chain.length < 2) {
      setFutureLegs([]);
      return;
    }
    let alive = true;
    (async () => {
      const jobs = [];
      for (let i = 0; i < chain.length - 1; i++) {
        const a = chain[i];
        const b = chain[i + 1];
        if (!a.lat || !b.lat) continue;
        jobs.push(
          fetchRoute({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng })
            .then((leg) => ({ coords: leg.coords, stop: b }))
            .catch(() => null),
        );
      }
      const results = await Promise.all(jobs);
      if (alive) setFutureLegs(results.filter(Boolean));
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, futureKey]);

  // Detecção de desvio + recálculo automático
  useEffect(() => {
    if (!enabled || !position || !activeLeg?.coords?.length) return;
    const now = Date.now();
    const { distance, point, index } = distanceToPolyline(position, activeLeg.coords);
    const threshold = Math.min(
      Math.max(MIN_THRESHOLD_M, (accuracy || 0) * 2.5),
      MAX_THRESHOLD_M,
    );

    let deviated = false;
    if (distance > threshold) {
      if (!deviationSinceRef.current) {
        deviationSinceRef.current = now;
        deviationPointRef.current = point;
      }
      deviated = now - deviationSinceRef.current >= DEVIATION_HOLD_MS;
    } else {
      deviationSinceRef.current = 0;
      deviationPointRef.current = null;
    }

    const routeBearing = alongRouteBearing(activeLeg.coords, index, 30);
    let opposite = false;
    if (routeBearing != null && typeof heading === "number") {
      if (Math.abs(angleDiff(heading, routeBearing)) >= OPPOSITE_DEG) {
        if (!oppositeSinceRef.current) oppositeSinceRef.current = now;
        opposite = now - oppositeSinceRef.current >= OPPOSITE_HOLD_MS;
      } else {
        oppositeSinceRef.current = 0;
      }
    } else {
      oppositeSinceRef.current = 0;
    }

    if (deviated || opposite) {
      if (now - lastRerouteRef.current >= REROUTE_COOLDOWN_MS) {
        lastRerouteRef.current = now;
        deviationSinceRef.current = 0;
        oppositeSinceRef.current = 0;
        offRouteRef.current = true;
        setOffRoute(true);
        setOffRouteFrom(deviationPointRef.current || point);
        routeLeg(position, nextStopRef.current);
      }
    } else if (distance <= threshold && offRouteRef.current) {
      offRouteRef.current = false;
      setOffRoute(false);
      setOffRouteFrom(null);
    }
  }, [enabled, position, activeLeg, accuracy, heading, routeLeg]);

  return {
    activeLeg,
    futureLegs,
    recalculating,
    offRoute,
    offRouteFrom,
    pending,
  };
}