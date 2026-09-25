import { funcao } from "./cliente";

// Arquivos vão pela Edge Function app-motorista-arquivos (R2 + documents). O
// servidor confere o tipo real, calcula o SHA-256 e devolve o id do documento,
// que as RPCs usam como anexo/assinatura. URLs de leitura valem 5 min.

export async function enviarArquivo(blob, tipo) {
  const r = await funcao("app-motorista-arquivos/upload", blob, { cabecalhos: { "x-tipo": tipo } });
  return { documentoId: r.documentoId, sha256: r.sha256 };
}

const cacheUrls = new Map();
const VALIDADE_MS = 4 * 60 * 1000;

export async function urlArquivo(documentoId) {
  if (!documentoId) return null;
  const guardado = cacheUrls.get(documentoId);
  if (guardado && guardado.expira > Date.now()) return guardado.url;
  const { url } = await funcao("app-motorista-arquivos/download", { documentoId });
  cacheUrls.set(documentoId, { url, expira: Date.now() + VALIDADE_MS });
  return url;
}

/** Data URL (ex.: canvas da assinatura) → Blob, para enviar ou guardar offline. */
export function dataUrlParaBlob(dataUrl) {
  const [cabecalho, base64] = dataUrl.split(",");
  const mime = /data:([^;]+)/.exec(cabecalho)?.[1] || "application/octet-stream";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
