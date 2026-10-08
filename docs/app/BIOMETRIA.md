# Acesso por biometria (digital / rosto) — NGS Driver

## 1. Auditoria do que já existia (antes desta entrega)
| Peça | Estado encontrado |
|---|---|
| Login | CPF/matrícula/e-mail + senha → Edge Function `app-motorista-login/entrar` → `supabase.auth.setSession`. Sem biometria no fluxo. |
| Sessão | `src/api/supabaseClient.js`: no app nativo vai para o **Keychain/Keystore** (`armazenamentoSeguro`, Lote 04); no navegador, `localStorage`/`sessionStorage` ("Lembrar de mim"). |
| Estado de auth | `AuthContext` (`isAuthenticated`, `logout`…) + `App.jsx` (`AuthenticatedApp` decide login × app). Guarda de rota por sessão. |
| Biometria | Havia só um **bloqueio ao voltar do 2º plano** (Lote 04): flag em `localStorage`, sem tratar erros, sem oferta pós-login, sem bloqueio na abertura, sem limpeza no logout. |
| Logout | `sair()` → remove push + `signOut`; **não** apagava preferências de biometria. |
| Plugins | `@aparajita/capacitor-biometric-auth` 10 (Capacitor 8; BiometricPrompt no Android, LocalAuthentication no iOS) e `@aparajita/capacitor-secure-storage` já instalados. |
| Nativo | Android: `USE_BIOMETRIC` via biblioteca; iOS: `NSFaceIDUsageDescription` já no `Info.plist`. |

Decisão: **não alterar o fluxo de login existente**. A biometria é uma camada por cima da sessão persistida, nunca um segundo caminho de autenticação no servidor.

## 2. Como funciona
- **A biometria não autentica no servidor.** Quem confere digital/rosto é o aparelho (APIs nativas). O app só recebe "confirmou / não confirmou". **Nenhum dado biométrico é lido, guardado ou enviado.**
- A **sessão** (access/refresh token) continua no Keychain/Keystore. A biometria é um **portão local** sobre essa sessão: com ela ativa, o app abre bloqueado e só mostra conteúdo depois da confirmação.
- A **preferência** (usuário + ativa + "já decidiu") fica no **mesmo cofre seguro** (`biometria.v1`), não em `localStorage`, para não ser desligada por fora. Vale **só para o usuário** que a ativou: se outro motorista entrar no aparelho, é ignorada.
- Se a sessão expirou/foi revogada, a biometria não ajuda: entra-se com senha (o app **não guarda a senha**).

## 3. Fluxos
1. **Primeiro login (senha)** → na tela inicial, uma única oferta "Entrar mais rápido?" (só no app, com biometria disponível e cadastrada). *Ativar* pede a biometria ao sistema e só então grava; *Agora não* é uma decisão e não pergunta de novo.
2. **Configurações** (Perfil → Preferências → "Acesso por biometria"): liga (confirma com a biometria) e desliga. Sem biometria disponível o interruptor fica desabilitado com o motivo na tela.
3. **Abertura do app** com biometria ativa: tela de carregamento → **tela de bloqueio opaca** → pede a biometria sozinha. Sucesso libera.
4. **Volta do segundo plano** depois de 60 s: bloqueia de novo (a rota em andamento e o rastreio **não** são interrompidos; só a tela é coberta).
5. **Falha / cancelamento / indisponível**: mensagem clara + "Usar biometria" (de novo) + "**Entrar com senha**", que faz logout completo e volta ao login.
6. **Logout** (`sair()`): remove o aparelho do push, **apaga a preferência de biometria**, encerra a sessão (token removido do cofre) e recarrega no login. Também ocorre ao tocar "Entrar com senha".

## 4. Casos tratados (`interpretarErroBiometria`)
| Situação | Código do sistema | Comportamento |
|---|---|---|
| Aparelho sem biometria | `biometryNotAvailable` | opção desabilitada com o motivo; senha |
| Biometria não cadastrada | `biometryNotEnrolled` | mensagem "cadastre nas configurações do aparelho"; senha |
| Sem bloqueio de tela | `passcodeNotSet` / `noDeviceCredential` | mensagem para definir PIN/padrão/senha |
| Não reconhecida | `authenticationFailed` | mensagem + tentar de novo |
| Cancelou | `userCancel` / `systemCancel` / `appCancel` / `userFallback` | segue bloqueado, sem erro agressivo |
| Bloqueio temporário | `biometryLockout` | mensagem "aguarde ou use a senha" |
| Erro desconhecido | outros | mensagem genérica que oferece a senha |
Android: `allowDeviceCredential=false` (o PIN do aparelho **não** vira atalho; a alternativa é a senha do app); aceita biometria **forte** quando disponível e, senão, a fraca (ex.: rosto de classe 2). iOS: Touch ID / Face ID, sem botão de fallback do sistema.

## 5. Arquivos
`src/lib/biometria.js` (lógica pura + API nativa + cofre) · `src/lib/BiometriaContext.jsx` (estado/ações) · `src/components/BloqueioBiometrico.jsx` (bloqueio) · `src/components/OfertaBiometria.jsx` (oferta pós-login) · `src/pages/Profile.jsx` (interruptor) · `src/App.jsx` (provider + espera o estado antes de mostrar o app) · `src/api/app-motorista/auth.js` (`sair()` limpa a biometria).

## 6. Configuração nativa
- **Android** (`AndroidManifest.xml`): `USE_BIOMETRIC` (explícita; a biblioteca `androidx.biometric` também a declara). Nada mais. `android:allowBackup="false"` (a sessão não vai para backup na nuvem).
- **iOS** (`Info.plist`): `NSFaceIDUsageDescription` (já presente). Sem entitlement extra.
- `npx cap sync` registra o plugin nos dois projetos (conferido: `capacitor.settings.gradle` e `CapApp-SPM/Package.swift`).

## 7. Roteiro de validação em aparelho (não executável no ambiente de desenvolvimento)
Android (versão ≥ 13 e uma ≤ 10) e iPhone (Face ID e Touch ID, se houver):
1. Login com senha → aparece a oferta → *Ativar* → confirma → ok. Reabra o Perfil: interruptor ligado.
2. Feche o app (deslizar) e abra: bloqueio → biometria → entra. **Repita com biometria errada 3×** (mensagem; no limite, bloqueio temporário → "Entrar com senha").
3. *Cancelar* no prompt → continua bloqueado, botões visíveis.
4. Deixe 2 min em segundo plano → ao voltar, bloqueio. Voltar em < 1 min → livre.
5. Com rota ativa e rastreio ligado, bloqueie/desbloqueie: o rastreio **não** para (ver `TESTE_EM_APARELHO.md`).
6. Remova todas as digitais/rostos nas configurações do aparelho e abra o app: mensagem "nenhuma biometria cadastrada" + "Entrar com senha".
7. Perfil → desligar → reabrir: abre sem bloqueio. Ligar de novo funciona.
8. Logout: volta ao login; reabrir o app **não** pede biometria e **não** entra sem senha. Ligar a biometria de novo exige nova oferta.
9. Entrar com **outro motorista** no mesmo aparelho: a biometria do anterior não vale (oferta de novo).
10. Aparelho sem biometria / sem bloqueio de tela: oferta não aparece; Perfil mostra o motivo.

## 8. Testes automatizados (51 no repositório; rodam em CI)
`src/lib/biometria.test.js` (erros, estado inicial, tempo de bloqueio, aparelho, preferência no cofre) · `src/lib/BiometriaContext.test.jsx` (abertura bloqueada, sucesso/falha/cancelamento/lockout, senha → logout, outro usuário, sem sessão, ativar/cancelar/sem biometria/desativar, volta do 2º plano) · `src/api/app-motorista/sair.test.js` (ordem do logout completo).

## 9. Limites conhecidos
- Não foi possível compilar nem rodar em Android/iOS neste ambiente (sem SDK Android/Xcode): a validação nativa fica com o pipeline `mobile.yml` e com o roteiro acima.
- O bloqueio é da interface: protege contra quem pega o aparelho **desbloqueado e com o app aberto/reaberto**. Contra aparelho com root/jailbreak ou acesso ao sandbox, vale a proteção do cofre do sistema, não a biometria.
