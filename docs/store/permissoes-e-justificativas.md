# Permissões e justificativas

## Localização em segundo plano (texto para o Play Console e para a Apple)
> O NGS Driver é o aplicativo do motorista de uma transportadora. Durante uma **rota iniciada pelo motorista**, o app envia a posição do veículo
> para a central de operações, mesmo com a tela bloqueada, para: (1) a central acompanhar a carga e avisar o cliente do andamento da entrega,
> (2) registrar o local do comprovante de entrega e (3) acionar socorro em caso de emergência. Quando a rota termina, a coleta para.
> Sem a localização contínua durante a rota o app não cumpre a função principal. Uma notificação permanente indica quando a coleta está ativa.
> A divulgação destacada aparece dentro do app **antes** do pedido de permissão do sistema.

## Android — `AndroidManifest.xml`
| Permissão | Para quê |
|---|---|
| `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` | posição do veículo na rota |
| `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION` | serviço em primeiro plano (tipo localização) que mantém o rastreio com a tela bloqueada |
| `POST_NOTIFICATIONS` | a notificação permanente do serviço e os avisos da central (Android 13+) |
| `CAMERA` | fotos de comprovante/ocorrência e leitura de código de barras |
| `INTERNET`, `ACCESS_NETWORK_STATE` | envio dos registros |
| `VIBRATE` | retorno tátil da bipagem |

`ACCESS_BACKGROUND_LOCATION` **não** é declarada (o serviço é iniciado com o app visível). Mesmo assim, preencher no Play Console (Conteúdo do app):
**Permissões de localização** (localização via serviço em primeiro plano equivalente a segundo plano) e **Serviço em primeiro plano → Localização**,
cada uma com vídeo (`video-demonstracao.md`), a divulgação destacada e o link da política de privacidade.
`targetSdkVersion` = 36 (exigência do Play a partir de 31/08/2026).

## iOS — `Info.plist` (já no projeto)
- `NSLocationWhenInUseUsageDescription` e `NSLocationAlwaysAndWhenInUseUsageDescription` — textos em `ios/App/App/Info.plist`.
- `UIBackgroundModes`: `location` e `remote-notification`.
- `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSFaceIDUsageDescription`.
- `ITSAppUsesNonExemptEncryption` = `false` (só criptografia padrão do sistema/HTTPS).
- Capabilities no Xcode/Apple Developer: **Push Notifications** (arquivo `App.entitlements`) e **Background Modes → Location updates**.
