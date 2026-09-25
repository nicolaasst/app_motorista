import { Fragment, useEffect } from "react";
import { Circle, MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SEGMENT_TONES, buildSegments } from "@/lib/routeSegments";

const STOP_COLORS = {
  entregue: "#15803D",
  em_rota: "#FFD80F",
  em_atendimento: "#FFD80F",
  reagendada: "#D97706",
  falha: "#DC2626",
  nao_iniciada: "#8B8B92",
};

const pad = (n) => String(n).padStart(2, "0");

function stopIcon(stop, isNext) {
  const color = isNext ? "#FFD80F" : STOP_COLORS[stop.status] || "#8B8B92";
  const size = isNext ? 32 : 26;
  const fg = isNext ? "#000000" : "#FFFFFF";
  return L.divIcon({
    className: "nav-stop-pin",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:${color};color:${fg};border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.5);font:700 ${isNext ? 12 : 11}px 'Space Mono',monospace">${pad(stop.sequence)}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function driverIcon(heading) {
  const rot = typeof heading === "number" ? Math.round(heading) : 0;
  return L.divIcon({
    className: "nav-driver-pin",
    html: `<div style="transform:rotate(${rot}deg);width:42px;height:42px;display:flex;align-items:center;justify-content:center">
      <div style="width:36px;height:36px;border-radius:9999px;background:#FFD80F;border:3px solid #fff;box-shadow:0 3px 12px rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center">
        <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:13px solid #000"></div>
      </div></div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
}

function Follow({ position, follow }) {
  const map = useMap();
  useEffect(() => {
    if (!follow || !position) return;
    map.setView([position.lat, position.lng], map.getZoom(), { animate: true, duration: 0.6 });
  }, [position?.lat, position?.lng, follow, map]);
  return null;
}

function MapReady() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function RecenterControl({ position }) {
  const map = useMap();
  return (
    <div style={{ position: "absolute", right: 14, bottom: 14, zIndex: 1000 }}>
      <button
        type="button"
        aria-label="Centralizar no veículo"
        onClick={() => {
          if (position) map.setView([position.lat, position.lng], 16, { animate: true });
        }}
        style={{
          width: 46,
          height: 46,
          borderRadius: 9999,
          background: "rgba(16,18,30,.85)",
          border: "1px solid rgba(255,255,255,.2)",
          color: "#FFD80F",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
          my_location
        </span>
      </button>
    </div>
  );
}

export function NavMap({
  position,
  heading,
  accuracy,
  track,
  activeLeg,
  futureLegs,
  recalculating,
  offRoute,
  offRouteFrom,
  stops = [],
  nextStopId,
  follow = true,
  onStopClick,
}) {
  const segments = buildSegments({
    track,
    activeLeg,
    futureLegs,
    recalculating,
    offRoute,
    offRouteFrom,
    position,
  });

  const validStops = stops.filter((s) => s.lat && s.lng);
  const center = position
    ? [position.lat, position.lng]
    : validStops[0]
      ? [validStops[0].lat, validStops[0].lng]
      : [-23.55, -46.63];

  return (
    <MapContainer
      center={center}
      zoom={16}
      zoomControl={false}
      attributionControl={false}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", background: "#10121E" }}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png" />

      {segments.map((seg) => {
        const tone = SEGMENT_TONES[seg.tone] || SEGMENT_TONES.future;
        return (
          <Fragment key={seg.id}>
            <Polyline
              positions={seg.coords}
              pathOptions={{
                color: tone.under,
                weight: tone.weight[0],
                opacity: 1,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            <Polyline
              positions={seg.coords}
              pathOptions={{
                color: tone.over,
                weight: tone.weight[1],
                opacity: tone.overOpacity,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </Fragment>
        );
      })}

      {validStops.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lng]}
          icon={stopIcon(s, s.id === nextStopId)}
          zIndexOffset={s.id === nextStopId ? 500 : 0}
          eventHandlers={onStopClick ? { click: () => onStopClick(s) } : undefined}
        />
      ))}

      {position && (
        <>
          {accuracy ? (
            <Circle
              center={[position.lat, position.lng]}
              radius={Math.min(accuracy, 120)}
              pathOptions={{
                color: "#FFD80F",
                weight: 1,
                opacity: 0.45,
                fillColor: "#FFD80F",
                fillOpacity: 0.08,
              }}
            />
          ) : null}
          <Marker
            position={[position.lat, position.lng]}
            icon={driverIcon(heading)}
            zIndexOffset={1200}
          />
        </>
      )}

      <Follow position={position} follow={follow} />
      <MapReady />
      <RecenterControl position={position} />
    </MapContainer>
  );
}

export default NavMap;