// Regras puras da função app-motorista-login (sem I/O; testadas em regras_test.ts).

export class ErroLogin extends Error {
  constructor(readonly status: number, mensagem: string) {
    super(mensagem);
  }
}

/** Mensagens únicas: nunca revelam se o CPF/matrícula existe. */
export const MSG = {
  credenciais: "CPF/matrícula ou senha inválidos. Verifique os dados ou contate a central.",
  bloqueado: "Muitas tentativas. Aguarde 15 minutos e tente novamente.",
  codigoEnviado: "Se houver cadastro ativo para esse CPF/matrícula, enviamos um código para o e-mail cadastrado.",
  codigoInvalido: "Código inválido ou expirado. Solicite um novo código.",
} as const;

export interface PedidoEntrar { identificador: string; senha: string }
export interface PedidoRecuperar { identificador: string }
export interface PedidoVerificar { identificador: string; codigo: string }

function identificador(v: unknown): string {
  if (typeof v !== "string") throw new ErroLogin(400, "Informe seu CPF ou matrícula.");
  const s = v.trim();
  if (s.length < 3 || s.length > 120) throw new ErroLogin(400, "Informe seu CPF ou matrícula.");
  return s;
}

export function pedidoEntrar(corpo: unknown): PedidoEntrar {
  const c = (corpo ?? {}) as Record<string, unknown>;
  const senha = c.senha;
  if (typeof senha !== "string" || senha.length < 1 || senha.length > 200) throw new ErroLogin(400, "Informe a senha.");
  return { identificador: identificador(c.identificador), senha };
}

export function pedidoRecuperar(corpo: unknown): PedidoRecuperar {
  return { identificador: identificador((corpo as Record<string, unknown> | null)?.identificador) };
}

export function pedidoVerificar(corpo: unknown): PedidoVerificar {
  const c = (corpo ?? {}) as Record<string, unknown>;
  const codigo = typeof c.codigo === "string" ? c.codigo.replace(/\s/g, "") : "";
  if (!/^[0-9]{6,10}$/.test(codigo)) throw new ErroLogin(400, MSG.codigoInvalido);
  return { identificador: identificador(c.identificador), codigo };
}

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const IPV6 = /^[0-9a-f:]{2,39}$/i;

/** Primeiro IP de x-forwarded-for (o gateway do Supabase o preenche); inválido → null. */
export function ipDoPedido(cabecalho: string | null): string | null {
  const ip = (cabecalho ?? "").split(",")[0].trim();
  return IPV4.test(ip) || (ip.includes(":") && IPV6.test(ip)) ? ip : null;
}

/** Contextos de limite de tentativas (um não bloqueia o outro). */
export type Contexto = "login" | "envio_codigo" | "verificacao_codigo";

/** Só o que o app precisa para `supabase.auth.setSession`. */
export function sessaoPublica(s: { access_token: string; refresh_token: string; expires_in: number; expires_at?: number; token_type: string }) {
  return {
    access_token: s.access_token,
    refresh_token: s.refresh_token,
    expires_in: s.expires_in,
    expires_at: s.expires_at,
    token_type: s.token_type,
  };
}
