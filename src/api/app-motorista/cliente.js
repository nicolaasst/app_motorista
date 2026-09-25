import { SUPABASE_CHAVE_PUBLICA, SUPABASE_URL, supabase } from "@/api/supabaseClient";

// Erro único da camada de dados. `transitorio` diz à fila offline se vale
// tentar de novo (rede, 5xx, 429) ou se o servidor recusou por regra de negócio
// (não adianta reenviar: vira "rejeitado" e aparece para o motorista).
export class ErroApp extends Error {
  constructor(mensagem, { status = 0, codigo = null, transitorio = false } = {}) {
    super(mensagem);
    this.name = "ErroApp";
    this.status = status;
    this.codigo = codigo;
    this.transitorio = transitorio;
  }
}

const SEM_CONEXAO = "Sem conexão com o servidor. Tente novamente.";

function exigirCliente() {
  if (!supabase) throw new ErroApp("Aplicativo sem configuração do servidor.", { status: 0 });
  return supabase;
}

/** Converte o erro do PostgREST/supabase-js no ErroApp. */
export function erroDoSupabase(error, status = 0) {
  if (!error) return null;
  const codigo = error.code || null;
  // Sem código do Postgres e sem status HTTP: falha de rede/fetch.
  if (!codigo && !status) return new ErroApp(SEM_CONEXAO, { transitorio: true });
  const s = status || 400;
  // 401/403/42501: sessão expirada ou cadastro momentaneamente sem acesso — o
  // registro fica na fila (não se perde) e sobe quando o acesso voltar.
  const transitorio = s >= 500 || s === 401 || s === 403 || s === 408 || s === 429 ||
    ["PGRST301", "PGRST303", "57014", "42501"].includes(codigo);
  return new ErroApp(error.message || "Não foi possível concluir.", { status: s, codigo, transitorio });
}

/** Chama uma RPC `app_motorista_*` e devolve `data` ou lança ErroApp. */
export async function rpc(nome, args = {}) {
  let resposta;
  try {
    resposta = await exigirCliente().rpc(nome, args);
  } catch {
    throw new ErroApp(SEM_CONEXAO, { transitorio: true });
  }
  if (resposta.error) throw erroDoSupabase(resposta.error, resposta.status);
  return resposta.data;
}

/** Consulta de tabela: recebe o builder já montado e devolve linhas ou lança ErroApp. */
export async function consulta(builder) {
  let resposta;
  try {
    resposta = await builder;
  } catch {
    throw new ErroApp(SEM_CONEXAO, { transitorio: true });
  }
  if (resposta.error) throw erroDoSupabase(resposta.error, resposta.status);
  return resposta.data;
}

export function tabela(nome) {
  return exigirCliente().from(nome);
}

/**
 * Edge Function do app. `corpo` pode ser objeto (JSON) ou Blob (bytes crus).
 * `autenticado`: manda o JWT da sessão (arquivos); o login vai só com a chave pública.
 */
export async function funcao(caminho, corpo, { autenticado = true, cabecalhos = {} } = {}) {
  const headers = { apikey: SUPABASE_CHAVE_PUBLICA, ...cabecalhos };
  let token = SUPABASE_CHAVE_PUBLICA;
  if (autenticado) {
    const { data } = await exigirCliente().auth.getSession();
    token = data.session?.access_token;
    if (!token) throw new ErroApp("Sessão expirada. Entre novamente.", { status: 401, transitorio: true });
  }
  headers.Authorization = `Bearer ${token}`;
  const ehBytes = typeof Blob !== "undefined" && corpo instanceof Blob;
  if (!ehBytes) headers["Content-Type"] = "application/json";
  let resposta;
  try {
    resposta = await fetch(`${SUPABASE_URL}/functions/v1/${caminho}`, {
      method: "POST",
      headers,
      body: ehBytes ? corpo : JSON.stringify(corpo ?? {}),
    });
  } catch {
    throw new ErroApp(SEM_CONEXAO, { transitorio: true });
  }
  const json = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const s = resposta.status;
    throw new ErroApp(json.erro || "Não foi possível concluir.", {
      status: s,
      transitorio: s >= 500 || s === 401 || s === 403 || s === 408 || s === 429,
    });
  }
  return json;
}
