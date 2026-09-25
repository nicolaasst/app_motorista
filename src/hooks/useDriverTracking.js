import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { averageHeading, bearing, haversine } from "@/lib/geo";
import { enqueueGpsPoints } from "@/lib/offlineQueue";

const ACCURACY_LIMIT_M = 60; // leituras piores que isso não movem o marcador
const ACCURACY_GRACE_MS = 15000; // sem leitura precisa por 15s, aceita a imprecisa
const STOP_DISTANCE_M = 4;
const STOP_SPEED_KMH = 3;
const HEADING_SPEED_KMH = 5; // acima disso usa o heading do GPS
const HEADING_MIN_DISTANCE_M = 10; // abaixo disso calcula pela diferença de posições
const HEADING_SAMPLES = 5;

const SEND_INTERVAL_MS = 12000;
const SEND_DISTANCE_M = 50;
const SEND_FORCED_MS = 36000; // mesmo parado, força atualização

export function useDriverTracking({ route, enabled = true }) {
  const [state, setState] = useState({
    position: null,
    heading: null,
    speedKmh: 0,
    accuracy: null,
    stopped: false,
    gpsOk: false,
  });
  const [track, setTrack] = useState(() =>
    Array.isArray(route?.gps_track) ? [...route.gps_track] : [],
  );

  const routeRef = useRef(route);
  routeRef.current = route;

  const refs = useRef(null);
  if (!refs.current) {
    refs.current = {
      lastGood: null,
      lastRaw: null,
      lastAccurateAt: 0,
      heading: null,
      headingSamples: [],
      headingPos: null,
      displayPos: null,
      lastSpeedKmh: 0,
      track: Array.isArray(route?.gps_track) ? [...route.gps_track] : [],
      lastSentAt: 0,
      lastSentPos: null,
    };
  }

  // Trilha já gravada na rota (quando ela chega depois do mount).
  useEffect(() => {
    const r = refs.current;
    if (route?.gps_track?.length && r.track.length === 0) {
      r.track = [...route.gps_track];
      setTrack([...r.track]);
    }
  }, [route?.id]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const R = refs.current;

    const persistPoint = (point) => {
      R.track.push(point);
      setTrack([...R.track]);
      const routeId = routeRef.current?.id;
      if (!routeId) return;
      if (typeof navigator !== "undefined" && navigator.onLine) {
        base44.entities.Route.update(routeId, { gps_track: R.track }).catch(() => {});
      } else {
        enqueueGpsPoints(routeId, [point]);
      }
    };

    const maybeSend = (lat, lng, speedKmh, now) => {
      const point = { lat, lng, t: new Date().toISOString(), speed: speedKmh };
      if (!R.lastSentAt) {
        R.lastSentAt = now;
        R.lastSentPos = { lat, lng };
        persistPoint(point); // primeira leitura sobe imediatamente
        return;
      }
      const dist = R.lastSentPos ? haversine(R.lastSentPos, { lat, lng }) : 0;
      const elapsed = now - R.lastSentAt;
      if (elapsed >= SEND_INTERVAL_MS || dist >= SEND_DISTANCE_M || elapsed >= SEND_FORCED_MS) {
        R.lastSentAt = now;
        R.lastSentPos = { lat, lng };
        persistPoint(point);
      }
    };

    const onPos = (pos) => {
      const c = pos.coords;
      const now = Date.now();
      const raw = { lat: c.latitude, lng: c.longitude, accuracy: c.accuracy, t: now };
      const reportedSpeed =
        typeof c.speed === "number" && !Number.isNaN(c.speed) ? c.speed * 3.6 : null;

      const accurate = c.accuracy == null || c.accuracy <= ACCURACY_LIMIT_M;
      if (accurate) R.lastAccurateAt = now;

      const lastGood = R.lastGood;
      const dt = R.lastRaw ? (now - R.lastRaw.t) / 1000 : 0;
      const computedSpeed =
        R.lastRaw && dt > 0 ? (haversine(R.lastRaw, raw) / dt) * 3.6 : null;
      const speedKmh =
        reportedSpeed != null
          ? reportedSpeed
          : computedSpeed != null
            ? computedSpeed
            : R.lastSpeedKmh || 0;
      R.lastSpeedKmh = speedKmh;

      // A leitura imprecisa só é aceita se passou tempo demais sem nenhuma boa.
      const accepted = accurate || now - (R.lastAccurateAt || 0) > ACCURACY_GRACE_MS;
      if (accepted) R.lastGood = raw;

      const displacement = lastGood ? haversine(lastGood, raw) : 0;
      const stopped = displacement < STOP_DISTANCE_M && speedKmh < STOP_SPEED_KMH;
      R.stopped = stopped;

      // Heading: GPS quando há velocidade; senão pela diferença de posições.
      let heading = R.heading;
      if (speedKmh > HEADING_SPEED_KMH && c.heading != null && !Number.isNaN(c.heading)) {
        heading = c.heading;
        R.headingPos = raw;
      } else if (R.headingPos && haversine(R.headingPos, raw) >= HEADING_MIN_DISTANCE_M) {
        heading = bearing(R.headingPos, raw);
        R.headingPos = raw;
      }
      if (heading != null) {
        R.headingSamples.push(heading);
        if (R.headingSamples.length > HEADING_SAMPLES) R.headingSamples.shift();
        heading = averageHeading(R.headingSamples);
        R.heading = heading;
      }

      // Marcador: só move com leitura aceita e veículo em movimento.
      if (accepted && (!stopped || !R.displayPos)) {
        R.displayPos = { lat: raw.lat, lng: raw.lng };
      }

      const sendPos = R.lastGood || raw;
      maybeSend(
        sendPos.lat,
        sendPos.lng,
        speedKmh < STOP_SPEED_KMH ? 0 : speedKmh,
        now,
      );

      setState({
        position: R.displayPos,
        heading: R.heading ?? null,
        speedKmh: speedKmh < STOP_SPEED_KMH ? 0 : Math.round(speedKmh),
        accuracy: c.accuracy ?? null,
        stopped,
        gpsOk: accepted,
      });
    };

    const onErr = () => setState((s) => ({ ...s, gpsOk: false }));

    const watchId = navigator.geolocation.watchPosition(onPos, onErr, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 20000,
    });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return { ...state, track };
}