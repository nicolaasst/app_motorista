import { definirLembrarLogin, supabase } from "@/api/supabaseClient";
import { ErroApp, funcao } from "./cliente";

// Login por CPF/matrícula e recuperação de senha passam pela Edge Function
// app-motorista-login: o e-mail é resolvido no servidor e nunca chega ao aparelho.

async function aplicarSessao(session) {
  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  if (error) throw new ErroApp("Não foi possível iniciar a sessão. Tente novamente.");
}

export async function entrar({ identificador, senha, lembrar = true }) {
  definirLembrarLogin(lembrar);
  const { session } = await funcao("app-motorista-login/entrar", { identificador, senha }, { autenticado: false });
  await aplicarSessao(session);
}

export async function solicitarCodigo(identificador) {
  const { mensagem } = await funcao("app-motorista-login/recuperar", { identificador }, { autenticado: false });
  return mensagem;
}

/** Valida o código; em caso de sucesso fica uma sessão de recuperação ativa. */
export async function validarCodigo(identificador, codigo) {
  definirLembrarLogin(false);
  const { session } = await funcao("app-motorista-login/recuperar/verificar", { identificador, codigo }, { autenticado: false });
  await aplicarSessao(session);
}

/** Troca a senha na sessão de recuperação e encerra (o motorista entra de novo com a nova senha). */
export async function definirNovaSenha(senha) {
  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) throw new ErroApp(error.message || "Não foi possível alterar a senha.");
  await supabase.auth.signOut();
}

export async function sair() {
  await supabase?.auth.signOut();
}
