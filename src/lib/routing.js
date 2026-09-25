import { decodePolyline } from "@/lib/geo";
import { baseRotas } from "@/lib/mapProvider";

// Roteirização por vias reais. Produção: Mapbox Directions (resposta no mesmo
// formato do OSRM: routes[].geometry em polyline5, distance, duration).
// Desenvolvimento sem token: servidor de demonstração do OSRM (ver mapProvider).

function normalize(route) {
  const coords = decodePolyline(route.geometry);
  return {
    coords,
    polyline: route.geometry,
    distance: route.distance,
    duration: route.duration,
  };
}

async function request(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`routing ${res.status}`);
  const json = await res.json();
  if (json.code !== "Ok" || !json.routes?.length) throw new Error("rota indisponível");
  return normalize(json.routes[0]);
}

// Traça o caminho entre dois pontos seguindo as vias. `bearing` (direção atual
// do veículo) faz a rota nascer no sentido real em que ele está indo.
// Tenta uma segunda vez antes de desistir.
export async function fetchRoute(from, to, { bearing } = {}) {
  if (!from || !to?.lat || !to?.lng) throw new Error("pontos inválidos");
  const path = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const bearings =
    typeof bearing === "number" && !Number.isNaN(bearing)
      ? `&bearings=${Math.round(bearing)},90;`
      : "";
  const base = baseRotas();
  if (!base) throw new Error("roteamento não configurado (VITE_MAPBOX_PUBLIC_TOKEN)");
  const url = `${base.url}${path}?overview=full&geometries=polyline&alternatives=false&steps=false${bearings}${base.sufixo}`;
  try {
    return await request(url);
  } catch {
    return request(url);
  }
}