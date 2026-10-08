import { KeychainAccess, SecureStorage } from "@aparajita/capacitor-secure-storage";

// Armazenamento da sessão no app nativo: Keychain (iOS) / Keystore (Android),
// nunca localStorage. Interface assíncrona compatível com `auth.storage` do supabase-js.
// afterFirstUnlock: o rastreio em segundo plano pode reabrir o app com a tela bloqueada.

const PREFIXO = "ngs.driver.";
let pronto = null;

function preparar() {
  pronto ??= SecureStorage.setKeyPrefix(PREFIXO).catch((e) => {
    pronto = null;
    throw e;
  });
  return pronto;
}

export const armazenamentoSeguro = {
  async getItem(chave) {
    await preparar();
    const v = await SecureStorage.get(chave, false, false);
    return typeof v === "string" ? v : v == null ? null : JSON.stringify(v);
  },
  async setItem(chave, valor) {
    await preparar();
    await SecureStorage.set(chave, valor, false, false, KeychainAccess.afterFirstUnlock);
  },
  async removeItem(chave) {
    await preparar();
    await SecureStorage.remove(chave, false);
  },
};
