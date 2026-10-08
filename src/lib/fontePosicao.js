import { BackgroundGeolocation } from "@capgo/background-geolocation";
import { ehNativo } from "@/lib/nativo";
import { PERFIL_MOVIMENTO, proximoPerfil } from "@/lib/perfilRastreio";

// Fonte única de posição do rastreio da rota.
//  * Web/PWA: navigator.geolocation.watchPosition (só com o app aberto).
//  * Nativo: serviço em primeiro plano no Android (notificação persistente) e
//    modo de localização em segundo plano no iOS, que seguem com a tela
//    bloqueada. A frequência se adapta (parado × em movimento).
// As duas entregam o mesmo formato de leitura ({ coords }), então o filtro de
// precisão/velocidade/rumo do useDriverTracking não muda.

const OPCOES_WEB = { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 };

const TEXTO_NOTIFICACAO = {
  backgroundTitle: "NGS Driver: rota em andamento",
  backgroundMessage: "Sua posição é compartilhada com a central enquanto a rota estiver ativa.",
};

function leituraDoNativo(l) {
  return {
    coords: {
      latitude: l.latitude,
      longitude: l.longitude,
      accuracy: l.accuracy ?? null,
      speed: typeof l.speed === "number" && l.speed >= 0 ? l.speed : null, // m/s, como a API web
      heading: typeof l.bearing === "number" ? l.bearing : null,
    },
    timestamp: l.time ?? Date.now(),
  };
}

function assistirNativo(onPos, onErr) {
  let ativo = true;
  let estado = { perfil: PERFIL_MOVIMENTO, desde: null };
  let fila = Promise.resolve();

  const iniciar = (perfil) =>
    BackgroundGeolocation.start(
      {
        ...TEXTO_NOTIFICACAO,
        requestPermissions: true,
        stale: false,
        distanceFilter: perfil.distanceFilter,
        minIntervalMs: perfil.minIntervalMs,
        networkFallback: true,
      },
      (leitura, erro) => {
        if (!ativo) return;
        if (erro) onErr?.(erro);
        else if (leitura) onPos(leituraDoNativo(leitura));
      },
    );

  // start/stop em série: nunca dois starts concorrentes no plugin.
  const encadear = (fn) => {
    fila = fila.then(fn).catch((e) => ativo && onErr?.(e));
    return fila;
  };
  encadear(() => iniciar(estado.perfil));

  return {
    /** Informa se o veículo está parado; reinicia o serviço com o perfil novo quando a troca se confirma. */
    ajustar(parado) {
      const prox = proximoPerfil(estado, { parado, agora: Date.now() });
      estado = { perfil: prox.perfil, desde: prox.desde };
      if (prox.trocou) {
        encadear(async () => {
          await BackgroundGeolocation.stop();
          if (ativo) await iniciar(prox.perfil);
        });
      }
    },
    parar() {
      ativo = false;
      encadear(() => BackgroundGeolocation.stop());
    },
  };
}

function assistirWeb(onPos, onErr) {
  const id = navigator.geolocation.watchPosition(onPos, onErr, OPCOES_WEB);
  return { ajustar() {}, parar: () => navigator.geolocation.clearWatch(id) };
}

/** Começa a acompanhar a posição. Devolve { ajustar(parado), parar() } ou null se não há como (sem GPS). */
export function assistirPosicao(onPos, onErr) {
  if (ehNativo()) return assistirNativo(onPos, onErr);
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return assistirWeb(onPos, onErr);
}
