// Posição atual do aparelho para prova (entrega, insucesso, emergência, assinatura).
// Nunca usa a coordenada da parada no lugar da do aparelho (bug B-02). Sem GPS
// em tempo hábil, devolve a última posição conhecida (se recente) ou null — o
// servidor grava sem geofence em vez de uma posição inventada.

let ultima = null; // { lat, lng, accuracy, em }

export function lembrarPosicao(lat, lng, accuracy) {
  if (typeof lat === "number" && typeof lng === "number") ultima = { lat, lng, accuracy: accuracy ?? null, em: Date.now() };
}

export function capturarPosicao({ timeoutMs = 8000, maxIdadeMs = 60000 } = {}) {
  const recente = () => (ultima && Date.now() - ultima.em <= maxIdadeMs ? { lat: ultima.lat, lng: ultima.lng, accuracy: ultima.accuracy } : null);
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(recente());
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => {
        lembrarPosicao(p.coords.latitude, p.coords.longitude, p.coords.accuracy);
        resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy });
      },
      () => resolve(recente()),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 15000 },
    );
  });
}
