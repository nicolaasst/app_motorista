// Geometria usada pelo rastreio do motorista, roteirização e detecção de desvio.

const EARTH_R = 6371000;
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

export function haversine(a, b) {
  if (!a || !b) return 0;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function bearing(a, b) {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x =
    Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) -
    Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

// Diferença angular com sinal, entre -180 e 180.
export function angleDiff(a, b) {
  return ((a - b + 540) % 360) - 180;
}

// Média circular (suavização de heading).
export function averageHeading(list) {
  const vals = (list || []).filter((v) => typeof v === "number" && !Number.isNaN(v));
  if (!vals.length) return null;
  let x = 0;
  let y = 0;
  for (const v of vals) {
    x += Math.cos(rad(v));
    y += Math.sin(rad(v));
  }
  if (x === 0 && y === 0) return vals[vals.length - 1];
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

export function decodePolyline(str) {
  if (!str) return [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coords = [];
  while (index < str.length) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return coords;
}

export function encodePolyline(coords) {
  let lastLat = 0;
  let lastLng = 0;
  let out = "";
  const enc = (v) => {
    let value = v < 0 ? ~(v << 1) : v << 1;
    let chunk = "";
    while (value >= 0x20) {
      chunk += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
      value >>= 5;
    }
    return chunk + String.fromCharCode(value + 63);
  };
  for (const c of coords || []) {
    const lat = Math.round(c.lat * 1e5);
    const lng = Math.round(c.lng * 1e5);
    out += enc(lat - lastLat) + enc(lng - lastLng);
    lastLat = lat;
    lastLng = lng;
  }
  return out;
}

function project(p, pt, cosLat) {
  return {
    x: (pt.lng - p.lng) * 111320 * cosLat,
    y: (pt.lat - p.lat) * 110540,
  };
}

// Ponto mais próximo do traçado + distância em metros + índice do segmento.
export function distanceToPolyline(p, coords) {
  if (!p || !coords || coords.length < 2) {
    return { distance: Infinity, index: 0, point: null };
  }
  const cosLat = Math.cos(rad(p.lat));
  let best = { distance: Infinity, index: 0, point: null };
  for (let i = 0; i < coords.length - 1; i++) {
    const a = project(p, coords[i], cosLat);
    const b = project(p, coords[i + 1], cosLat);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    let t = len2 ? -(a.x * dx + a.y * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const cx = a.x + t * dx;
    const cy = a.y + t * dy;
    const d = Math.hypot(cx, cy);
    if (d < best.distance) {
      best = {
        distance: d,
        index: i,
        point: {
          lat: coords[i].lat + t * (coords[i + 1].lat - coords[i].lat),
          lng: coords[i].lng + t * (coords[i + 1].lng - coords[i].lng),
        },
      };
    }
  }
  return best;
}

// Direção do traçado "à frente" a partir de um segmento.
export function alongRouteBearing(coords, index, aheadMeters = 30) {
  if (!coords || coords.length < 2) return null;
  const start = Math.max(0, Math.min(index, coords.length - 2));
  let acc = 0;
  let j = start;
  while (j < coords.length - 1 && acc < aheadMeters) {
    acc += haversine(coords[j], coords[j + 1]);
    j++;
  }
  const end = coords[Math.min(j, coords.length - 1)];
  if (haversine(coords[start], end) < 1) return null;
  return bearing(coords[start], end);
}