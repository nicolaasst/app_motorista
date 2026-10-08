import { App as CapApp } from "@capacitor/app";
import { PushNotifications } from "@capacitor/push-notifications";
import { registrarDispositivo, removerDispositivo } from "@/api/app-motorista/dispositivos";
import { ehNativo, plataforma } from "@/lib/nativo";

// Push nativo (FCM no Android, APNs no iOS via FCM/APNs). O app só cadastra o aparelho no banco;
// o ENVIO é uma Edge Function à parte, desligada até haver credencial (docs/INTEGRACAO_APP_MOTORISTA.md).

const CHAVE_TOKEN = "ngs.push.token";

const lerToken = () => {
  try {
    return localStorage.getItem(CHAVE_TOKEN);
  } catch {
    return null;
  }
};
const guardarToken = (t) => {
  try {
    if (t) localStorage.setItem(CHAVE_TOKEN, t);
    else localStorage.removeItem(CHAVE_TOKEN);
  } catch {
    /* sem armazenamento: remove o aparelho só na próxima sessão */
  }
};

/**
 * Pede permissão, registra no FCM/APNs e cadastra o token. `aoAbrir(dados)` roda quando o motorista toca na notificação.
 * Devolve uma função que desfaz os listeners. No navegador não faz nada.
 */
export async function ativarPush(opcoes) {
  const aoAbrir = opcoes?.aoAbrir;
  if (!ehNativo()) return () => {};
  const remover = [];
  try {
    remover.push(
      await PushNotifications.addListener("registration", async ({ value }) => {
        try {
          const info = await CapApp.getInfo();
          await registrarDispositivo({ plataforma: plataforma(), token: value, versao: info.version });
          guardarToken(value);
        } catch {
          /* tenta de novo na próxima abertura */
        }
      }),
      await PushNotifications.addListener("pushNotificationActionPerformed", (acao) => aoAbrir?.(acao.notification?.data ?? {})),
    );
    let permissao = await PushNotifications.checkPermissions();
    if (permissao.receive === "prompt" || permissao.receive === "prompt-with-rationale") {
      permissao = await PushNotifications.requestPermissions();
    }
    if (permissao.receive === "granted") await PushNotifications.register();
  } catch {
    /* push indisponível neste aparelho: o app segue funcionando sem notificações */
  }
  return () => remover.forEach((h) => h.remove());
}

/** Ao sair da conta: o aparelho deixa de receber as notificações deste motorista. */
export async function desativarPush() {
  if (!ehNativo()) return;
  const token = lerToken();
  try {
    if (token) await removerDispositivo(token);
    await PushNotifications.unregister();
  } catch {
    /* sem rede: o token é movido para quem entrar depois (token é único) */
  } finally {
    guardarToken(null);
  }
}
