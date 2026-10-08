# Pipeline de build e envio (GitHub Actions) — `.github/workflows/mobile.yml`

Dispara por **Run workflow** (Actions) ou por tag `app-v*`. **Nunca publica em produção pública** — isso é manual no console, com autorização escrita do dono.

## O que ele faz
| Situação | Android | iOS |
|---|---|---|
| **Sem Secrets** | `assembleDebug` → `.apk` de depuração | build de **simulador** (valida que compila; sem `.ipa`) |
| **Com Secrets de assinatura** | `bundleRelease` assinado → `.aab` | `archive` + `export` → `.ipa` assinado |
| **+ `enviar` = true (ou tag)** e Secrets de envio | envia ao **teste interno** do Google (rascunho) | envia ao **TestFlight** |

Sempre gera o artefato `pacote-lojas` (`ngs-driver-pacote-lojas.zip`): builds + `docs/store/` + este roteiro + o roteiro de teste em aparelho.
**Versionamento automático:** `versionCode` / `CFBundleVersion` = número da execução (`github.run_number`); `versionName`/`MARKETING_VERSION` = input `versao`
(padrão `1.0.0`). Se já houver builds nas lojas com número maior, ajuste o deslocamento (basta subir a variável `VERSION_CODE_OFFSET` e somá-la no workflow).

## Variáveis públicas (Settings → Secrets and variables → **Variables**)
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (as mesmas do TMS), `VITE_LEGAL_BASE_URL` (https do site do TMS, para os links de privacidade), `VITE_MAPBOX_PUBLIC_TOKEN`, `NGS_APP_ID` (opcional; **confirmar o appId antes de criar o app nas lojas**).

## Secrets (Settings → Secrets and variables → **Secrets**) — o dono cria; nenhum valor entra no repositório
| Secret | Para quê | Como obter |
|---|---|---|
| `ANDROID_KEYSTORE_BASE64` | keystore de upload do Android (`base64 -w0 release.jks`) | `keytool -genkeypair -v -keystore release.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`. **Guarde o keystore em lugar seguro**: perdê-lo trava as atualizações (use Play App Signing). |
| `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | credenciais do keystore | as do comando acima |
| `PLAY_SERVICE_ACCOUNT_JSON` | envio ao Google Play | Play Console → Configurações → Acesso à API → conta de serviço com permissão de lançamento |
| `GOOGLE_SERVICES_JSON` | push (FCM) no Android | Firebase → Configurações do projeto → app Android (pacote = `NGS_APP_ID`) → `google-services.json` |
| `IOS_CERTIFICATE_P12_BASE64`, `IOS_CERTIFICATE_PASSWORD` | certificado **Apple Distribution** | Apple Developer → Certificates → exportar `.p12` do Keychain |
| `IOS_PROVISIONING_PROFILE_BASE64` | perfil App Store | Apple Developer → Profiles (App Store, appId = `NGS_APP_ID`, com Push e Background Modes) |
| `APPLE_TEAM_ID` | time da conta Apple | developer.apple.com → Membership |
| `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_API_KEY_P8` | envio ao TestFlight | App Store Connect → Usuários e acesso → Chaves |

Push no iOS: o plugin registra o token **APNs** do aparelho. Para enviar pelo FCM também no iPhone é preciso cadastrar a chave APNs (.p8) no Firebase e usar o
`GoogleService-Info.plist` (decisão de arquitetura do envio, a tomar junto com a Edge Function de notificações). Hoje o app só **cadastra** o token
(`app_motorista_registrar_dispositivo`); o **envio** é uma Edge Function à parte, desligada sem credencial.

## Estado desta entrega
- Workflow escrito e com YAML válido. **Não foi executado**: o ambiente de desenvolvimento não tem runner macOS nem Secrets, então os dois jobs ainda não rodaram no GitHub — o primeiro passo é "Run workflow" sem Secrets para validar que compila.
- Versão do Xcode: o Apple exige Xcode 26+/SDK iOS 26 nos uploads desde 28/04/2026; o job imprime `xcodebuild -version`. Se o `macos-latest` ainda não tiver, troque o `runs-on` por uma imagem que tenha.
- Envio para **produção pública**: só manual, com autorização escrita.
