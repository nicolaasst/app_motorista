import { ehNativo } from "@/lib/nativo";

// Divulgação destacada (exigência do Google Play e boa prática da Apple): antes do pedido de permissão do sistema,
// o app explica o que coleta, quando e para quê. Só no app nativo; no navegador o próprio navegador pergunta.
// A versão da chave muda se o texto/uso mudar, para pedir de novo.
const CHAVE = "ngs.divulgacao.localizacao.v1";

export function precisaDivulgarLocalizacao() {
  if (!ehNativo()) return false;
  try {
    return localStorage.getItem(CHAVE) !== "1";
  } catch {
    return true;
  }
}

export function registrarDivulgacaoLocalizacao() {
  try {
    localStorage.setItem(CHAVE, "1");
  } catch {
    /* sem armazenamento: pergunta de novo na próxima rota */
  }
}
