// Frequência adaptativa do rastreio em segundo plano: parado economiza bateria,
// em movimento sobe a precisão. A troca só vale depois de a condição se manter
// (histerese) para não reiniciar o serviço nativo a cada semáforo.

export const PERFIL_MOVIMENTO = Object.freeze({ nome: "movimento", distanceFilter: 25, minIntervalMs: 10_000 });
export const PERFIL_PARADO = Object.freeze({ nome: "parado", distanceFilter: 0, minIntervalMs: 120_000 });

export const HISTERESE_PARADO_MS = 90_000; // parado por 90 s seguidos → perfil parado
export const HISTERESE_MOVIMENTO_MS = 15_000; // em movimento por 15 s → perfil movimento

/**
 * Decide o perfil. `estado` = { perfil, desde } (desde = quando a condição atual começou, ms).
 * Devolve { perfil, desde, trocou }.
 */
export function proximoPerfil(estado, { parado, agora }) {
  const atual = estado?.perfil ?? PERFIL_MOVIMENTO;
  const alvo = parado ? PERFIL_PARADO : PERFIL_MOVIMENTO;
  if (alvo.nome === atual.nome) return { perfil: atual, desde: null, trocou: false };
  const desde = estado?.desde ?? agora;
  const espera = parado ? HISTERESE_PARADO_MS : HISTERESE_MOVIMENTO_MS;
  if (agora - desde >= espera) return { perfil: alvo, desde: null, trocou: true };
  return { perfil: atual, desde, trocou: false };
}
