# MIGRATION_PROGRESS

Estado real da migração, atualizado a cada lote. Uma tela/endpoint só é
marcada `done` depois que `typecheck`, `lint`, `test`, `build` passam e,
quando aplicável, a comparação visual (`scripts/visual-compare.mjs`) não
mostra regressão acima do limiar. Nada aqui é marcado como concluído por
suposição — ver `docs/OPEN_QUESTIONS.md` para as pendências de produto que
bloqueiam algumas fases.

Legenda: `todo` (não iniciado) · `wip` (em andamento) · `done` (concluído e
verificado) · `n/a` (não se aplica a esta linha) · `blocked` (aguardando
decisão externa — ver OPEN_QUESTIONS).

## As 17 telas/fluxos (16 existentes + emergência da Fase 6.5)

| id | novo nome (ASCII) | rota | status | typecheck | lint | test | visual | a11y | backend | observações |
|---|---|---|---|---|---|---|---|---|---|---|
| A1 | LoginDoMotorista | `/` | todo | todo | todo | todo | baseline capturado | todo | login Fastify (token inseguro — Fase 7) | biometria só no app nativo (Fase 9) |
| A2 | EsqueciMinhaSenhaOtp | `/recuperar` | todo | todo | todo | todo | baseline capturado | todo | OTP fixo `123456` (dev only) | — |
| A3 | ChecklistDoVeiculo | `/checklist` | todo | todo | todo | todo | baseline capturado | todo | sem conceito de item crítico ainda | Fase 5 adiciona bloqueio por item crítico |
| B1 | RotaDoDiaHome | `/rota` | todo | todo | todo | todo | baseline capturado | todo | rota do dia via `/v1/routes/today` | — |
| B2 | DetalheDaParada | `/rota/parada/:stopId` | todo | todo | todo | todo | baseline capturado | todo | — | — |
| B3 | NavegacaoAteAParada | `/rota/parada/:stopId/navegar` | todo | todo | todo | todo | baseline capturado | todo | sem geolocalização real ainda | Fase 5 |
| B4 | ConfirmarEntrega | `/rota/parada/:stopId/entrega` | todo | todo | todo | todo | baseline capturado | todo | stepper mostra assinatura/foto sempre "concluído" (bug confirmado) | Fase 5 corrige |
| B5 | RegistrarFalha | `/rota/parada/:stopId/falha` | todo | todo | todo | todo | baseline capturado | todo | sem foto obrigatória real | Fase 5 |
| B6 | FimDeRota | `/rota/fim` | todo | todo | todo | todo | baseline capturado | todo | sem gatilho de navegação a partir de B1 no dispatcher atual | corrigir junto da Fase 3 |
| B7 | ChecklistDeRetorno | `/rota/retorno` | todo | todo | todo | todo | baseline capturado | todo | mesmo bug de item crítico que A3 | Fase 5 |
| C1 | HistoricoDeRotas | `/historico` | todo | todo | todo | todo | baseline capturado | todo | — | — |
| C2 | DetalheDeRotaConcluida | `/historico/:routeId` | todo | todo | todo | todo | baseline capturado | todo | — | — |
| D1 | Recibos | `/recibos` | todo | todo | todo | todo | baseline capturado | todo | — | — |
| D2 | DetalheDoReciboComAssinatura | `/recibos/:receiptId` | todo | todo | todo | todo | baseline capturado | todo | — | — |
| E1 | PerfilDoMotorista | `/perfil` | todo | todo | todo | todo | baseline capturado | todo | — | — |
| E2 | CentralDeSuporteEAjuda | `/suporte` | todo | todo | todo | todo | baseline capturado | todo | linha direta de suporte só — emergência é fluxo separado (E3) | — |
| E3 | AcionamentoDeEmergencia (NOVA — Fase 6.5) | a definir | todo | todo | todo | todo | n/a (tela nova) | todo | evento de domínio `emergencia.acionada` a criar | protocolo completo é pendência de produto — ver OPEN_QUESTIONS |

## Infraestrutura e fases transversais

| Item | Status | Observações |
|---|---|---|
| `npm install` | done | 180 pacotes, sem erro de instalação |
| `npm run build` (Vite) | done | build de produção passa, bundle 482KB JS / 53KB CSS (não minificado por tipo ainda — medir de novo após Fase 1/TS) |
| `npm run dev` (frontend+backend juntos) | done | confirmado: backend responde em `:8787/health`, frontend serve em `:5173` |
| `npm run test:server` | done | 2/2 testes de contrato passam (estado anterior à Fase 7) |
| Baseline visual (16 telas, 390×844) | done | `tests/visual/baseline/*.png`, gerado por `scripts/capture-baseline.mjs` |
| `scripts/visual-compare.mjs` | done | testado (self-diff = 0% em todas as 16 telas) |
| `docs/PATTERN_INVENTORY.md` | done | auditoria do design system existente |
| `docs/OPEN_QUESTIONS.md` | done | docs de produto/backend ausentes, geofence, OCR, Supabase, Expo/Capacitor, bundle id |
| TypeScript estrito | todo | Fase 1 |
| ESLint + Prettier | todo | Fase 1 |
| Vitest + RTL + vitest-axe | todo | Fase 1 |
| Husky + lint-staged + CI | todo | Fase 1 |
| `packages/core` (monorepo) | todo | Fase 2 — decisão de extrair agora vs. adiar para Fase 9 pendente de registro em DECISIONS.md |
| Remoção do `PageRuntime.jsx` (dispatcher por texto) | todo | Fase 3 |
| `/dev` fora de produção, `*` → 404 real | todo | Fase 3 |
| Design system componentizado (`components/ui`) | todo | Fase 4 |
| Offline-first (IndexedDB + outbox) | todo | Fase 5 |
| Assinatura/foto/geo reais | todo | Fase 5 |
| Checklist com item crítico bloqueando início de rota | todo | Fase 5 |
| Fluxo de emergência (E3) | todo | Fase 6.5 |
| Token HMAC assinado + verificado no Fastify | todo | **Fase 7 — falha de segurança confirmada, ainda não corrigida** |
| Hash de senha (bcrypt/argon2) | todo | Fase 7 |
| Backend Supabase (extensão do TMS) | blocked | Fase 8 — sem acesso ao projeto/schema do TMS (ver OPEN_QUESTIONS #4) |
| App nativo Expo/RN | blocked | Fase 9 — ADR Expo vs. Capacitor não confirmado pelo usuário (ver OPEN_QUESTIONS #5) |
| Assets de loja / submissão | blocked | Fase 10 — bundle identifier não confirmado (ver OPEN_QUESTIONS #6); submissão real requer conta do usuário |
| Deploy Vercel (PWA) | todo | Fase 11 |
| `REFACTOR_REPORT.md` | todo | Fase 12, ao final |

## Diagnóstico de segurança — status da correção

| Falha | Status | Onde |
|---|---|---|
| Token de sessão sem verificação de assinatura (forjável) | **não corrigido ainda** | `server/app.js:8-9` (`token()`/`decode()`) |
| Senha em texto puro no seed, comparação direta | **não corrigido ainda** | `server/seed.js:11`, `server/app.js:54` |
| `CORS_ORIGIN` default `*` | **não corrigido ainda** | `server/app.js:20` |
| Sem rate limiting em login/OTP | **não corrigido ainda** | `server/app.js` (rotas `/v1/auth/*`) |
| Token em `localStorage` (exposto a XSS) | decisão pendente (Fase 7/8) | `src/api/index.js:3` |

Estas correções são o objeto da Fase 7 e não foram feitas ainda nesta
sessão — a Fase 0 apenas confirmou, por leitura direta do código, que o
diagnóstico do prompt mestre está correto.
