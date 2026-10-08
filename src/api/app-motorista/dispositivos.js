import { rpc } from "./cliente";

/** Guarda o token de push do aparelho (um token pertence a um motorista por vez). */
export function registrarDispositivo({ plataforma, token, versao }) {
  return rpc("app_motorista_registrar_dispositivo", { p_plataforma: plataforma, p_token: token, p_versao: versao ?? null });
}

/** Tira o aparelho do push (ao sair da conta). */
export function removerDispositivo(token) {
  return rpc("app_motorista_remover_dispositivo", { p_token: token });
}
