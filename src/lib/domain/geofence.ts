export interface GeoPoint {
  lat: number;
  lng: number;
}

// Tolerância padrão conservadora (150m) — pendência de produto real, não
// uma constante técnica definitiva. Ver docs/OPEN_QUESTIONS.md item 2.
export const DEFAULT_GEOFENCE_TOLERANCE_METERS = 150;

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// Distância em linha reta entre dois pontos (fórmula de Haversine).
export function distanceInMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_METERS * c;
}

export interface GeofenceResult {
  withinRange: boolean;
  distanceMeters: number;
  toleranceMeters: number;
}

export function evaluateGeofence(
  current: GeoPoint,
  expected: GeoPoint,
  toleranceMeters: number = DEFAULT_GEOFENCE_TOLERANCE_METERS,
): GeofenceResult {
  const distanceMeters = distanceInMeters(current, expected);
  return { withinRange: distanceMeters <= toleranceMeters, distanceMeters, toleranceMeters };
}
