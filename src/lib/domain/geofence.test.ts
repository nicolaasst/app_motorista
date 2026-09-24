import { describe, expect, it } from 'vitest';
import {
  distanceInMeters,
  evaluateGeofence,
  DEFAULT_GEOFENCE_TOLERANCE_METERS,
} from './geofence.js';

describe('distanceInMeters', () => {
  it('returns 0 for identical points', () => {
    const point = { lat: -23.5613, lng: -46.6565 };
    expect(distanceInMeters(point, point)).toBeCloseTo(0, 3);
  });

  it('computes a plausible distance for two nearby São Paulo addresses', () => {
    // Av. Paulista 1230 vs. Rua Augusta 890 — ruas próximas, poucas
    // centenas de metros de distância real.
    const paulista = { lat: -23.5613, lng: -46.6565 };
    const augusta = { lat: -23.5539, lng: -46.6579 };
    const distance = distanceInMeters(paulista, augusta);
    expect(distance).toBeGreaterThan(500);
    expect(distance).toBeLessThan(1500);
  });
});

describe('evaluateGeofence', () => {
  it('is within range when the distance is under the default tolerance', () => {
    const expected = { lat: -23.5613, lng: -46.6565 };
    const current = { lat: -23.5614, lng: -46.6566 }; // a poucos metros
    const result = evaluateGeofence(current, expected);
    expect(result.withinRange).toBe(true);
    expect(result.toleranceMeters).toBe(DEFAULT_GEOFENCE_TOLERANCE_METERS);
  });

  it('is out of range when far beyond the tolerance', () => {
    const expected = { lat: -23.5613, lng: -46.6565 };
    const current = { lat: -23.6, lng: -46.7 }; // vários km de distância
    const result = evaluateGeofence(current, expected);
    expect(result.withinRange).toBe(false);
    expect(result.distanceMeters).toBeGreaterThan(DEFAULT_GEOFENCE_TOLERANCE_METERS);
  });

  it('honors a custom tolerance', () => {
    const expected = { lat: -23.5613, lng: -46.6565 };
    const current = { lat: -23.5613, lng: -46.657 };
    const strict = evaluateGeofence(current, expected, 10);
    const lenient = evaluateGeofence(current, expected, 1000);
    expect(strict.withinRange).toBe(false);
    expect(lenient.withinRange).toBe(true);
  });
});
