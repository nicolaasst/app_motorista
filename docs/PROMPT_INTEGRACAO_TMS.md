# PROMPT — Finalizar o App Motorista e integrá-lo ao TMS (sessão com os dois repositórios)

> Cole tudo abaixo da linha como primeira mensagem de uma sessão do Claude Code conectada a
> **`nicolaasst/Ngs_transportes`** (TMS) **e** **`nicolaasst/app_motorista`** (NGS Driver).
> Levantamento feito em 2026-10-05 sobre `app_motorista@main` (6e91608) e `Ngs_transportes@main` (6408b65).

---

## PAPEL

Você é engenheiro full-stack sênior (React, Supabase/Postgres, RLS, Edge Functions Deno,
offline-first). Vai **concluir** o App Motorista (NGS Driver) e **integrá-lo de ponta a ponta** ao
TMS (NGS Conect), que está na fase final de go-live. Os dois usam **o mesmo projeto Supabase**
(`rcweqbvdkskjtzjgpsnl`, `sa-east-1`), o mesmo `auth.users` e o mesmo bucket R2.

## REGRAS DE TRABALHO (valem para tudo)

1. **Leia antes de agir:** no TMS, `CLAUDE.md`, `docs/MATRIZ_PENDENCIAS_FINAIS.md`, `docs/OPEN_QUESTIONS.md`,
   `docs/GO_LIVE_CHECKLIST.md`, `docs/DESIGN_SYSTEM_NGS.md`; no app, `MIGRATION_REPORT.md`, `docs/ARQUITETURA_APP_MOTORISTA.md`,
   `docs/RBAC_RLS_APP_MOTORISTA.md`, `docs/MIGRACAO_ENTIDADES_BASE44.md`, `docs/OPERACAO_APP_MOTORISTA.md`,
   `docs/OPEN_QUESTIONS.md`, `docs/DECISIONS.md`. Em conflito, **o `CLAUDE.md` do TMS manda** no repositório do TMS.
2. **Banco hospedado só com a minha aprovação explícita.** Desenvolva e teste em Postgres local; não rode
   `apply_migration`, `execute_sql` de escrita, deploy de Edge Function nem mudança no Dashboard sem eu dizer "pode aplicar".
   Leitura no hospedado (`list_tables`, `list_migrations`, `select`) é livre.
3. **Padrão de banco do TMS** (o pgTAP `00032_b9_a_auditoria_catalogo` do TMS audita o catálogo inteiro): toda tabela com
   `tenant_id` tem RLS, `tenant_isolation_select` no padrão, `tenant_id not null → tenants(id)` como 1ª coluna de um índice,
   sem policy de DELETE/ALL, `authenticated` sem DELETE/TRUNCATE, funções `security definer` com `search_path` fixo, nada
   executável por `anon`, sem bloco `do $$` (corpo de função com `$fn$`). Toda tabela nova tem teste pgTAP.
4. **Não inventar vocabulário RBAC.** O motorista **não** recebe permissões `modulo.acao` (ver §1.2): o acesso dele é por
   portal + dono da linha. Operador interno usa permissões **existentes** (`tms.ver`, `tms.operar`, `rh.*`, `financeiro.*`,
   `atendimento.*`, `torre.ver`, `frota.*`).
5. **Não duplicar domínio.** O TMS normalizou motoristas, veículos, rotas, ocorrências e telemetria (§2). O app referencia
   essas tabelas; não recria.
6. **Design:** o visual do app **não muda** (tokens em `app_motorista/docs/DESIGN_TOKENS_APP.md`). No TMS siga o
   `DESIGN_SYSTEM_NGS.md` e o guardrail `scripts/check-design-tokens.mjs`.
7. **Pare e me pergunte** nos pontos marcados com ⛔. Para o resto, decida, registre em `docs/DECISIONS.md` do repositório
   afetado e siga.
8. Em cada lote: rode as verificações dos **dois** repositórios (§6) e só depois faça commit/push. Português nos textos.

---

## 1. ONDE CADA COISA ESTÁ HOJE

### 1.1 App Motorista (`app_motorista`, branch `main`) — código pronto, banco **não** aplicado

- Base44 removido por completo. React + Vite; camada de dados `src/api/app-motorista/` (leitura por RLS, escrita só por RPC);
  fila offline idempotente (`src/lib/offlineQueue.js`, `syncEngine.js`); emergência (`/emergency`); login por CPF/matrícula e
  recuperação de senha por código; mapas/rotas Mapbox (`src/lib/mapProvider.js`, `VITE_MAPBOX_PUBLIC_TOKEN`).
- **Migrations do app** (`supabase/migrations/`), nunca aplicadas em lugar nenhum além do Postgres local:
  `20260928100000_app_motorista_a_portal_e_claims.sql` (única que toca objetos do TMS), `…100100_b_schema` (23 tabelas
  `app_motorista_*` + partições de GPS), `…100200_c_rpc_motorista` (22 RPCs), `…100300_d_rpc_interno` (10 RPCs internas +
  `leitura_auditada`), `…100400_e_login`.
- **Edge Functions** (`supabase/functions/`): `app-motorista-login` (sem JWT, limite de tentativas) e `app-motorista-arquivos`
  (upload pelo servidor → R2 + `documents`, SHA-256, tipo pelos bytes; assinador SigV4 copiado do TMS). Não publicadas.
- **Testes:** `npm run lint`, `npm test` (Vitest, 11), `npm run build`, `npm run test:edge` (Deno, 15),
  `npm run test:db` → `supabase/tests/local/run.sh`: sobe as migrations + seed do TMS e as do app num Postgres local e roda
  o pgTAP **dos dois** (na época: 112 do app + 1000 do TMS, todos verdes). Precisa de Postgres 16+ com pgTAP
  (`apt-get install postgresql-16-pgtap`) e `TMS_DIR` apontando para o clone do TMS.
- Imagens da marca já no repositório (`src/assets/brand/*.png`, `public/icons/*`, `public/logo.png`).

### 1.2 Contrato de acesso já resolvido no app (responde a **Q-02 / I-01** do TMS)

- Portal novo **`app-motorista`**, só no tenant plataforma e só com o perfil `motorista_terceiro` (trigger
  `users_valida_portal_tenant` nos dois sentidos, também em `role_id`).
- O JWT do motorista **não** leva a claim `tenant_id`; leva `app_motorista_tenant_id`. Assim **todas** as policies e RPCs do
  TMS (que leem `jwt.tenant_id`) negam o motorista por padrão, inclusive tabelas futuras. pgTAP do app prova: motorista vê
  0 linhas em todas as tabelas do TMS.
- `motorista_terceiro` continua com **0 permissões** (correto: o acesso dele não é por vocabulário).
- Escrita do motorista só por RPC `security definer` (`app_motorista_*`), com idempotência (`p_chave`), máquina de estados,
  hash de assinatura, geofence e IP decididos no servidor.
- Dados pessoais do app (`app_motorista_perfis`, `_contas_bancarias`, `_documentos_pessoais`) sem grant para
  `authenticated`; interno lê por `ler_dado_sensivel` (3 linhas em `leitura_auditada`).

### 1.3 O que o TMS mudou depois que o app foi escrito (o app ainda aponta para as vitrines)

| domínio | antes (o app usa) | agora no TMS | o que fazer |
|---|---|---|---|
| motorista | `motoristas_agregados` (vitrine, "sem leitura") | **`motoristas`** (`tenant_id, id uuid`, CNH em data, status, RPCs `motorista_*`) — sem CPF (LGPD) | perfil do app passa a ter FK para `motoristas`; CNH vem de `motoristas`; CPF fica só no app |
| veículo | `tms_veiculos` (vitrine) + hodômetro nela | **`veiculos`** real (RPCs `veiculo_*`, `frota.*`), **sem hodômetro** | FK para `veiculos`; ⛔ decidir onde mora o hodômetro |
| rota | `rotas_roteirizador` (vitrine com `jsonb`) | **`rotas_planejadas`** + **`rotas_paradas`** (`uuid`, status `planejada→pronta|cancelada`, `motorista_nome`/`placa` em **texto**, volumes só como **contagem**) | FK da rota do app para `rotas_planejadas`; despacho TMS → app |
| GPS / torre | — | **`telemetria_posicoes`** (por placa, `fonte`, sem provedor; I-04) | o app vira a primeira fonte (`fonte = 'app_motorista'`) |
| ocorrência | `ocorrencias_sac` (vitrine) | **`ocorrencias`** + `ocorrencia_eventos` (protocolo `OC-AAAA-NNNNN`, tenant plataforma) | insucesso do app abre ocorrência |
| POD | `comprovantes_entrega` (A.12, auditada) | igual | projetar o comprovante do app |
| leitura auditada | `ler_dado_sensivel(tabela)` | + `ler_dado_sensivel(tabela, chave)` e coluna `leitura_auditada.chave_coluna` | conferir que os inserts do lote D continuam válidos |
| migrations | última do TMS era `20260927110000` | ~80 novas, última `20261005100000_dfe_provedor_focusnfe` | as do app (`20260928…`) cairiam no meio: **renomear** para depois da última |

---

## 2. LOTE 0 — Base comum e verificação (sem tocar no hospedado)

1. Clonar os dois repositórios lado a lado; instalar Postgres 16 + pgTAP; rodar `npm run test:db` do app com
   `TMS_DIR` = clone atual do TMS. **Esperado: quebra** em algum ponto, porque o schema do TMS mudou — liste o que quebrou.
2. Como as migrations do app **nunca foram aplicadas**, edite-as no lugar (não crie migrations de correção) e renomeie
   para timestamps **posteriores** à última do TMS (ex.: `20261006100000…100400`), mantendo a ordem A→E.
3. ⛔ **Dono do histórico de migrations (OQ-20 do app).** Recomendação: o app continua sendo a fonte das migrations
   `app_motorista_*`, e cada uma é copiada (mesmo nome) para `supabase/migrations/` do TMS por PR, para o histórico do banco
   compartilhado ficar num lugar só e o CI do TMS rodar o pgTAP do app. Confirme comigo antes de copiar.
4. Conferir no hospedado (leitura): o hook ativo em Authentication > Hooks é `public.custom_access_token_hook`; a Edge
   Function órfã `auth-hook-claims` ainda existe (I-09) — anotar para a limpeza do go-live.

## 3. LOTE 1 — Alinhar o app ao TMS normalizado (repositório do app)

1. **Motorista:** em `app_motorista_perfis`, trocar `motorista_agregado_id text` por `motorista_id uuid` com FK composta
   `(tenant_id, motorista_id) → motoristas(tenant_id, id)` e `on delete set null (motorista_id)`. CNH (número, categoria,
   validade) passa a ser lida de `motoristas` (remover as colunas duplicadas do perfil ou deixá-las só como cache —
   prefira remover). `app_motorista_contexto` devolve a CNH de `motoristas`. `app_motorista_vincular_motorista` recebe o
   `motorista_id` do cadastro do TMS (e valida que está `ativo`), além de e-mail e CPF.
2. **Veículo:** `tms_veiculo_id text` → `veiculo_id uuid` com FK para `veiculos`; `app_motorista_meu_veiculo` lê `veiculos`.
   ⛔ **Hodômetro:** `veiculos` não tem hodômetro. Opções: (a) acrescentar `hodometro_km` em `veiculos` (mudança no TMS,
   via migration revisada) e as RPCs de checklist só aumentam; (b) o hodômetro fica só nos checklists do app e a frota lê
   uma view `security_invoker`. Recomendo (a). Pare a vitrine `tms_veiculos` de ser escrita.
3. **Rota:** `rota_roteirizador_id text` → `rota_planejada_id uuid` com FK para `rotas_planejadas`.
   `app_motorista_publicar_rota` passa a aceitar a origem `rota_planejada_id` (§4.1).
4. Atualizar mappers (`src/api/app-motorista/mappers.js`), testes pgTAP `00100`/`00101`, `docs/MIGRACAO_ENTIDADES_BASE44.md`.
5. Pequenos acertos do app:
   - `public/manifest.json` aponta para `icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, mas os arquivos
     enviados são `icon-192x192.png`, `icon-512x512.png`, `maskable-icon-512x512.png`: alinhar os nomes no manifest;
     referenciar `apple-touch-icon.png` e `favicon-32x32.png` no `index.html` (hoje o favicon é o `logo.png` de 250 KB).
   - O lint do `Login.jsx` mudou para usar `<Logo variant="full">` — conferir que `npm run lint` segue limpo.

## 4. LOTE 2 — TMS → App (repositório do TMS)

1. **Despachar rota para o App Motorista** (o botão hoje "fora do modelo" no Roteirizador J.3):
   - ligar a rota ao motorista: `rotas_planejadas.motorista_id uuid → motoristas` (hoje é `motorista_nome` em texto) e
     `veiculo_id → veiculos` (hoje `placa` em texto) — mantenha os textos como rótulo se a tela usar;
   - RPC `rota_despachar_app(p_rota_id)` (`tms.operar`, operador interno, `security definer` com filtro de tenant à mão):
     exige rota `pronta`, motorista com acesso ao app (perfil `app_motorista_perfis` ativo ligado ao `motorista_id`), monta o
     payload a partir de `rotas_planejadas` + `rotas_paradas` e chama `app_motorista_publicar_rota`; registra quem despachou;
     republicar enquanto o motorista não iniciou é permitido (o app já trata);
   - ⛔ **Volumes:** `rotas_paradas` tem só a **contagem**. A bipagem do app precisa de códigos. Opções: (a) gerar
     volumes numerados por parada (`<codigo-rota>-<ordem>-<n>`) e a bipagem vira conferência por contagem; (b) ligar a
     parada a pedidos/etiquetas do embarcador (código da etiqueta/SSCC como `codigo_volume`, `nfe_chave` da NF) — exige o
     vínculo parada↔pedido que o Roteirizador ainda não tem ("importar remessa" fora do modelo). Recomendo (a) agora e (b)
     quando a importação de remessa existir.
   - Na tela J.3: botão "Disparar para o App Motorista" ligado à RPC, com estado (não despachada / despachada / em execução
     / concluída lido de `app_motorista_rotas`).
2. **Dar acesso ao app a partir do cadastro de motoristas (J.1):**
   - Edge Function `motorista-app-convite` (`service_role`, chamada por operador com `rh.editar`): cria/convida o usuário no
     Auth (`auth.admin.inviteUserByEmail`) e chama `app_motorista_vincular_motorista` com o `motorista_id`, CPF e matrícula;
   - CPF entra **só** no app (`app_motorista_perfis`, leitura auditada) — coerente com a decisão LGPD do TMS em `motoristas`;
   - ações na linha do motorista: "Dar acesso ao app", "Suspender acesso" (`app_motorista_definir_situacao`), indicador
     "tem acesso ao app".
3. **Configuração do app por tenant** (`app_motorista_salvar_config`): raio do geofence, telefone/WhatsApp da central,
   prazo de documento vencendo, retenção de GPS — tela de Parâmetros do Sistema ou bloco na tela do Roteirizador.
4. **Financeiro → recibo do motorista:** a partir de adiantamentos/acerto (`i2_o_adiantamentos_motorista`,
   `apuracoes_frete_terceiros`/custos por viagem), ação "Emitir recibo para o app" chamando `app_motorista_emitir_recibo`
   (`financeiro.lancar`) e "Marcar pago" (`app_motorista_marcar_recibo_pago`, `financeiro.conciliar`); cadastro de conta
   bancária (`app_motorista_cadastrar_conta`).
5. **FAQ do app** (`app_motorista_salvar_faq`, `atendimento.registrar`) dentro da Central de Atendimento.

## 5. LOTE 3 — App → TMS (fatos do app aparecendo nas telas do TMS)

1. **Posição → Torre GPS (resolve I-04 em parte):** trigger `after insert` em `app_motorista_gps_pontos` (ou dentro de
   `app_motorista_registrar_gps`) grava em `telemetria_posicoes` a última posição por placa com `fonte = 'app_motorista'`,
   com amostragem (no máximo 1 linha por placa a cada 30 s; GPS do app chega a cada ~12 s) e a placa do veículo da rota.
   A tela J.4 passa a mostrar os veículos em rota do app sem provedor externo.
2. **Insucesso → Ocorrência (K.1):** ao registrar insucesso, abrir `ocorrencias` (protocolo `OC-…`) com evento inicial,
   origem "App Motorista", motivo, rota/parada e, se houver, o pedido do embarcador. Ocorrência aberta pelo app não pode
   exigir `atendimento.registrar` do motorista: faça pela RPC do app (`security definer`), não pela RPC do operador.
3. **Comprovante → POD (A.12) e Rastreio (B.1):** quando a parada estiver ligada a pedido/etiqueta do embarcador (§4.1-b),
   projetar o comprovante do app em `comprovantes_entrega` **no tenant do embarcador** (é o portal do cliente que lê), com
   recebedor, coordenadas, distância/geofence e o hash; e atualizar o status da ordem em `ordens_rastreio`. Sem vínculo de
   pedido, a projeção não acontece (registre como pendência, não invente pedido).
4. **Emergência → Torre/Central de Alertas:** `app_motorista_emergencias` na Central de Alertas (`i2_be_central_alertas`) e
   na Torre, com ação de tratar (`app_motorista_tratar_emergencia`, `tms.operar`); alerta ativo por Realtime (habilitar a
   publicação só para essa tabela) e/ou WhatsApp pelo `notification_log` ao plantão — depende de I-03 (notificações).
5. **Chamados:** já entram na Central de Atendimento (mesma tabela, `aberto_por_cargo = 'Motorista'`, código `CH-…`). Só
   acrescentar filtro/etiqueta "Motorista" e, ao responder, gerar notificação no app (`app_motorista_notificar`).
6. **Checklists e odômetro** visíveis na Frota (detalhe do veículo) depois da decisão do §3.2.
7. **RH/LGPD:** perfis, documentos pessoais e contas bancárias do motorista só por `ler_dado_sensivel` (já configurado);
   anonimização para "exclusão de conta" (OQ-12 do app) ⛔ depende de validação jurídica — não implemente sem eu confirmar.

## 6. VERIFICAÇÃO (rode sempre os dois lados)

- **App:** `npm run lint && npm test && npm run build && npm run test:edge && npm run test:db` (com `TMS_DIR` no clone do TMS).
- **TMS:** a CI/rotina local do próprio TMS (`pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `supabase test db`
  ou o equivalente local, `node scripts/check-pgtap-coverage.mjs`, `node scripts/check-design-tokens.mjs`). Se o pgTAP do
  app passar a viver também no TMS (§2.3), ele roda lá também.
- Testes novos obrigatórios: despacho TMS→app (rota pronta vira rota do motorista certo; motorista sem acesso é recusado;
  republicação), projeções app→TMS (posição em `telemetria_posicoes` com amostragem; insucesso vira ocorrência; POD no
  tenant do embarcador só com pedido ligado), e regressão de isolamento (motorista continua vendo 0 linhas do TMS **incluindo
  as tabelas novas** `motoristas`, `veiculos`, `rotas_planejadas`, `rotas_paradas`, `telemetria_posicoes`, `ocorrencias`).

## 7. LOTE 4 — Go-live (⛔ cada passo no hospedado só com a minha aprovação)

1. Aplicar as migrations do app (renomeadas) no hospedado, na ordem, pelo mesmo caminho que o TMS usa; conferir
   `list_migrations` antes e depois; rodar os advisors de segurança e performance do Supabase depois.
2. Publicar `app-motorista-login` (`--no-verify-jwt`) e `app-motorista-arquivos`; segredos R2 já existem no TMS
   (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_DOCUMENTOS`).
3. Auth: template "Reset Password" com `{{ .Token }}` (recuperação por código), senha mínima 8, proteção contra senha vazada
   ligada (I-09), remover a Edge Function órfã `auth-hook-claims`, domínio do app nas Redirect URLs.
4. Mapbox: token público `pk.*` restrito às URLs do TMS **e** do app (`VITE_MAPBOX_PUBLIC_TOKEN` nos dois projetos Vercel).
5. Projeto Vercel do app: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (mesmas do TMS), `VITE_MAPBOX_PUBLIC_TOKEN`;
   `vercel.json` já tem SPA + cabeçalhos; depois de 1 semana sem violações, trocar `Content-Security-Policy-Report-Only` por
   `Content-Security-Policy`.
6. Rotinas mensais até haver `pg_cron`: partições de GPS, expurgo de GPS (180 dias) e de `app_motorista_operacoes` (90 dias)
   — `app_motorista/docs/OPERACAO_APP_MOTORISTA.md` §1.3. Se o TMS instalar `pg_cron` (I-03), agendar lá.
7. Limpeza do seed de demonstração do TMS (I-08, `scripts/golive/limpar-demonstracao.sql`): conferir que não apaga nada
   `app_motorista_*` de produção e que as FKs novas (`on delete set null`) não bloqueiam a limpeza.
8. Ensaio ponta a ponta com 1 motorista real: convite → login por CPF → rota despachada → checklist → bipagem → entrega com
   assinatura e foto (offline e online) → insucesso → GPS na Torre → ocorrência no K.1 → chamado respondido pela Central →
   recibo emitido, assinado e pago → emergência tratada pela Torre.

## 8. LOTE 5 — Apps nativos e lojas (⛔ não comece sem eu escolher)

O app é PWA hoje. Rastreio em segundo plano (tela bloqueada), câmera/leitor de código nativos e push exigem casca nativa.
Proponha **Capacitor** (reaproveita o mesmo build React/Vite, plugins de geolocalização em background, câmera e push) ×
**Expo/React Native** (reescrita de telas) com prós, contras e esforço, e espere minha escolha. Depois: ícones/splash a partir
de `public/icons`, política de privacidade cobrindo localização em segundo plano, câmera e dados pessoais (LGPD), builds de
teste e instruções de assinatura com as minhas contas de desenvolvedor. Nenhuma submissão às lojas sem minha aprovação.

## 9. DOCUMENTAÇÃO E ENTREGA

- No TMS: marcar **Q-02 / I-01 como decidido** (contrato em `app_motorista/docs/RBAC_RLS_APP_MOTORISTA.md`), atualizar
  I-02/I-04 na `MATRIZ_PENDENCIAS_FINAIS.md` conforme o que for entregue, registrar decisões em `docs/DECISIONS.md` (ou o
  arquivo de decisões do TMS) e a integração em `docs/ARQUITETURA_BACKEND_COMPLETA.md`.
- No app: atualizar `MIGRATION_REPORT.md`, `docs/OPEN_QUESTIONS.md` (OQ-04, OQ-20, OQ-21) e `docs/OPERACAO_APP_MOTORISTA.md`.
- PRs separados por repositório e por lote, cada um com o que mudou, como foi testado e o que ficou para depois.

## 10. PONTOS DE PARADA ⛔ (resumo)

1. Dono do histórico de migrations do banco compartilhado (§2.3).
2. Onde mora o hodômetro (§3.2).
3. Origem dos volumes para a bipagem (§4.1).
4. Anonimização LGPD na exclusão de conta (§5.7).
5. Qualquer escrita no projeto hospedado, deploy de Edge Function ou mudança no Dashboard (§7).
6. Casca nativa e qualquer passo de loja (§8).

## CRITÉRIOS DE ACEITE

- [ ] `npm run test:db` do app verde contra o schema **atual** do TMS; pgTAP do TMS verde com as migrations do app aplicadas.
- [ ] Nenhuma FK do app aponta para vitrine (`motoristas_agregados`, `tms_veiculos`, `rotas_roteirizador`).
- [ ] Rota planejada no TMS chega ao app do motorista certo pelo botão de despacho.
- [ ] Posição do app aparece na Torre GPS; insucesso vira ocorrência no K.1; emergência aparece e é tratada na Torre.
- [ ] Motorista continua vendo 0 linhas de qualquer tabela do TMS (inclusive as novas) e não executa RPC do TMS.
- [ ] Nada aplicado no hospedado sem a minha aprovação; Q-02/I-01 fechadas na documentação do TMS.

**Comece pelo Lote 0 e me mostre o que quebrou no teste cruzado antes de alterar qualquer migration.**
