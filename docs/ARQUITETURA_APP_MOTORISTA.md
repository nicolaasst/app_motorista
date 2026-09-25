# Arquitetura — app do motorista (ngs-driver) sobre o Supabase do TMS

Status: **implementado** (frontend, Edge Functions, migrations e testes neste repositório) — banco hospedado **ainda não alterado** (ver `docs/OPERACAO_APP_MOTORISTA.md`).
Complementa `docs/MIGRACAO_ENTIDADES_BASE44.md` (dados) e `docs/RBAC_RLS_APP_MOTORISTA.md`
(acesso).

## 1. Visão geral

```
 Aparelho do motorista (React/Vite; PWA agora, casca nativa na Fase 4)
 ┌──────────────────────────────────────────────────────────────────────┐
 │ páginas (visual intocado) ─► src/api/app-motorista/* (mappers)        │
 │                               │ online                  │ offline    │
 │                               ▼                         ▼            │
 │                       supabase-js (sessão)     offlineQueue (fila +  │
 │                               ▲                 blobs no IndexedDB)  │
 │                               └────── syncEngine (reenvio) ◄─────────┘│
 └───────────────┬──────────────────────────────┬───────────────────────┘
                 │ PostgREST: SELECT com RLS     │ HTTPS
                 │ + RPC app_motorista_*         │ Edge Functions
                 ▼                               ▼
 ┌─────────────────────────── Supabase rcweqbvdkskjtzjgpsnl ────────────┐
 │ Auth (mesmo auth.users) ─ hook de claims (portal app-motorista)      │
 │ public.app_motorista_* (20 tabelas) ──FK──► tabelas do TMS            │
 │ documents ◄── app-motorista-arquivos (Edge) ──► Cloudflare R2         │
 │                app-motorista-login (Edge)                             │
 └──────────────────────────────────────────────────────────────────────┘
```

Princípios:
1. **Visual e contratos de UI intactos.** As páginas continuam recebendo objetos com os
   mesmos nomes de campo de hoje (`plate`, `recipient_name`, `scan_status`...). A tradução
   português ↔ inglês fica numa camada só (`src/api/app-motorista/mappers.js`).
2. **O servidor decide.** Hash de assinatura, geofence, transições de status, IP e
   idempotência são calculados nas RPCs, não no aparelho.
3. **Fail-closed.** O motorista não recebe o claim `tenant_id`; tudo que existe hoje no TMS
   nega acesso a ele por padrão (RBAC §2).

## 2. Autenticação

| fluxo | hoje (Base44) | Supabase |
|---|---|---|
| Login por CPF/matrícula | `DriverProfile.list()` **antes de autenticar** (baixa o cadastro de todos os motoristas para o aparelho e procura o CPF no cliente — bug B-01) + `loginViaEmailPassword` | Edge Function `app-motorista-login`: recebe `{identificador, senha}`, resolve CPF/matrícula → e-mail no servidor (`service_role`), chama `signInWithPassword` e devolve a sessão. Erro sempre genérico ("credenciais inválidas"), sem revelar se o CPF existe. Limite de tentativas por IP e por identificador (OQ-14). |
| Login por e-mail | `loginViaEmailPassword` | `supabase.auth.signInWithPassword` direto |
| Google | `loginWithProvider('google')` | **removido** (botão fora da tela): o TMS tirou o Google do escopo em 26/09; contas criadas por Google ficariam sem cadastro |
| Esqueci a senha (`/forgot`) | **simulação**: a tela de 3 passos (identificação → código → nova senha) aceita qualquer código de 6 dígitos e não chama backend (bug B-04) | mesma tela, mesmos 3 passos: (1) `resetPasswordForEmail` com o template de e-mail de recuperação mostrando o código `{{ .Token }}` (o identificador CPF/matrícula é resolvido pela Edge Function de login, rota `/recuperar`); (2) `verifyOtp({ email, token, type: 'recovery' })`; (3) `updateUser({ password })` |
| Redefinir senha por link | `ResetPassword.jsx` (**sem rota** no `App.jsx`) | desnecessário com o fluxo por código acima; remover (ou manter como destino de link, OQ-16) |
| Cadastro (`Register.jsx`) | **sem rota** no `App.jsx` | **removido**: motorista é cadastrado pela central (`app_motorista_vincular_motorista`) |
| Consentimento OAuth (`OAuthConsent.jsx`) | tela do servidor MCP do Base44, **sem rota** | **removida** (recurso da plataforma Base44) |
| Sessão / logout | `auth.me`, `logout` | `getSession`, `onAuthStateChange`, `signOut` |

`AuthContext` mantém o contrato que `App.jsx`/`ProtectedRoute` já usam:
`{ user, isAuthenticated, isLoadingAuth, authChecked, authError, logout, navigateToLogin }`,
com `authError.type ∈ {'auth_required','user_not_registered'}`. Regra: sessão válida **sem**
o claim `portal = 'app-motorista'` → `user_not_registered` (a tela
`UserNotRegisteredError` já existe).

Sessão no aparelho: `persistSession: true`, `autoRefreshToken: true`. Opção
"lembrar login" (`preferencias.lembrar_login`) decide se a sessão vai para `localStorage`
(padrão) ou `sessionStorage` (OQ-17).

## 3. Camada de dados no cliente

Arquivos novos:

```
src/api/supabaseClient.js          createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
src/api/app-motorista/mappers.js   linha do banco ⇄ objeto que a UI já usa
src/api/app-motorista/rotas.js     minhasRotas, rota, paradasDaRota, volumes...
src/api/app-motorista/entrega.js   confirmarEntrega, registrarInsucesso, biparVolume
src/api/app-motorista/turno.js     iniciarRota, concluirRota, encerrarTurno, meuVeiculo
src/api/app-motorista/perfil.js    contexto, atualizarPerfil, preferencias, documentos, contas
src/api/app-motorista/recibos.js   recibos, recibo, assinarRecibo, contestarRecibo
src/api/app-motorista/suporte.js   chamados, abrirChamado, faq, notificacoes, emergencia
src/api/app-motorista/arquivos.js  enviarArquivo, urlAssinada
```

Removidos: `src/api/base44Client.js`, `src/lib/app-params.js`, pasta `base44/`,
`@base44/sdk`, `@base44/vite-plugin` (e o plugin no `vite.config.js`).

As ~100 chamadas `base44.entities.*` nas 20 páginas/hooks passam a chamar essas funções, que
**devolvem os mesmos formatos** de hoje. Leitura: `select` com RLS (sem `.eq('motorista_id')`
obrigatório, mas mantido por clareza e uso de índice). Escrita: sempre `rpc()`.

Correções que a troca exige (hoje dependem de a RLS do Base44 filtrar por motorista):
`Stop.list(2000)`, `DeliveryProof.list(2000)`, `FailureReport.list(2000)` em `Analysis`,
`RouteHistory` e `RouteDetail` viram consultas filtradas pelas rotas do motorista, com
paginação. `Route.list(100)` em `ReceiptDetail` vira busca pelos `rota_id` do recibo.

## 4. Offline e sincronização

Mantém o desenho atual (`offlineQueue.js` + `syncEngine.js`): fila em `localStorage`, fotos
como blobs no IndexedDB (`idb`), duas fases (arquivos → registros), deduplicação por chave
lógica (`delivery:{parada}`), gatilhos em `online`, a cada 30 s e no início.

Mudanças:

| hoje | problema | desenho |
|---|---|---|
| `DeliveryProof.create` e depois `Stop.update` em duas chamadas | se a 2ª falha, o reenvio cria um **comprovante duplicado** | uma RPC atômica por evento, com `p_chave = item.id` (uuid gerado ao enfileirar); reenvio devolve o resultado gravado em `app_motorista_operacoes` |
| GPS: `Route.get` + concatena + `Route.update({gps_track})` | corrida entre aparelhos/abas; array cresce sem limite na linha da rota | `app_motorista_registrar_gps` em lotes ≤ 500, `on conflict do nothing` |
| reenvio a cada 30 s, sem espera crescente | martela o servidor com item que sempre falha | `proxima_tentativa_em = agora + min(5 s × 2^tentativas, 10 min)` com variação aleatória; erro de validação (4xx/`22023`/`42501`) → `status='rejeitado'`, fica visível para o motorista e não é reenviado sozinho |
| upload refeito se a fase 2 falhar | foto enviada 2× | `documento_id` salvo no item logo após o upload; a fase 1 pula itens que já têm |
| assinatura da entrega descartada (`signature_png: ""`) | **POD sem assinatura** (bug B-02) | a assinatura vira blob na fila como as fotos, é enviada ao R2 e vai como `p_assinatura_id` |
| `lat/lng` do comprovante = coordenadas **da parada** | prova de localização falsa; geofence impossível (bug B-02) | posição atual do aparelho (`geo.js`/`useDriverTracking`) + `precisao_m`; o servidor calcula a distância |

Tipos de item: `delivery`, `failure`, `scan`, `stop_status`, `checklist`, `gps`, `hazard`,
`emergency` (a emergência também tenta envio imediato; ver §8), `message`. Ordem de envio:
FIFO por rota; `gps` por último.

Critério de aceite (prompt): testes de unidade (Vitest) para fila + reenvio com espera
crescente + idempotência, com o Supabase simulado.

## 5. GPS e navegação

- `useDriverTracking` já filtra e agrupa (envio a cada 12 s ou por distância). Mantido;
  destino passa a ser `enqueueGpsPoints` → `app_motorista_registrar_gps`.
- Rastreio em segundo plano: no PWA, o navegador suspende o GPS com a tela bloqueada.
  Rastreio real em segundo plano exige a casca nativa (Fase 4, Expo/Capacitor), que também
  resolve câmera e leitura de código de barras nativas.
- **Roteamento (decidido):** Mapbox Directions (`driving-traffic`), o mesmo provedor que o
  TMS já adotou (`VITE_MAPBOX_PUBLIC_TOKEN`). A resposta tem o formato do OSRM, então só
  `src/lib/routing.js` mudou. O servidor de demonstração do OSRM fica só para desenvolvimento
  sem token (`src/lib/mapProvider.js`).
- Mapas (decidido): tiles do Mapbox (`streets-v12` / `dark-v11`) com a atribuição exigida;
  sem token, contingência nos tiles anteriores (OSM/Carto) para o mapa não ficar em branco.
  Mapas offline (`OfflineMaps.jsx`) continuam como estavam (tela de preferência).

## 6. Arquivos (R2 + `documents`)

Edge Function **`app-motorista-arquivos`** (`supabase/functions/`, `verify_jwt = true`):

| rota | entrada | faz |
|---|---|---|
| `POST /upload` | bytes do arquivo + cabeçalho `x-tipo` (finalidade) | confere claims (portal `app-motorista`) e cadastro ativo; descobre o tipo **real** pelos primeiros bytes (PNG/JPEG/WebP/PDF), aplica o limite da finalidade (assinatura ≤ 512 KB, PNG); calcula o SHA-256; grava no R2 com PUT feito **pelo servidor**; registra `documents` e `app_motorista_arquivos`. Devolve `{documentoId, sha256}` |
| `POST /download` | `{documentoId}` | só arquivo enviado pelo próprio motorista, ou PDF/documento ligado a recibo/documento pessoal dele; devolve GET pré-assinado (5 min) |

Mudança em relação ao desenho: o aparelho **não** recebe URL de escrita no R2. Os bytes
passam pela função para que o hash gravado como prova (assinatura de entrega e de recibo)
seja o dos bytes realmente armazenados — com PUT direto o servidor nunca veria o arquivo.
Fotos são reduzidas no aparelho para ≤ 1600 px antes do envio.

O assinador SigV4 é o do TMS (`_shared/arquivos/r2.ts`, copiado com referência de origem).
Segredos: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_DOCUMENTOS`
(os mesmos do TMS). As RPCs só aceitam anexos de `app_motorista_arquivos` do próprio
motorista, do tipo esperado e ainda não usados.

## 7. Onde fica o código do backend

Migrations, testes pgTAP e Edge Functions do app ficam **neste repositório**, em
`supabase/migrations/`, `supabase/tests/` e `supabase/functions/`, com prefixo de data
**posterior** à última migration do TMS (`20260927110000`). O banco é compartilhado, então
as migrations dos dois repositórios formam uma sequência só: antes de aplicar, é preciso
conferir `list_migrations` e combinar a ordem com o TMS (OQ-20). As mudanças em objetos
compartilhados (RBAC §4) ficam numa migration separada e pequena, para revisão pelo TMS.

## 8. Emergência (Fase 3)

- Acesso: botão fixo em Suporte e Perfil + atalho na Home durante a rota. Dois toques:
  "Emergência" → tela de confirmação com o tipo (acidente, mal súbito, roubo/assalto, pane em
  local de risco, outro) → "Acionar".
- No acionamento: captura `getCurrentPosition` (timeout 5 s; se falhar, usa a última posição
  do `useDriverTracking` e marca a precisão).
- Envio: tenta `app_motorista_acionar_emergencia` **imediatamente**; sem rede, entra na fila
  com prioridade máxima (vai antes de qualquer outro item) e mostra ao motorista o telefone da
  central (`tel:`) como caminho alternativo.
- Não usa `tickets_atendimento` nem `app_motorista_notificacoes`. A central vê as emergências
  pela tabela própria; o alerta ativo (Realtime ou envio por `notification_log` para o
  plantão de `automacao_niveis_plantao`) é decisão do TMS (OQ-21).
- `Support.jsx`: "Emergência" sai do array `CATEGORIES`.

## 9. Dependências da plataforma Base44 a remover

| dependência | onde | destino |
|---|---|---|
| `@base44/sdk`, `@base44/vite-plugin` | `package.json`, `vite.config.js`, `src/api/base44Client.js` | remover |
| imagens em `media.base44.com`: ícone 48px (`src/components/rp/Logo.jsx`) e 4 mascotes (`src/lib/illustrations.js`) | | baixar para `src/assets/` **antes** que o app saia do Base44 |
| `src/components/ui/image.jsx` + `image-helpers.js`: componente que redimensiona imagens reescrevendo a URL para o CDN do Base44/Wix; imagem padrão em `static.wixstatic.com` | | com as imagens locais, o componente vira um `<img>` simples (Vite já otimiza os assets) |
| `OAuthConsent.jsx` | página sem rota | remover |
| `base44/config.jsonc`, `base44/entities/` | — | remover depois de o schema estar em migration |
| `@stripe/*` | `package.json` (sem uso no código) | remover (perguntar antes, se houver plano de cobrança) |

## 10. Variáveis de ambiente (`.env.example`)

```
VITE_SUPABASE_URL=https://rcweqbvdkskjtzjgpsnl.supabase.co   # mesmo projeto do TMS
VITE_SUPABASE_ANON_KEY=                                     # mesma chave pública do TMS
VITE_ROUTING_PROVIDER_URL=                                  # OQ-18
VITE_MAP_TILES_URL=                                         # OQ-18
VITE_CENTRAL_TELEFONE=                                      # atalho de emergência/suporte
```

Sem `VITE_SUPABASE_URL`/`ANON_KEY`, o app mostra uma tela de configuração em vez de tela
branca (Fase 4).
