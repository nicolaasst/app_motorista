// Camada de dados do App Motorista sobre o Supabase compartilhado do TMS.
// Leitura: tabelas app_motorista_* (RLS: só o próprio motorista).
// Escrita: sempre RPC app_motorista_* (regras, idempotência e prova no servidor).
export * from "./arquivos";
export * from "./auth";
export { ErroApp } from "./cliente";
export * from "./perfil";
export * from "./recibos";
export * from "./rotas";
export * from "./suporte";

export function novaChave() {
  return crypto.randomUUID();
}
