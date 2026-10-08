import { AndroidBiometryStrength, BiometricAuth, BiometryErrorType, BiometryType } from "@aparajita/capacitor-biometric-auth";
import { armazenamentoSeguro } from "@/lib/armazenamentoSeguro";
import { ehNativo } from "@/lib/nativo";

// Biometria como ATALHO sobre uma sessão já autenticada.
//  * Só as APIs nativas do aparelho (BiometricPrompt no Android, LocalAuthentication no iOS) confirmam quem é a pessoa:
//    o app NUNCA recebe, lê nem guarda impressão digital, rosto ou qualquer dado biométrico — só um "confirmou / não confirmou".
//  * A sessão (token) continua no Keychain/Keystore (armazenamentoSeguro). A biometria não troca a senha: quem não passa
//    na biometria (ou não tem) encerra a sessão e entra de novo com CPF/matrícula e senha.
//  * A preferência ("ativa" + a que usuário pertence) fica no mesmo cofre seguro, não em localStorage, para não ser desligada por fora.

const CHAVE_PREFERENCIA = "biometria.v1";
export const TEMPO_BLOQUEIO_MS = 60_000; // volta do 2º plano depois disso → pede biometria de novo

// ---------- lógica pura (testada) ----------

/** Traduz o código de erro do sistema em decisão de tela. Nunca expõe o texto cru do sistema. */
export function interpretarErroBiometria(codigo) {
  const c = String(codigo ?? "");
  const base = { codigo: c, cancelado: false, temporario: false, indisponivel: false };
  switch (c) {
    case BiometryErrorType.userCancel:
    case BiometryErrorType.systemCancel:
    case BiometryErrorType.appCancel:
      return { ...base, cancelado: true, mensagem: "Autenticação cancelada." };
    case BiometryErrorType.userFallback:
      return { ...base, cancelado: true, mensagem: "Você escolheu não usar a biometria." };
    case BiometryErrorType.authenticationFailed:
      return { ...base, mensagem: "Não reconhecemos a biometria. Tente de novo." };
    case BiometryErrorType.biometryLockout:
      return { ...base, temporario: true, mensagem: "Biometria bloqueada por muitas tentativas. Aguarde um pouco ou entre com a senha." };
    case BiometryErrorType.biometryNotEnrolled:
      return { ...base, indisponivel: true, mensagem: "Nenhuma digital ou rosto cadastrado no aparelho. Cadastre nas configurações do sistema ou entre com a senha." };
    case BiometryErrorType.biometryNotAvailable:
      return { ...base, indisponivel: true, mensagem: "Este aparelho não tem biometria disponível. Entre com a senha." };
    case BiometryErrorType.passcodeNotSet:
    case BiometryErrorType.noDeviceCredential:
      return { ...base, indisponivel: true, mensagem: "Defina um bloqueio de tela (PIN, padrão ou senha) no aparelho para usar a biometria." };
    default:
      return { ...base, mensagem: "Não foi possível usar a biometria agora. Tente de novo ou entre com a senha." };
  }
}

/** Estado ao abrir o app: bloqueia só se a biometria estiver ativa para o MESMO usuário da sessão. */
export function estadoInicial({ nativo, autenticado, userId, preferencia }) {
  const dono = Boolean(nativo && autenticado && userId && preferencia && preferencia.userId === userId);
  const ativa = dono && preferencia.ativa === true;
  return { ativa, decidido: dono && preferencia.decidido === true, bloqueado: ativa };
}

/** Voltou do segundo plano: bloqueia se a biometria está ativa e o app ficou fora tempo suficiente. */
export function deveBloquearAoVoltar({ ativa, foraMs }) {
  return Boolean(ativa) && foraMs >= TEMPO_BLOQUEIO_MS;
}

/** "digital" | "rosto" | "biometria" — só para o texto da tela. */
export function rotuloDoTipo(tipo) {
  if (tipo === BiometryType.touchId || tipo === BiometryType.fingerprintAuthentication) return "digital";
  if (tipo === BiometryType.faceId || tipo === BiometryType.faceAuthentication) return "rosto";
  return "biometria";
}

// ---------- aparelho ----------

/** { disponivel, tipo, mensagem } — `mensagem` explica por que não está disponível (aparelho sem biometria, não cadastrada, etc.). */
export async function lerEstadoBiometria() {
  if (!ehNativo()) return { disponivel: false, tipo: "biometria", forte: false, mensagem: "Disponível apenas no aplicativo instalado." };
  try {
    const r = await BiometricAuth.checkBiometry();
    if (r.isAvailable) return { disponivel: true, tipo: rotuloDoTipo(r.biometryType), forte: Boolean(r.strongBiometryIsAvailable), mensagem: "" };
    const i = interpretarErroBiometria(r.code || BiometryErrorType.biometryNotAvailable);
    return { disponivel: false, tipo: "biometria", forte: false, mensagem: i.mensagem };
  } catch {
    return { disponivel: false, tipo: "biometria", forte: false, mensagem: interpretarErroBiometria(BiometryErrorType.biometryNotAvailable).mensagem };
  }
}

/** Pede a biometria ao sistema. { ok: true } ou { ok: false, ...interpretarErroBiometria }. */
export async function autenticar({ motivo, forte = false } = {}) {
  try {
    await BiometricAuth.authenticate({
      reason: motivo ?? "Confirme que é você para continuar",
      cancelTitle: "Cancelar",
      allowDeviceCredential: false, // sem PIN do aparelho como atalho: a alternativa é a senha do app
      iosFallbackTitle: "", // sem botão de fallback do iOS
      androidTitle: "NGS Driver",
      androidSubtitle: "Confirme com a biometria",
      androidBiometryStrength: forte ? AndroidBiometryStrength.strong : AndroidBiometryStrength.weak,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, ...interpretarErroBiometria(e?.code) };
  }
}

// ---------- preferência (cofre seguro) ----------

export async function lerPreferencia() {
  try {
    const bruto = await armazenamentoSeguro.getItem(CHAVE_PREFERENCIA);
    const p = bruto ? JSON.parse(bruto) : null;
    return p && typeof p.userId === "string" ? p : null;
  } catch {
    return null;
  }
}

export async function gravarPreferencia({ userId, ativa, decidido = true }) {
  await armazenamentoSeguro.setItem(CHAVE_PREFERENCIA, JSON.stringify({ userId, ativa: Boolean(ativa), decidido: Boolean(decidido) }));
}

/** Logout completo / troca de usuário: a biometria não sobrevive à sessão. */
export async function limparBiometria() {
  try {
    await armazenamentoSeguro.removeItem(CHAVE_PREFERENCIA);
  } catch {
    /* sem cofre (navegador): nada a limpar */
  }
}
