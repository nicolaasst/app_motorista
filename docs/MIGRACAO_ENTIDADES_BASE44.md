# Migração de entidades — Base44 → Supabase compartilhado (TMS)

Status: **implementado** em `supabase/migrations/20260928100100_app_motorista_b_schema.sql` (colunas
conforme este documento) — **banco hospedado ainda não alterado**. Acréscimos da implementação: 23
tabelas no total (+ `app_motorista_config`, `app_motorista_arquivos`, `app_motorista_tentativas_login`),
partições de GPS no `public`; ver a tabela de ajustes em `docs/RBAC_RLS_APP_MOTORISTA.md`.

Documentos irmãos: `docs/RBAC_RLS_APP_MOTORISTA.md` (acesso),
`docs/ARQUITETURA_APP_MOTORISTA.md` (cliente, offline, arquivos, auth),
`docs/DECISIONS.md`, `docs/OPEN_QUESTIONS.md`.

Fontes: `base44/entities/*.jsonc` e uso real no código (commit `59aa58c`) × schema do projeto
Supabase `rcweqbvdkskjtzjgpsnl`, lido em 2026-09-25 (somente leitura: `information_schema`,
`pg_policies`, `pg_constraint`, `pg_proc`; 46 migrations, última `m1_agendamentos_acoes`).

## 1. Decisões confirmadas pelo responsável (2026-09-25)

| # | decisão |
|---|---|
| D1 | Prefixo `app_motorista_` para tabelas, funções e policies do app. |
| D2 | Dados específicos do app em tabelas próprias; **não duplicar** domínio que já existe no TMS. |
| D3 | Portal exclusivo `app-motorista`, com RLS restritiva por tenant **e** por motorista. |
| D4 | Arquivos no R2, registrados em `public.documents`. |
| D5 | Design atual preservado integralmente (`docs/DESIGN_TOKENS_APP.md`). |

## 2. O que o schema do TMS é de fato

1. **Tabelas do TMS são projeções de tela.** Colunas `*_label/_tom/_icone`, datas em `text`,
   coordenadas em `text` ou em % do mapa desenhado, paradas em `jsonb` dentro de
   `rotas_roteirizador.paradas`, chaves `id text`, sem FK entre rota, motorista e veículo.
   Regra aplicada daqui em diante: **o que o TMS já tem como entidade é referenciado (FK ou
   RPC), nunca copiado; o que o TMS só tem como texto de tela, e o app precisa como fato
   tipado, vira tabela `app_motorista_*` referenciando a projeção do TMS.**
2. **Tenant:** os dados operacionais (`motoristas_agregados`, `rotas_roteirizador`,
   `tms_veiculos`) estão no tenant **plataforma** (`NEXUSLOG`, `tenants.tipo = 'plataforma'`).
   Os tenants `cliente` são embarcadores (pedidos, etiquetas, chamados deles). Os motoristas
   pertencem ao tenant plataforma. Consequência de segurança em `docs/RBAC_RLS_APP_MOTORISTA.md` §2.
3. PKs do TMS são compostas `(tenant_id, id text)` ou `(tenant_id, codigo)`. As FKs daqui para
   o TMS são compostas e usam o `tenant_id` da própria linha.
4. `documents.entity_id` é `uuid` e `documents.r2_key` tem CHECK
   `r2_key like tenant_id || '/%'` → todas as tabelas novas usam **PK `uuid`**, para poderem ser
   `entity_id` de anexos.
5. Não existe tabela de telemetria bruta nem bucket de Storage. Existe a Edge Function
   `auth-hook-claims` (além da função SQL `custom_access_token_hook`) — ver OQ-01.

## 3. Convenções de todas as tabelas `app_motorista_*`

- `id uuid primary key default gen_random_uuid()` (exceções anotadas).
- `tenant_id uuid not null references public.tenants(id)`.
- `motorista_id uuid not null references public.app_motorista_perfis(user_id)` nas tabelas do
  motorista (**desnormalizado também nas filhas**, como `paradas` e `volumes`, para a RLS ser
  uma comparação de coluna, sem `EXISTS`; mantido por trigger a partir da rota).
- `created_at`/`updated_at timestamptz not null default now()` + trigger `set_updated_at()`
  (função que já existe no TMS); `deleted_at timestamptz` (soft delete, padrão do TMS).
- Datas/horas em `timestamptz`; coordenadas em `numeric(9,6)`; dinheiro em `numeric(12,2)`.
- Nomes de colunas em português (convenção do TMS). **Valores de enum idênticos aos do app**
  (`nao_iniciada`, `em_rota`, `bipado`...), em `text` + `CHECK` (padrão do TMS), para não
  haver tradução de valores no cliente — só renomeação de colunas (ver arquitetura §3).
- Tabelas com eventos vindos da fila offline têm `chave_idempotencia uuid unique`.
- Trigger `audit_registrar()` (já existe no TMS) nas tabelas com decisão de negócio: rotas,
  comprovantes, insucessos, checklists, recibos, contas bancárias, emergências.

## 4. Mapeamento entidade a entidade

Legenda: **TMS** = usa objeto existente do TMS · **NOVA** = tabela `app_motorista_*` ·
**LOCAL** = só no dispositivo · **REMOVIDA** = não migra.

| entidade Base44 | destino | tabela / objeto |
|---|---|---|
| `User` | TMS | `auth.users` + `public.users` (`portal='app-motorista'`, papel `motorista_terceiro`) |
| `DriverProfile` | NOVA | `app_motorista_perfis` → FK para `motoristas_agregados` |
| `DriverPreferences` | NOVA | `app_motorista_preferencias` |
| `Vehicle` | TMS | `tms_veiculos` (leitura via RPC; hodômetro atualizado por RPC) |
| `Route` | NOVA | `app_motorista_rotas` → FK para `rotas_roteirizador` e `tms_veiculos` |
| `Route.gps_track` | NOVA | `app_motorista_gps_pontos` (particionada) |
| `Stop` | NOVA | `app_motorista_paradas` |
| `Volume` | NOVA | `app_motorista_volumes` → referência a `etiquetas` |
| `DeliveryProof` | NOVA | `app_motorista_comprovantes` (+ projeção em `comprovantes_entrega`, fase posterior) |
| `FailureReport` | NOVA | `app_motorista_insucessos` |
| `VehicleChecklist` | NOVA | `app_motorista_checklists` |
| `RoadHazardReport` | NOVA | `app_motorista_alertas_via` |
| `Ticket` / `TicketMessage` | TMS | `tickets_atendimento` / `mensagens_ticket` + vínculo `app_motorista_chamados` |
| `Notification` | NOVA | `app_motorista_notificacoes` |
| `Faq` | NOVA | `app_motorista_faq` |
| `PersonalDocument` | NOVA + TMS | `app_motorista_documentos_pessoais` → arquivo em `documents` |
| `BankAccount` | NOVA | `app_motorista_contas_bancarias` |
| `Receipt` / `ReceiptItem` / `ReceiptRouteLink` | NOVA | `app_motorista_recibos` / `_recibo_itens` / `_recibo_rotas` |
| `SyncQueueItem` | LOCAL | fila no dispositivo (`offlineQueue.js`); no servidor, `app_motorista_operacoes` (registro de idempotência) |
| (Fase 3) emergência | NOVA | `app_motorista_emergencias` |
| arquivos (`UploadPrivateFile`) | TMS | `documents` + R2 |

Total: **20 tabelas novas** (1 particionada; inclui o registro de idempotência) e **nenhuma tabela do TMS duplicada**.

## 5. Tabelas novas — colunas

Colunas de convenção (§3: `id`, `tenant_id`, `created_at`, `updated_at`, `deleted_at`)
omitidas, salvo quando mudam. `→` indica FK. "app" é o nome do campo no Base44/UI.

### 5.1 `app_motorista_perfis` — DriverProfile · dado pessoal (LGPD)

PK `user_id uuid → auth.users(id) on delete cascade` (sem `id` próprio; 1:1 com a conta).

| coluna | tipo | app | nota |
|---|---|---|---|
| `user_id` | uuid PK | `user_id` | = `auth.uid()` do motorista |
| `motorista_agregado_id` | text | — | FK composta `(tenant_id, motorista_agregado_id) → motoristas_agregados(tenant_id, id)`, nullable até a central vincular |
| `nome_completo` | text not null | `full_name` | |
| `matricula` | text | `matricula` | `unique (tenant_id, matricula)` |
| `cpf` | text not null | `cpf` | só dígitos, `unique (tenant_id, cpf)`; o TMS só guarda `cpf_mascarado` |
| `cnh_numero`, `cnh_categoria` | text | `cnh_number`, `cnh_category` | ver OQ-05 (sobreposição com `motoristas_agregados`/`condutores`) |
| `cnh_validade` | date | `cnh_expires_at` | |
| `telefone` | text | `phone` | |
| `email_corporativo` | text | `email_corporate` | e-mail de login |
| `email_pessoal` | text | `email_personal` | |
| `avatar_documento_id` | uuid → documents | `avatar_url` | |
| `frota` | text | `fleet` | |
| `nivel` | text | `level` | |
| `sla_pct` | numeric(5,2) | `sla_pct` | calculado pelo TMS; o motorista não escreve |
| `situacao_cadastro` | text CHECK (`ativo`,`inativo`,`suspenso`) | `registration_status` | `inativo`/`suspenso` bloqueia claims (RBAC §3) |
| `endereco` | jsonb | `address` | |
| `contato_emergencia` | jsonb | `emergency_contact` | `{nome, parentesco, telefone}` |

### 5.2 `app_motorista_preferencias` — DriverPreferences

PK `user_id uuid → app_motorista_perfis(user_id)`.

| coluna | tipo | app |
|---|---|---|
| `app_navegacao` | text CHECK (`waze`,`google_maps`,`rotapro`) default `google_maps` | `default_nav_app` |
| `alertas_sonoros` | boolean default true | `sound_alerts` |
| `bipe_leitura` | boolean default true | `scan_beep` |
| `tema` | text CHECK (`system`,`light`,`dark`) default `system` | `theme` |
| `orientacao` | text CHECK (`automatica`,`retrato`,`paisagem_mapa`) default `automatica` | `orientation_pref` |
| `area_mapa_offline` | text | `offline_map_area` |
| `mapa_offline_mb` | numeric | `offline_map_mb` |
| `lembrar_login` | boolean default false | `remember_login` |

### 5.3 `app_motorista_rotas` — Route · auditada

| coluna | tipo | app | nota |
|---|---|---|---|
| `codigo` | text not null | `code` | `unique (tenant_id, codigo)` |
| `motorista_id` | uuid → perfis | `driver_id` | |
| `rota_roteirizador_id` | text | — | FK composta → `rotas_roteirizador(tenant_id, id)`: a rota planejada no TMS |
| `tms_veiculo_id` | text | `vehicle_id` | FK composta → `tms_veiculos(tenant_id, id)` |
| `data` | date not null | `date` | |
| `turno` | text CHECK (`manha`,`tarde`,`integral`) | `shift` | |
| `setor` | text | `sector` | |
| `bairros` | text[] | `neighborhoods` | |
| `paradas_previstas` | int | `planned_stops` | |
| `km_previsto` | numeric(8,1) | `planned_km` | |
| `previsao_fim` | timestamptz | `eta_end` | |
| `status` | text CHECK (`planejada`,`checklist_ok`,`em_operacao`,`concluida`,`retorno_ok`,`encerrada`) | `status` | transições só por RPC (máquina de estados, RBAC §5) |
| `iniciada_em`, `finalizada_em` | timestamptz | `started_at`, `finished_at` | |
| `odometro_inicial`, `odometro_final` | numeric(10,1) | `odometer_start/end` | |
| `foto_odometro_inicial_id`, `foto_odometro_final_id` | uuid → documents | `odometer_*_photo` | |
| `origem` | jsonb | `origin` | `{lat, lng, rotulo}` |
| `polyline` | text | `polyline` | polyline codificada (uma string, não array) |

Índice: `(motorista_id, data desc)` — todas as telas filtram por motorista e ordenam por data.
`gps_track` **não** é coluna: vai para `app_motorista_gps_pontos`.

### 5.4 `app_motorista_paradas` — Stop

| coluna | tipo | app | nota |
|---|---|---|---|
| `rota_id` | uuid → rotas on delete cascade | `route_id` | |
| `motorista_id` | uuid | — | desnormalizado da rota (trigger) |
| `sequencia` | int not null | `sequence` | `unique (rota_id, sequencia)` |
| `tipo` | text CHECK (`comercial`,`residencial`,`hospital`,`clinica`,`mercado`,`outro`) | `kind` | |
| `destinatario_nome` | text | `recipient_name` | |
| `destinatario_documento` | text | `doc_cnpj` | |
| `endereco`, `bairro`, `cidade`, `uf`, `cep` | text | `address_line`, `district`, `city`, `state`, `cep` | |
| `lat`, `lng` | numeric(9,6) | `lat`, `lng` | alvo do geofence |
| `janela_inicio`, `janela_fim` | timestamptz | `window_start/end` | |
| `contato_nome`, `contato_funcao`, `contato_telefone` | text | `contact_*` | |
| `instrucoes_acesso` | text | `access_instructions` | |
| `status` | text CHECK (`nao_iniciada`,`em_rota`,`em_atendimento`,`entregue`,`falha`,`reagendada`) | `status` | só por RPC |
| `chegada_em`, `finalizada_em`, `eta` | timestamptz | `arrived_at`, `finished_at`, `eta` | |
| `pedido_tenant_id`, `pedido_id` | uuid, text | — | referência ao `pedidos` do embarcador (**outro tenant**, por isso sem FK; ver OQ-06) |

### 5.5 `app_motorista_volumes` — Volume

| coluna | tipo | app | nota |
|---|---|---|---|
| `parada_id` | uuid → paradas | `stop_id` | |
| `rota_id` | uuid → rotas | `route_id` | |
| `motorista_id` | uuid | — | desnormalizado |
| `nf_numero`, `nfe_chave` | text | `nf_number`, `nfe_key` | |
| `etiqueta_tenant_id`, `etiqueta_codigo` | uuid, text | — | referência a `etiquetas` do embarcador (sem FK, outro tenant) |
| `rotulo`, `ean`, `codigo_volume` | text | `label`, `ean`, `vol_code` | `unique (rota_id, codigo_volume)` |
| `peso_kg` | numeric(10,3) | `weight_kg` | |
| `tipo` | text CHECK (`sensivel`,`seco`,`documento`) | `kind` | |
| `status_leitura` | text CHECK (`pendente`,`bipado`,`divergente`) default `pendente` | `scan_status` | |
| `lido_em` | timestamptz | `scanned_at` | |
| `lido_por` | uuid → auth.users | `scanned_by` | |
| `status_devolucao` | text CHECK (`none`,`devolver`,`devolvido`) default `none` | `return_status` | |
| `devolvido_em` | timestamptz | `returned_at` | |
| `doca_devolucao` | text | `return_dock` | |

### 5.6 `app_motorista_comprovantes` — DeliveryProof · auditada

| coluna | tipo | app | nota |
|---|---|---|---|
| `parada_id` | uuid → paradas | `stop_id` | `unique (parada_id) where deleted_at is null` |
| `rota_id`, `motorista_id` | uuid | — | |
| `recebedor_nome`, `recebedor_documento` | text | `receiver_name`, `receiver_doc` | |
| `recebedor_titular` | boolean | `receiver_is_holder` | |
| `recebedor_tipo` | text CHECK (`proprio_destinatario`,`conjuge_familiar`,`porteiro_portaria`,`recepcao_zelador`,`vizinho`,`funcionario_local`,`outro`) | `receiver_type` | |
| `recebedor_tipo_outro` | text | `receiver_type_other` | |
| `assinatura_documento_id` | uuid → documents | `signature_png` | PNG no R2, não base64 na linha |
| `assinatura_sha256` | text | `signature_hash` | **calculado no servidor** |
| `observacoes` | text (≤300) | `notes` | |
| `lat`, `lng`, `precisao_m` | numeric | `lat`, `lng`, `accuracy_m` | **posição do aparelho** (hoje o app grava a da parada — bug B-02) |
| `distancia_parada_m` | numeric(8,1) | — | calculado no servidor (haversine) |
| `dentro_geofence` | boolean | — | `distancia_parada_m <= raio` (Fase 3, OQ-03) |
| `entregue_em` | timestamptz | `delivered_at` | hora do aparelho |
| `recebido_em` | timestamptz default now() | — | hora do servidor (auditoria de sincronização atrasada) |
| `dispositivo` | jsonb | `device_info` | |
| `chave_idempotencia` | uuid unique | — | = id do item da fila |

Fotos: `documents` com `entity_table='app_motorista_comprovantes'`, `entity_id = id`.
`sync_status` do Base44 não é coluna: é estado local da fila.

### 5.7 `app_motorista_insucessos` — FailureReport · auditada

`parada_id`, `rota_id`, `motorista_id`; `motivo` text CHECK (`cliente_ausente`,
`endereco_nao_localizado`,`recusado`,`avaria`,`acesso_risco`,`outro`) (`reason`);
`observacoes` (`notes`); `tentativas_contato jsonb` (`contact_attempts`); `lat`, `lng`,
`precisao_m`, `distancia_parada_m`; `registrado_em` (`reported_at`); `recebido_em`;
`devolver_volumes boolean`; `chave_idempotencia uuid unique`. Fotos em `documents`.

### 5.8 `app_motorista_checklists` — VehicleChecklist · auditada

`rota_id`, `motorista_id`, `tms_veiculo_id`; `tipo` CHECK (`pre`,`retorno`) com
`unique (rota_id, tipo)`; `itens jsonb` (`[{key, label, ok, note}]`); `odometro_km`;
`foto_odometro_id → documents`; `declaracao_aceita boolean not null`; `supervisor_nome`,
`supervisor_matricula`; `concluido_em`; `assinatura_sha256` (servidor);
`chave_idempotencia uuid unique`.

### 5.9 `app_motorista_gps_pontos` — Route.gps_track

Particionada `by range (registrado_em)`, uma partição por mês.
PK `(id, registrado_em)`, `id bigint generated always as identity` (volume alto; não é
`entity_id` de anexo).

| coluna | tipo | nota |
|---|---|---|
| `tenant_id`, `motorista_id`, `rota_id` | uuid | |
| `registrado_em` | timestamptz not null | hora do aparelho; chave de partição |
| `lat`, `lng` | numeric(9,6) | |
| `velocidade_kmh`, `precisao_m`, `rumo_graus` | numeric | `{speed}` e dados do `useDriverTracking` |
| `recebido_em` | timestamptz default now() | |

`unique (rota_id, registrado_em)` — reenvio do mesmo ponto é ignorado (`on conflict do nothing`).
Sem `updated_at`/`deleted_at` (append-only). Retenção: OQ-07.

### 5.10 `app_motorista_alertas_via` — RoadHazardReport

`rota_id`, `motorista_id`; `tipo` CHECK (`transito`,`acidente`,`via_bloqueada`,`blitz`,`obra`,
`alagamento`,`risco`); `lat`, `lng`; `foto_documento_id → documents`; `observacoes`;
`reportado_em`; `chave_idempotencia uuid unique`.

### 5.11 `app_motorista_notificacoes` — Notification

`motorista_id`; `tipo` CHECK (`rota`,`recibo`,`chamado`,`alerta`,`sistema`); `titulo`,
`corpo`, `deep_link`; `lida_em timestamptz` (`read` = `lida_em is not null`). Escrita só por
triggers/RPCs do servidor. Índice `(motorista_id, created_at desc) where lida_em is null`.
Não confundir com `notification_log` do TMS (log de envio por canal) — ver OQ-08 para push.

### 5.12 `app_motorista_faq` — Faq

`categoria`, `pergunta`, `resposta`, `ordem int`. Por tenant, sem `motorista_id`.

### 5.13 `app_motorista_documentos_pessoais` — PersonalDocument · dado pessoal

`motorista_id`; `tipo` CHECK (`cnh`,`crlv`,`aso`); `titulo`, `subtitulo`; `valido_ate date`;
`documento_id → documents`; `enviado_em`. O `status` do app (`valido`/`vencendo`/`vencido`) é
**derivado** de `valido_ate` na leitura (depende de `now()`, não pode ser coluna gerada);
limite de "vencendo" = 30 dias (OQ-09).

### 5.14 `app_motorista_contas_bancarias` — BankAccount · dado sensível · auditada

`motorista_id`; `banco_codigo`, `banco_nome`, `agencia`, `conta`; `tipo_conta` CHECK
(`corrente`,`poupanca`); `pix_tipo` CHECK (`cpf`,`cnpj`,`celular`,`email`,`aleatoria`);
`pix_chave`; `principal boolean`; `situacao` CHECK (`ativa`,`pendente_aprovacao`,
`rejeitada`,`substituida`) (substitui `pending_change`); `alterada_em` (`changed_at`);
`aprovada_por uuid → auth.users`, `aprovada_em`.
`unique (motorista_id) where principal and situacao = 'ativa'`.

### 5.15 `app_motorista_recibos` — Receipt · auditada

| coluna | tipo | app |
|---|---|---|
| `codigo` | text, `unique (tenant_id, codigo)` | `code` |
| `motorista_id` | uuid | `driver_id` |
| `apuracao_frete_id` | text, FK composta → `apuracoes_frete_terceiros(tenant_id, id)`, nullable | — (liga ao financeiro do TMS) |
| `periodo_inicio`, `periodo_fim` | date | `period_start/end` |
| `quinzena` | smallint CHECK (1,2) | `fortnight` |
| `bruto`, `descontos_total`, `liquido` | numeric(12,2) | `gross`, `discounts_total`, `net` |
| `status` | text CHECK (`previsto`,`pendente_assinatura`,`em_contestacao`,`assinado`,`pago`) | `status` |
| `prazo_assinatura` | timestamptz | `sign_deadline` |
| `data_deposito` | date | `deposit_date` |
| `pago_em`, `pago_via` | timestamptz, text | `paid_at`, `paid_via` |
| `conta_snapshot` | jsonb | `bank_snapshot` |
| `assinado_em` | timestamptz | `signed_at` |
| `assinatura_documento_id` | uuid → documents | `signature_png` |
| `assinatura_sha256` | text | `signature_hash` (**servidor**, hoje é `btoa().slice()` no cliente — bug B-03) |
| `assinatura_lat`, `assinatura_lng` | numeric | `sign_lat/lng` |
| `assinatura_ip` | inet | `sign_ip` (lido do cabeçalho da requisição no servidor) |
| `pdf_documento_id` | uuid → documents | `pdf_url` |

### 5.16 `app_motorista_recibo_itens` — ReceiptItem

`recibo_id → recibos on delete cascade`; `grupo` CHECK (`ganho`,`desconto`); `rotulo`,
`detalhe`; `quantidade numeric`, `valor_unitario numeric(12,2)`, `valor numeric(12,2)`.

### 5.17 `app_motorista_recibo_rotas` — ReceiptRouteLink

PK `(recibo_id, rota_id)` → `recibos`, `rotas`; `data date`, `paradas_concluidas int`,
`sla_pct numeric(5,2)`.

### 5.18 `app_motorista_chamados` — vínculo motorista ↔ chamado do TMS

O chamado em si é o do TMS (`tickets_atendimento` + `mensagens_ticket`); esta tabela só
registra **de quem é** e o contexto do app (o TMS guarda o autor como texto em `aberto_por`).

PK `(tenant_id, ticket_codigo)`, FK composta → `tickets_atendimento(tenant_id, codigo)`;
`motorista_id`; `categoria_app` CHECK (`pagamento`,`mecanica`,`coleta_nfe`,`app_sync`,`outro`)
— `emergencia` **não** existe aqui (Fase 3); `rota_id`, `recibo_id` (nullable);
`chave_idempotencia uuid unique`.

Mapeamento de status TMS → app: `em_andamento`, `validacao_operacional`, `analise_financeira`,
`escalado` → `em_andamento`; `encerrado` → `fechado`. Chamado recém-aberto (sem resposta da
central) → `aberto`. `central_reply` do app = última mensagem com `autor_tipo = 'suporte'`.

### 5.19 `app_motorista_emergencias` — Fase 3 · auditada

`motorista_id`, `rota_id` (nullable); `tipo` CHECK (`acidente`,`mal_subito`,`roubo_assalto`,
`pane_local_risco`,`outro`); `lat`, `lng`, `precisao_m` (capturados no acionamento);
`acionada_em` (aparelho), `recebida_em default now()`; `status` CHECK (`aberta`,`reconhecida`,
`em_atendimento`,`encerrada`,`falso_alarme`); `reconhecida_por → auth.users`,
`reconhecida_em`, `encerrada_em`; `notas_central`; `chave_idempotencia uuid unique`.
Não passa pela fila de chamados nem pela de notificações (arquitetura §8).

### 5.20 `app_motorista_operacoes` — registro de idempotência

PK `chave uuid` (= id do item da fila offline); `tenant_id`, `motorista_id`; `operacao text`
(nome da RPC); `resultado jsonb`; `created_at`. Toda RPC de escrita consulta esta tabela
primeiro e devolve o `resultado` gravado se a chave já foi processada.
Retenção: 90 dias (OQ-07).

## 6. Objetos do TMS usados pelo app (sem cópia)

| objeto do TMS | uso | leitura | escrita |
|---|---|---|---|
| `tenants` | tenant do motorista (plataforma) | — | — |
| `users`, `roles` | vínculo da conta, papel `motorista_terceiro` | hook de claims | `admin_vincular_usuario` (central) |
| `motoristas_agregados` | cadastro operacional do motorista | FK de `perfis` | — |
| `rotas_roteirizador` | rota planejada | fonte para publicar a rota do app (RPC interna) | — |
| `tms_veiculos` | veículo da rota | RPC `app_motorista_meu_veiculo()` | `hodometro_km` via RPC de checklist, só se maior que o atual |
| `tickets_atendimento`, `mensagens_ticket` | chamados | RPCs do app | RPCs do app (mesma regra de negócio das RPCs `atendimento_*`) |
| `documents` | todos os anexos | RPC/Edge Function | Edge Function de upload |
| `apuracoes_frete_terceiros` | origem do recibo | FK de `recibos` | — |
| `audit_log` | trilha | — | trigger `audit_registrar()` |
| `leitura_auditada` + `ler_dado_sensivel()` | leitura interna de dados pessoais | — | novas linhas de configuração (RBAC §6) |

Projeções do TMS que **passarão a ser alimentadas** pelos fatos do app (fase posterior, fora
do escopo desta migração): `comprovantes_entrega`, `ordens_rastreio`, `torre_gps_veiculos`,
`torre_gps_alertas`, `motoristas_agregados.status_operacional`.

## 7. Removidos

- `SyncQueueItem` (tabela): estado local do aparelho.
- `User.role` (`admin`/`user` do Base44): substituído pelo RBAC do TMS.
- Campos `sync_status` de `DeliveryProof`/`FailureReport`: estado da fila, não do fato.
- `Route.gps_track` (array jsonb): vira `app_motorista_gps_pontos`.
- `signature_png` em base64 dentro da linha: vira PNG no R2 + `documents`.
