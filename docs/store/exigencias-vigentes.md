# Exigências vigentes (conferidas em 2026-10-08, fontes públicas — confirmar nos consoles)

## Google Play
- **Nível de API:** novos apps e atualizações devem mirar **Android 16 (API 36)** a partir de **31/08/2026** (pedido de extensão até 01/11/2026). O projeto usa `targetSdkVersion = 36` e `minSdkVersion = 24`.
- **Localização em segundo plano / via serviço em primeiro plano:** exige formulário de declaração no Play Console (Conteúdo do app → Permissões sensíveis), vídeo, divulgação destacada no app e política de privacidade no app e na ficha. O Google trata localização via serviço em primeiro plano equivalente a segundo plano como tal.
- **Serviço em primeiro plano (Android 14+):** declarar cada tipo (aqui `location`) em Conteúdo do app, com descrição, impacto de interromper e vídeo.
- **Contas pessoais novas** (criadas após 13/11/2023): teste fechado com **12 testadores por 14 dias** antes da produção (conta de **organização** é isenta, segundo guias de terceiros). *Não confirmado na página oficial do Google — verificar.*
- **Exclusão de conta:** link web de exclusão na ficha (Data Safety) — `/exclusao-de-conta`.

## Apple
- **SDK mínimo:** uploads ao App Store Connect a partir de **28/04/2026** precisam ser compilados com **Xcode 26+ / SDK iOS 26**. O workflow usa runner macOS com o Xcode mais recente disponível — conferir a versão no job.
- **Localização em segundo plano:** justificar no campo de revisão; `UIBackgroundModes=location` com `NSLocationAlwaysAndWhenInUseUsageDescription`.
- **Privacidade:** rótulos de privacidade e URL da política obrigatórios. **Exclusão de conta dentro do app** é exigida (existe em Perfil → Excluir Conta).
- **Push:** capability Push Notifications + chave APNs (.p8) no Firebase.

## Fontes
Google (target API): developer.android.com/google/play/requirements/target-sdk · Play (localização): support.google.com/googleplay/android-developer/answer/9799150 · Play (serviço em primeiro plano): support.google.com/googleplay/android-developer/answer/13392821 · Apple (SDK): developer.apple.com/news/upcoming-requirements/.
