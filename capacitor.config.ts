import type { CapacitorConfig } from "@capacitor/cli";

// Casca nativa (Capacitor). O appId vem de UMA variável: NGS_APP_ID.
// Padrão: br.com.ngstransportes.motorista — CONFIRMAR antes de criar o app nas lojas
// (o appId não muda depois de publicado). Ver docs/app/ADR-001-capacitor.md.
const appId = process.env.NGS_APP_ID || "br.com.ngstransportes.motorista";

const config: CapacitorConfig = {
  appId,
  appName: "NGS Driver",
  webDir: "dist",
  // Sem `server.url`: o app carrega os assets empacotados (funciona offline) e não aponta para site remoto.
  // useLegacyBridge: evita o corte do rastreio em segundo plano após ~5 min no Android (ver plugin de geolocalização).
  android: { allowMixedContent: false, useLegacyBridge: true },
  ios: { contentInset: "automatic" },
  plugins: {
    // fetch/XHR passam pelo código nativo: o Android estrangula HTTP da webview em segundo plano.
    CapacitorHttp: { enabled: true },
    PushNotifications: { presentationOptions: ["badge", "sound", "alert"] },
  },
};

export default config;
