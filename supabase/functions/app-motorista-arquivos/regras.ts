// Regras puras da função app-motorista-arquivos (sem I/O; testadas em regras_test.ts).

import { ErroArquivo } from "../_shared/arquivos/r2.ts";

export type TipoArquivo =
  | "assinatura_entrega"
  | "assinatura_recibo"
  | "foto_entrega"
  | "foto_insucesso"
  | "foto_odometro"
  | "foto_alerta"
  | "avatar"
  | "documento_pessoal"
  | "anexo_chamado";

const IMAGEM = ["image/jpeg", "image/png", "image/webp"];
const MB = 1024 * 1024;

/** Tipos aceitos e limite de tamanho por finalidade (o tipo real vem dos bytes). */
export const REGRAS_TIPO: Record<TipoArquivo, { mimes: string[]; maxBytes: number }> = {
  assinatura_entrega: { mimes: ["image/png"], maxBytes: 512 * 1024 },
  assinatura_recibo: { mimes: ["image/png"], maxBytes: 512 * 1024 },
  foto_entrega: { mimes: IMAGEM, maxBytes: 10 * MB },
  foto_insucesso: { mimes: IMAGEM, maxBytes: 10 * MB },
  foto_odometro: { mimes: IMAGEM, maxBytes: 10 * MB },
  foto_alerta: { mimes: IMAGEM, maxBytes: 10 * MB },
  avatar: { mimes: IMAGEM, maxBytes: 5 * MB },
  documento_pessoal: { mimes: [...IMAGEM, "application/pdf"], maxBytes: 10 * MB },
  anexo_chamado: { mimes: [...IMAGEM, "application/pdf"], maxBytes: 10 * MB },
};

export const EXTENSAO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export function tipoValido(tipo: string | null): TipoArquivo {
  if (!tipo || !(tipo in REGRAS_TIPO)) throw new ErroArquivo(400, "tipo de arquivo (x-tipo) inválido");
  return tipo as TipoArquivo;
}

/** Tipo real pelo cabeçalho do arquivo — nunca pelo Content-Type declarado. */
export function detectarMime(b: Uint8Array): string | null {
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "image/png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  if (b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) return "application/pdf";
  return null;
}

/** Valida o conteúdo para a finalidade e devolve o mime real. */
export function validarConteudo(tipo: TipoArquivo, bytes: Uint8Array): string {
  const regra = REGRAS_TIPO[tipo];
  if (bytes.length === 0) throw new ErroArquivo(400, "arquivo vazio");
  if (bytes.length > regra.maxBytes) {
    throw new ErroArquivo(413, `arquivo acima de ${Math.round(regra.maxBytes / 1024)} KB para ${tipo}`);
  }
  const mime = detectarMime(bytes);
  if (!mime || !regra.mimes.includes(mime)) throw new ErroArquivo(415, "formato de arquivo não permitido");
  return mime;
}

export interface Motorista {
  tenantId: string;
  motoristaId: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Só o portal app-motorista usa esta função (claims do hook do projeto). */
export function motoristaDasClaims(claims: Record<string, unknown> | null | undefined): Motorista {
  const portal = claims?.portal;
  const tenantId = claims?.app_motorista_tenant_id;
  const motoristaId = claims?.sub;
  if (portal !== "app-motorista" || typeof tenantId !== "string" || !UUID.test(tenantId) ||
      typeof motoristaId !== "string" || !UUID.test(motoristaId)) {
    throw new ErroArquivo(403, "acesso restrito ao App Motorista");
  }
  return { tenantId, motoristaId };
}

/**
 * Chave do objeto: começa pelo tenant (CHECK documents_r2_key_do_tenant do TMS),
 * separa o app e o motorista. Sem nada vindo do cliente além do tipo validado.
 */
export function chaveObjeto(m: Motorista, tipo: TipoArquivo, id: string, mime: string, agora: Date): string {
  const ano = agora.getUTCFullYear();
  const mes = String(agora.getUTCMonth() + 1).padStart(2, "0");
  return `${m.tenantId}/app-motorista/${m.motoristaId}/${tipo}/${ano}/${mes}/${id}.${EXTENSAO[mime]}`;
}

export async function sha256Hex(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export function uuidValido(v: unknown): v is string {
  return typeof v === "string" && UUID.test(v);
}
