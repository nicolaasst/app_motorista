// app-motorista-login — entrada por CPF/matrícula e recuperação de senha (sem JWT).
//
// Corrige B-01 (o app baixava o cadastro de todos os motoristas, sem login, para
// achar o e-mail pelo CPF) e B-04 (recuperação de senha simulada). O e-mail de
// login é resolvido aqui e nunca volta para o aparelho.
//
// POST /entrar             { identificador, senha }  → 200 { session } | 401 | 429
// POST /recuperar          { identificador }         → 200 { mensagem } (sempre a mesma)
// POST /recuperar/verificar { identificador, codigo } → 200 { session } (sessão de recuperação;
//                                                       o app chama auth.updateUser({ password }))
//
// Limite: 5 falhas por identificador e 20 por IP a cada 15 min (tabela
// app_motorista_tentativas_login, só o SHA-256 do identificador).
// Recuperação usa o template "Reset password" do Auth com {{ .Token }} (código
// de 6 dígitos) — ver docs/OPERACAO_APP_MOTORISTA.md.

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  type Contexto, ErroLogin, ipDoPedido, MSG, pedidoEntrar, pedidoRecuperar, pedidoVerificar, sessaoPublica,
} from "./regras.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, corpo: unknown) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json(405, { erro: "use POST" });

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const publico = () => createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });
  const ip = ipDoPedido(req.headers.get("x-forwarded-for"));

  /** E-mail do motorista ativo (ou null); 429 se o contexto estiver bloqueado. */
  const resolver = async (identificador: string, contexto: Contexto): Promise<string | null> => {
    const { data, error } = await admin.rpc("app_motorista_login_resolver",
      { p_identificador: identificador, p_ip: ip, p_contexto: contexto });
    if (error) throw error;
    const linha = Array.isArray(data) ? data[0] : data;
    if (linha?.bloqueado) throw new ErroLogin(429, MSG.bloqueado);
    return linha?.email ?? null;
  };
  const registrar = async (identificador: string, contexto: Contexto, sucesso: boolean) => {
    const { error } = await admin.rpc("app_motorista_login_registrar",
      { p_identificador: identificador, p_ip: ip, p_sucesso: sucesso, p_contexto: contexto });
    if (error) console.error("app-motorista-login registrar", error.message);
  };

  try {
    const caminho = new URL(req.url).pathname.replace(/\/+$/, "");
    const corpo = await req.json().catch(() => null);

    if (caminho.endsWith("/entrar")) {
      const p = pedidoEntrar(corpo);
      const email = await resolver(p.identificador, "login");
      const sessao = email
        ? (await publico().auth.signInWithPassword({ email, password: p.senha })).data.session
        : null;
      await registrar(p.identificador, "login", !!sessao);
      if (!sessao) throw new ErroLogin(401, MSG.credenciais);
      return json(200, { session: sessaoPublica(sessao) });
    }

    if (caminho.endsWith("/recuperar/verificar")) {
      const p = pedidoVerificar(corpo);
      const email = await resolver(p.identificador, "verificacao_codigo");
      const sessao = email
        ? (await publico().auth.verifyOtp({ email, token: p.codigo, type: "recovery" })).data.session
        : null;
      await registrar(p.identificador, "verificacao_codigo", !!sessao);
      if (!sessao) throw new ErroLogin(400, MSG.codigoInvalido);
      return json(200, { session: sessaoPublica(sessao) });
    }

    if (caminho.endsWith("/recuperar")) {
      const p = pedidoRecuperar(corpo);
      const email = await resolver(p.identificador, "envio_codigo");
      // todo pedido conta: limita envio de e-mails em série para o mesmo cadastro
      await registrar(p.identificador, "envio_codigo", false);
      if (email) {
        const { error } = await publico().auth.resetPasswordForEmail(email);
        if (error) console.error("app-motorista-login recuperar", error.message);
      }
      return json(200, { mensagem: MSG.codigoEnviado });
    }

    throw new ErroLogin(404, "rota inexistente");
  } catch (e) {
    if (e instanceof ErroLogin) return json(e.status, { erro: e.message });
    console.error("app-motorista-login", e);
    return json(500, { erro: "Não foi possível concluir agora. Tente novamente." });
  }
});
