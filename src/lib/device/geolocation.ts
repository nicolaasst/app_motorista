import type { GeoPoint } from '../domain/geofence.js';

export interface CapturedPosition {
  point: GeoPoint;
  accuracyMeters: number;
  capturedAt: string;
}

export type GeolocationErrorReason =
  'unsupported' | 'permission-denied' | 'unavailable' | 'timeout';

export class GeolocationCaptureError extends Error {
  reason: GeolocationErrorReason;
  constructor(reason: GeolocationErrorReason, message: string) {
    super(message);
    this.name = 'GeolocationCaptureError';
    this.reason = reason;
  }
}

function mapGeolocationError(error: GeolocationPositionError): GeolocationCaptureError {
  if (error.code === error.PERMISSION_DENIED) {
    return new GeolocationCaptureError('permission-denied', 'Permissão de localização negada.');
  }
  if (error.code === error.TIMEOUT) {
    return new GeolocationCaptureError('timeout', 'Tempo esgotado ao obter a localização.');
  }
  return new GeolocationCaptureError('unavailable', 'Localização indisponível no momento.');
}

// Captura real via navigator.geolocation — sem fallback simulado. Se a API
// não existir ou a permissão for negada, quem chamar decide como lidar
// (nunca inventamos uma coordenada).
export function captureCurrentPosition(
  options: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
): Promise<CapturedPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(
        new GeolocationCaptureError('unsupported', 'Geolocalização não suportada neste navegador.'),
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          point: { lat: position.coords.latitude, lng: position.coords.longitude },
          accuracyMeters: position.coords.accuracy,
          capturedAt: new Date(position.timestamp).toISOString(),
        });
      },
      (error) => reject(mapGeolocationError(error)),
      options,
    );
  });
}
