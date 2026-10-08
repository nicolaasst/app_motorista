# ADR-001 — Casca nativa com Capacitor

Status: aceita (2026-10-08). Decisão do dono registrada no prompt de continuação (Parte 1, item 2).

## Contexto
O app é React + Vite (migrado do Base44), ~25 telas. Precisa de rastreio com a tela bloqueada, push, câmera/leitor de código de barras,
biometria e funcionamento offline, nas lojas Apple e Google.

## Decisão
**Capacitor 8** embrulha o app web existente. Expo/React Native exigiria reescrever as telas. O `appId` vem de **uma única variável**
(`NGS_APP_ID`, lida em `capacitor.config.ts`); padrão `br.com.ngstransportes.motorista`.
**Confirmar o appId antes de criar o app nas lojas** — depois de publicado ele não muda. Se mudar, rode `npx cap sync` e ajuste
`android/app/build.gradle` (`namespace`/`applicationId`) e `PRODUCT_BUNDLE_IDENTIFIER` no Xcode (a CLI só preenche esses campos ao criar a plataforma).

## Plugins (versões vigentes em 2026-10-08)
| Função | Plugin | Observação |
|---|---|---|
| Rastreio em 2º plano | `@capgo/background-geolocation` 8.x (MPL-2.0, gratuito) | Capacitor 8; Android: serviço em primeiro plano `location` com notificação persistente; iOS: Core Location em segundo plano. O `@capacitor-community/background-geolocation` (MIT) não declara suporte ao Capacitor 8 e é descrito como menos preciso. |
| Push | `@capacitor/push-notifications` | FCM (Android) e APNs (iOS). O app só cadastra o token (`app_motorista_registrar_dispositivo`); o envio é Edge Function à parte, desligada sem credencial. |
| Leitor de código | `@capacitor-mlkit/barcode-scanning` | A webview do iOS não tem `BarcodeDetector`; no navegador segue o leitor web. |
| Biometria | `@aparajita/capacitor-biometric-auth` | Atalho sobre sessão aberta; nunca único fator. |
| Sessão | `@aparajita/capacitor-secure-storage` | Keychain/Keystore no lugar de `localStorage`. |
| Ciclo de vida | `@capacitor/app` | Bloqueio biométrico ao voltar do 2º plano; versão para o cadastro do aparelho. |

`CapacitorHttp` está ligado: `fetch`/XHR passam pelo código nativo, porque o Android estrangula HTTP da webview em segundo plano.
`android.useLegacyBridge: true` evita o corte do rastreio após ~5 min em segundo plano.

## Rastreio — como funciona e por que não pede "localização em segundo plano" no Android
- A rota ativa inicia o serviço **com o app visível**. O Android mantém um serviço em primeiro plano do tipo `location` recebendo posição
  com a tela bloqueada **sem** `ACCESS_BACKGROUND_LOCATION` (que exigiria a declaração de localização em segundo plano do Play). Mesmo assim o Play
  exige a declaração de **serviço em primeiro plano (tipo localização)** com vídeo — ver `docs/store/`.
- Frequência adaptativa (`src/lib/perfilRastreio.js`): em movimento, um ponto a cada ≥10 s e ≥25 m; parado por 90 s, um ponto a cada ≥2 min.
  A troca só vale depois de a condição se manter (histerese) e reinicia o serviço nativo.
- Fila local persistente e envio em lote com retentativa já existiam (`offlineQueue.js`, RPC `app_motorista_registrar_gps`, idempotente por rota+horário).
  O ponto sai pelo JS (a webview segue viva graças ao `useLegacyBridge`); **não** se usa o POST nativo do plugin, que não tem fila em disco nem retentativa.
- iOS: modo "Always/When In Use" conforme a regra da Apple; o `UIBackgroundModes=location` mantém o app rodando com a tela bloqueada enquanto
  o rastreio está ativo. **O iOS encerra o rastreio se o motorista forçar o fechamento do app** (restrição do sistema) — está no roteiro de teste.

## Plano B (se o teste em aparelho reprovar)
1. Reter a posição no aparelho (já há fila) e **avisar o motorista** se o serviço parar.
2. Trocar o plugin pelo da Transistorsoft (licença paga por app Android; iOS gratuito em debug) ou módulo nativo próprio.
   **Custo/licença só entra aqui depois do teste**, com aprovação do dono (recurso com custo).

## Segurança
Tokens no Keychain/Keystore; `allowBackup=false` no Android (a sessão não vai para backup na nuvem); nenhum segredo no pacote
(só a chave pública do Supabase, protegida por RLS); `google-services.json` e `GoogleService-Info.plist` não ficam no repositório (Secrets do CI).
Pinning de certificado não é obrigatório. Bloqueio de captura de tela é opcional e fica fora desta versão.

## Offline
Os assets (`dist/`) vão dentro do pacote nativo (`webDir`), então o app abre sem rede. Dados e envios ficam na fila local.
Não há service worker hoje; o modo web (PWA) continua sem cache offline — registrado como pendência de baixa prioridade.
