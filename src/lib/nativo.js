import { Capacitor } from "@capacitor/core";

// Casca nativa (Capacitor). No navegador/PWA tudo isto devolve "não nativo" e o app usa as APIs web.

/** true quando o app roda empacotado no Android/iOS. */
export function ehNativo() {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/** "android" | "ios" | "web". */
export function plataforma() {
  try {
    return Capacitor.getPlatform();
  } catch {
    return "web";
  }
}
