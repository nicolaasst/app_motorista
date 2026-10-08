import { BiometricAuth } from "@aparajita/capacitor-biometric-auth";
import { ehNativo } from "@/lib/nativo";

// Biometria como ATALHO sobre uma sessão já autenticada: ao voltar para o app
// depois de um tempo, pede digital/rosto em vez de reabrir o login. Nunca é o
// único fator: quem não passa (ou não tem biometria) sai e entra de novo com
// CPF/matrícula e senha.

const CHAVE = "ngs.biometria.ativa";
export const TEMPO_BLOQUEIO_MS = 60_000;

export async function biometriaDisponivel() {
  if (!ehNativo()) return false;
  try {
    return (await BiometricAuth.checkBiometry()).isAvailable;
  } catch {
    return false;
  }
}

export function biometriaAtiva() {
  try {
    return localStorage.getItem(CHAVE) === "1";
  } catch {
    return false;
  }
}

export function definirBiometriaAtiva(ativa) {
  try {
    localStorage.setItem(CHAVE, ativa ? "1" : "0");
  } catch {
    /* sem armazenamento: a preferência não persiste */
  }
}

/** Pede a biometria. Devolve true se confirmou; false se cancelou/falhou. */
export async function confirmarBiometria(motivo = "Confirme que é você para continuar") {
  try {
    await BiometricAuth.authenticate({ reason: motivo, cancelTitle: "Cancelar", allowDeviceCredential: false });
    return true;
  } catch {
    return false;
  }
}
