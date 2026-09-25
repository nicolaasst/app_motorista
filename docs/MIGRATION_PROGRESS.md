# MIGRATION_PROGRESS — ngs-driver (Base44 → Supabase)

## Status: ✅ Regra 0 · ✅ Fase 1 (desenho) concluída — aguardando validação do responsável

**O banco não foi alterado** (decisão D6). Todo acesso ao Supabase até aqui foi somente leitura.

### Documentos da Fase 1

| documento | conteúdo |
|---|---|
| `docs/MIGRACAO_ENTIDADES_BASE44.md` | 21 entidades → 20 tabelas `app_motorista_*` + objetos do TMS referenciados, coluna a coluna |
| `docs/RBAC_RLS_APP_MOTORISTA.md` | claims, portal `app-motorista`, policies, matriz de acesso, RPCs, LGPD, plano pgTAP |
| `docs/ARQUITETURA_APP_MOTORISTA.md` | auth, camada de dados, offline/idempotência, GPS, R2, emergência, dependências do Base44 |
| `docs/DESIGN_TOKENS_APP.md` | 75 tokens de cor (claro/escuro), tipografia, raios, sombras — transcrição fiel |
| `docs/DECISIONS.md` | D1–D6 do responsável; D7–D12 propostas técnicas em validação |
| `docs/OPEN_QUESTIONS.md` | OQ-01 a OQ-21 com proposta padrão; OQ-01, OQ-02 e OQ-20 bloqueiam a 1ª migration |

### Bugs encontrados no código do app (corrigidos na Fase 2, sem mudança visual)

| id | onde | problema |
|---|---|---|
| B-01 | `src/pages/Login.jsx:42` | Antes de autenticar, baixa **todos** os `DriverProfile` (CPF, e-mails) para o aparelho, para achar o e-mail pelo CPF/matrícula. Vazamento de dados pessoais. |
| B-02 | `src/pages/ConfirmDelivery.jsx:98-121`, `src/lib/offlineQueue.js:198` | Comprovante de entrega grava `signature_png: ""` (a assinatura desenhada é descartada) e `lat/lng` **da parada**, não do aparelho (`accuracy_m: null`). A prova de entrega não tem assinatura nem localização real. |
| B-03 | `src/pages/ReceiptDetail.jsx:55` | "Hash" da assinatura do recibo é `btoa(assinatura).slice(0, 32)`, calculado no cliente — não é hash e pode ser forjado. O cliente também define `status: "assinado"`. |
| B-04 | `src/pages/ForgotPassword.jsx:28` | Recuperação de senha simulada: aceita qualquer código de 6 dígitos e não chama backend. |
| B-05 | `src/lib/offlineQueue.js:196-260` | Comprovante + atualização da parada em duas chamadas sem idempotência (reenvio duplica o comprovante); GPS por leitura-modificação-escrita de um array na rota (corrida, crescimento sem limite). |
| B-06 | `src/lib/driver.js:7` | Motorista atual = `profiles[0]`, com fallback fixo `"seed-driver-lucas"`. |

### Verificação da Regra 0

| data | commit do `main` | resultado |
|---|---|---|
| 2026-09-25 | `bd2ddd3` | ⛔ export corrompido: 83 arquivos comprometidos (30 vazios, 49 com erro de sintaxe, 4 truncados), incluindo `index.html`, 21/23 telas, entidades `Route`/`Stop`/`DriverProfile` e os design tokens. Migração parada. |
| 2026-09-25 | `59aa58c` | ✅ novo upload do Base44 íntegro (detalhes abaixo). |

#### Verificação do `59aa58c`

- **Nenhum arquivo vazio.** Os 30 arquivos que estavam vazios agora têm conteúdo (ex.:
  `AuthContext.jsx` 148 linhas, `offlineQueue.js` 303, `geo.js` 147, `useDriverTracking.js` 173).
- **Parse de todos os 183 arquivos de código/entidades: 0 erros.** As 21 entidades em
  `base44/entities/*.jsonc` são JSON válido.
- `syncEngine.js` declara `export function syncNow()`; `offlineQueue.js` exporta
  `pendingCount`, `subscribeQueue`, `syncPending`, `enqueue`, `enqueueGpsPoints`, blobs etc.
- `src/index.css` íntegro (114 variáveis CSS, bloco `.dark` presente); `tailwind.config.js` íntegro.
- `npm install` ok. **`npm run build` falha só por asset binário ausente** — o export do Base44
  não inclui binários nem `public/`:

  | arquivo ausente | referenciado em | impacto |
  |---|---|---|
  | `src/assets/brand/logo-full.png` | `src/components/rp/Logo.jsx` | **quebra o build** |
  | `public/logo.png` | `index.html` (favicon) | 404 em runtime |
  | `public/manifest.json` | `index.html` (PWA) | 404 em runtime, PWA não instala |

  Com um PNG placeholder no lugar do logo (teste feito fora do repositório), o build conclui
  (3.095 módulos). **Nada foi adicionado ao repositório** — o logo real precisa vir do Base44 ou
  da empresa.
- `npm run lint`: 5 erros pré-existentes (4 imports não usados de `Logo`/`LineArt`, 1 regra
  `react-hooks/exhaustive-deps` não registrada no ESLint). Não bloqueiam o build.

## arquivos_vazios_no_export

Todos os 83 arquivos listados no inventário de `bd2ddd3` foram **recuperados do Base44 Builder**
pelo responsável (novo upload `59aa58c`). Nenhum foi reimplementado do zero. Estratégia por
arquivo: *recuperado do Base44 Builder* (exceto os 3 binários da tabela acima, pendentes).

<details><summary>Inventário original (commit bd2ddd3)</summary>

| arquivo | estado | detalhe | havia conteúdo no Git? | fonte de recuperação | estratégia adotada |
|---|---|---|---|---|---|
| `base44/config.jsonc` | vazio | 1 byte(s) | não (commit único `bd2ddd3`) | Base44 Builder | recuperado do Base44 Builder (`59aa58c`) |
| `base44/entities/DeliveryProof.jsonc` | vazio | 1 byte(s) | não (commit único `bd2ddd3`) | Base44 Builder | recuperado do Base44 Builder (`59aa58c`) |
| `base44/entities/DriverProfile.jsonc` | quebrado | JSON inválido (corte no meio) | não (commit único `bd2ddd3`) | Base44 Builder | recuperado do Base44 Builder (`59aa58c`) |
| `base44/entities/FailureReport.jsonc` | vazio | 1 byte(s) | não (commit único `bd2ddd3`) | Base44 Builder | recuperado do Base44 Builder (`59aa58c`) |
| `base44/entities/Notification.jsonc` | vazio | 1 byte(s) | não (commit único `bd2ddd3`) | Base44 Builder | recuperado do Base44 Builder (`59aa58c`) |
| `base44/entities/Route.jsonc` | quebrado | JSON inválido (corte no meio) | não (commit único `bd2ddd3`) | Base44 Builder | recuperado do Base44 Builder (`59aa58c`) |
| `base44/entities/Stop.jsonc` | quebrado | JSON inválido (corte no meio) | não (commit único `bd2ddd3`) | Base44 Builder | recuperado do Base44 Builder (`59aa58c`) |
| `index.html` | vazio | 15 bytes — só `<!doctype html>`, sem `<script>`/`#root` | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/App.jsx` | quebrado | erro de sintaxe na L58 (Declaration or statement expected.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/analysis/EvolutionChart.jsx` | quebrado | erro de sintaxe na L59 (Unexpected token. Did you mean `{'>'}` or `&gt;`?) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/AppLayout.jsx` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/AuthLayout.jsx` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/GoogleIcon.jsx` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/route/NavMap.jsx` | quebrado | erro de sintaxe na L55 (';' expected.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/route/RouteMap.jsx` | quebrado | erro de sintaxe na L87 ('catch' or 'finally' expected.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/rp/BarcodeScanner.jsx` | quebrado | erro de sintaxe na L115 (Declaration or statement expected.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/rp/CollapsibleStopCard.jsx` | quebrado | erro de sintaxe na L56 (Unexpected token. Did you mean `{'>'}` or `&gt;`?) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ScrollToTop.jsx` | quebrado | erro de sintaxe na L51 (',' expected.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/SignaturePad.jsx` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/TabStackSync.jsx` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ThemeSync.jsx` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/alert-dialog.jsx` | quebrado | erro de sintaxe na L51 (')' expected.) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/chart.jsx` | quebrado | erro de sintaxe na L49 (Expression expected.) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/context-menu.jsx` | quebrado | erro de sintaxe na L56 (Expected corresponding JSX closing tag for 'ContextMenuPrimitive.Item'.) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/dialog.jsx` | quebrado | erro de sintaxe na L50 (Property assignment expected.) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/drawer.jsx` | quebrado | erro de sintaxe na L50 (',' expected.) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/dropdown-menu.jsx` | quebrado | erro de sintaxe na L52 (Declaration or statement expected.) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/form.jsx` | quebrado | erro de sintaxe na L58 (Declaration or statement expected.) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/image-helpers.js` | quebrado | erro de sintaxe na L56 (Declaration or statement expected.) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/image.jsx` | quebrado | erro de sintaxe na L55 (':' expected.) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/input-otp.jsx` | quebrado | erro de sintaxe na L66 (Declaration or statement expected.) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/input.jsx` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/label.jsx` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/menubar.jsx` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/navigation-menu.jsx` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/otp-input.jsx` | quebrado | erro de sintaxe na L65 (Unexpected token. Did you mean `{'>'}` or `&gt;`?) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/pagination.jsx` | quebrado | erro de sintaxe na L54 (')' expected.) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/scroll-area.jsx` | quebrado | erro de sintaxe na L45 (Declaration or statement expected.) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/select.jsx` | quebrado | erro de sintaxe na L52 (',' expected.) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/sheet.jsx` | quebrado | erro de sintaxe na L52 (Declaration or statement expected.) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/slider.jsx` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/sonner.jsx` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/switch.jsx` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/table.jsx` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/tabs.jsx` | quebrado | erro de sintaxe na L23 (')' expected.) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/textarea.jsx` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/toast.jsx` | quebrado | erro de sintaxe na L2 ('export' expected.) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/ui/use-toast.jsx` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | template shadcn/ui (boilerplate) | recuperado do Base44 Builder (`59aa58c`) |
| `src/components/UserNotRegisteredError.jsx` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/hooks/useDriverTracking.js` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/hooks/useRouteChangeAlert.js` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/hooks/useRouteNavigation.js` | quebrado | erro de sintaxe na L75 ('catch' or 'finally' expected.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/hooks/useSyncStatus.js` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/index.css` | truncado (parseável) | `@layer base` não fecha; faltam bloco `.dark`, `--status-green-bg`, `--brand-yellow-*`, `--outline`, `--surface-track`, `.text-headline-*`, `.text-display-*`, `.card`, `.screen-pad`, `.chip`... | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/lib/app-params.js` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/lib/AuthContext.jsx` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/lib/authReturnTo.js` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/lib/geo.js` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/lib/illustrations.js` | vazio | 0 byte(s) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/lib/offlineQueue.js` | truncado (parseável) | 44 bytes — só a linha de `import`; nenhuma das funções exportadas | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/lib/syncEngine.js` | quebrado | erro de sintaxe na L54 (Declaration or statement expected.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/pages/Analysis.jsx` | quebrado | erro de sintaxe na L67 (',' expected.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/pages/ConfirmDelivery.jsx` | quebrado | erro de sintaxe na L88 (':' expected.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/pages/ForgotPassword.jsx` | quebrado | erro de sintaxe na L53 (JSX element 'span' has no corresponding closing tag.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/pages/Home.jsx` | quebrado | erro de sintaxe na L85 (JSX expressions must have one parent element.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/pages/Login.jsx` | quebrado | erro de sintaxe na L57 (Declaration or statement expected.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/pages/Navigation.jsx` | quebrado | erro de sintaxe na L86 (Declaration or statement expected.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/pages/OAuthConsent.jsx` | quebrado | erro de sintaxe na L59 ('catch' or 'finally' expected.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/pages/PreOpChecklist.jsx` | quebrado | erro de sintaxe na L106 (Declaration or statement expected.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/pages/Profile.jsx` | quebrado | erro de sintaxe na L55 (',' expected.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/pages/ProfileEdit.jsx` | quebrado | erro de sintaxe na L55 (JSX expressions must have one parent element.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/pages/ReceiptDetail.jsx` | quebrado | erro de sintaxe na L56 (Property assignment expected.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/pages/Receipts.jsx` | quebrado | erro de sintaxe na L55 (Expected corresponding JSX closing tag for 'PullToRefresh'.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/pages/Register.jsx` | quebrado | erro de sintaxe na L89 (Expected corresponding closing tag for JSX fragment.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/pages/RegisterInsucesso.jsx` | quebrado | erro de sintaxe na L55 (';' expected.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/pages/ResetPassword.jsx` | quebrado | erro de sintaxe na L60 (')' expected.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/pages/RouteCompletion.jsx` | quebrado | erro de sintaxe na L95 (Expected corresponding JSX closing tag for 'header'.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/pages/RouteDetail.jsx` | quebrado | erro de sintaxe na L78 (JSX element 'button' has no corresponding closing tag.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/pages/RouteHistory.jsx` | quebrado | erro de sintaxe na L68 (',' expected.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/pages/StopDetail.jsx` | truncado (parseável) | L52: corpo do handler de bipagem começa sem a declaração da função | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/pages/Support.jsx` | quebrado | erro de sintaxe na L54 (JSX expressions must have one parent element.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `src/pages/TurnClosing.jsx` | quebrado | erro de sintaxe na L55 (Declaration or statement expected.) | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |
| `tailwind.config.js` | truncado (parseável) | cortado dentro de `colors.error: {` — entradas `error`, `success`, `brand-yellow` etc. perdidas | não (commit único `bd2ddd3`) | Base44 Builder (única fonte) | recuperado do Base44 Builder (`59aa58c`) |

</details>
