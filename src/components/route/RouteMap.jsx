import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const STOP_COLOR = {
  entregue: "#15803D",
  falha: "#DC2626",
  em_rota: "#EA580C",
  em_atendimento: "#EA580C",
  nao_iniciada: "#71717A",
  reagendada: "#71717A",
};

function decodePolyline(str) {
  let index = 0, lat = 0, lng = 0;
  const coords = [];
  while (index < str.length) {
    let b, shift = 0, result = 0;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    coords.push([lat / 1e5, lng / 1e5]);
  }
  return coords;
}

function makePin(color) {
  return L.divIcon({
    className: "route-pin-marker",
    html: `<span style="display:block;width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) {
      map.setView(points[0], 15);
    } else if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [map, points]);
  return null;
}

export function RouteMap({ route, stops, onStopClick, dark = false }) {
  const trackPoints = useMemo(() => {
    if (route.gps_track?.length) {
      const t = route.gps_track.filter((p) => p.lat && p.lng).map((p) => [p.lat, p.lng]);
      if (t.length >= 2) return t;
    }
    if (route.polyline) {
      try {
        const t = decodePolyline(route.polyline);
        if (t.length >= 2) return t;
      } catch {
        /* invalid encoding */
      }
    }
    const stopPts = stops
      .filter((s) => s.lat && s.lng)
      .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
      .map((s) => [s.lat, s.lng]);
    if (route.origin?.lat && route.origin?.lng) {
      stopPts.unshift([route.origin.lat, route.origin.lng]);
    }
    return stopPts;
  }, [route, stops]);

  const validStops = stops.filter((s) => s.lat && s.lng);
  const allPoints = [...trackPoints, ...validStops.map((s) => [s.lat, s.lng])];

  const fallbackCenter = [-23.55, -46.63];
  const center =
    trackPoints[0] ||
    (validStops[0] ? [validStops[0].lat, validStops[0].lng] : route.origin?.lat ? [route.origin.lat, route.origin.lng] : fallbackCenter);

  return (
    <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
      <TileLayer
        url={
          dark
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        }
        attribution='&copy; OpenStreetMap &copy; CARTO'
      />
      {trackPoints.length >= 2 && (
        <Polyline
          positions={trackPoints}
          pathOptions={{ color: "#FFD80F", weight: 5, opacity: 0.95, lineCap: "round" }}
        />
      )}
      {validStops.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lng]}
          icon={makePin(STOP_COLOR[s.status] || "#71717A")}
          eventHandlers={onStopClick ? { click: () => onStopClick(s) } : undefined}
        />
      ))}
      <FitBounds points={allPoints} />
    </MapContainer>
  );
}

export default RouteMap;