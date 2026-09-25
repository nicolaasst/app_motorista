// Cores semânticas dos segmentos do traçado no mapa.
// Cada tom é desenhado em duas camadas (uma grossa/escura por baixo,
// outra fina/viva por cima) para dar profundidade.
export const SEGMENT_TONES = {
  done: { under: "#0B5B2A", over: "#15803D", overOpacity: 0.95, weight: [9, 5] },
  active: { under: "#9C7A00", over: "#FFD80F", overOpacity: 1, weight: [10, 6] },
  future: { under: "#3F3F46", over: "#9CA3AF", overOpacity: 0.5, weight: [7, 4] },
  danger: { under: "#7F1D1D", over: "#DC2626", overOpacity: 0.9, weight: [8, 5] },
  recalc: { under: "#3F3F46", over: "#9CA3AF", overOpacity: 0.8, weight: [8, 5] },
  offroute: { under: "#27272A", over: "#71717A", overOpacity: 1, weight: [6, 3] },
};

export function buildSegments({
  track,
  activeLeg,
  futureLegs,
  recalculating,
  offRoute,
  offRouteFrom,
  position,
}) {
  const segments = [];

  const doneCoords = (track || []).filter((p) => p.lat && p.lng).map((p) => [p.lat, p.lng]);
  if (doneCoords.length >= 2) segments.push({ id: "done", coords: doneCoords, tone: "done" });

  if (activeLeg?.coords?.length >= 2) {
    segments.push({
      id: "active",
      coords: activeLeg.coords.map((c) => [c.lat, c.lng]),
      tone: recalculating ? "recalc" : "active",
    });
  }

  (futureLegs || []).forEach((leg, i) => {
    if (!leg.coords || leg.coords.length < 2) return;
    const skipped = leg.stop?.status === "reagendada" || leg.stop?.status === "falha";
    segments.push({
      id: `future-${i}`,
      coords: leg.coords.map((c) => [c.lat, c.lng]),
      tone: skipped ? "danger" : "future",
    });
  });

  if (offRoute && offRouteFrom && position) {
    segments.push({
      id: "offroute",
      coords: [
        [offRouteFrom.lat, offRouteFrom.lng],
        [position.lat, position.lng],
      ],
      tone: "offroute",
    });
  }

  return segments;
}