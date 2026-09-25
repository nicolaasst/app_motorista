// Assinatura SigV4 e URL pré-assinada do Cloudflare R2.
// Origem: nicolaasst/ngs_transportes, supabase/functions/_shared/arquivos/r2.ts
// (mesmo bucket e mesmo padrão do TMS). Copiado sem alteração de lógica nas
// funções de assinatura; acrescentado `enviarObjeto` (PUT feito pelo servidor,
// para o hash do arquivo ser calculado sobre os bytes que foram gravados).
// Se o TMS mudar o assinador, replicar aqui.

/** Validade das URLs pré-assinadas (igual ao TMS). */
export const VALIDADE_URL_SEGUNDOS = 300;

export class ErroArquivo extends Error {
  constructor(readonly status: number, mensagem: string) {
    super(mensagem);
  }
}

export interface ConfigR2 {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

const VARIAVEIS_R2 = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_DOCUMENTOS"] as const;

/** Lê a config do ambiente; sem as quatro variáveis, erro claro (503), nunca URL inventada. */
export function configR2(env: (nome: string) => string | undefined): ConfigR2 {
  const faltando = VARIAVEIS_R2.filter((n) => !env(n));
  if (faltando.length) {
    throw new ErroArquivo(503, `Armazenamento de arquivos (R2) não configurado: defina ${faltando.join(", ")}`);
  }
  return {
    accountId: env("R2_ACCOUNT_ID")!,
    accessKeyId: env("R2_ACCESS_KEY_ID")!,
    secretAccessKey: env("R2_SECRET_ACCESS_KEY")!,
    bucket: env("R2_BUCKET_DOCUMENTOS")!,
  };
}


const enc = new TextEncoder();

async function hmac(chave: BufferSource, dado: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey("raw", chave, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", k, enc.encode(dado));
}

async function sha256Hex(dado: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", enc.encode(dado)));
}

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** RFC 3986 (o que o SigV4 exige), mais estrito que encodeURIComponent. */
function rfc3986(v: string): string {
  return encodeURIComponent(v).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

export interface OpcoesSigV4 {
  metodo: "PUT" | "GET";
  host: string;
  /** Caminho já codificado (RFC 3986), começando por "/". */
  caminho: string;
  regiao: string;
  expiraEmSegundos: number;
  accessKeyId: string;
  secretAccessKey: string;
  agora: Date;
}

/** Query string pré-assinada SigV4 (só o header host assinado, payload não assinado). */
export async function presignSigV4(o: OpcoesSigV4): Promise<string> {
  const amzDate = o.agora.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const dia = amzDate.slice(0, 8);
  const escopo = `${dia}/${o.regiao}/s3/aws4_request`;
  const params: [string, string][] = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", `${o.accessKeyId}/${escopo}`],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", String(o.expiraEmSegundos)],
    ["X-Amz-SignedHeaders", "host"],
  ];
  const query = params
    .map(([k, v]) => [rfc3986(k), rfc3986(v)] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const canonica = [o.metodo, o.caminho, query, `host:${o.host}`, "", "host", "UNSIGNED-PAYLOAD"].join("\n");
  const aAssinar = ["AWS4-HMAC-SHA256", amzDate, escopo, await sha256Hex(canonica)].join("\n");
  let k: ArrayBuffer = await hmac(enc.encode(`AWS4${o.secretAccessKey}`) as Uint8Array<ArrayBuffer>, dia);
  k = await hmac(k, o.regiao);
  k = await hmac(k, "s3");
  k = await hmac(k, "aws4_request");
  return `${query}&X-Amz-Signature=${hex(await hmac(k, aAssinar))}`;
}

/**
 * URL pré-assinada para o endpoint S3 do R2 (região "auto"). O Content-Type
 * não entra na assinatura: o navegador envia o do arquivo, e o tipo já foi
 * validado na lista de permitidos.
 */
export async function urlAssinada(
  config: ConfigR2,
  metodo: "PUT" | "GET",
  chave: string,
  agora: Date = new Date(),
): Promise<string> {
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const caminho = `/${rfc3986(config.bucket)}/${chave.split("/").map(rfc3986).join("/")}`;
  const query = await presignSigV4({
    metodo, host, caminho, regiao: "auto", expiraEmSegundos: VALIDADE_URL_SEGUNDOS,
    accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey, agora,
  });
  return `https://${host}${caminho}?${query}`;
}

/** PUT do objeto direto do servidor (o aparelho nunca recebe URL de escrita). */
export async function enviarObjeto(config: ConfigR2, chave: string, corpo: Uint8Array<ArrayBuffer>, mimeType: string): Promise<void> {
  const url = await urlAssinada(config, "PUT", chave);
  const resposta = await fetch(url, { method: "PUT", body: corpo, headers: { "Content-Type": mimeType } });
  if (!resposta.ok) {
    throw new ErroArquivo(502, `falha ao gravar no armazenamento (${resposta.status})`);
  }
}
