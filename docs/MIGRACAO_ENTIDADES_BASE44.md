# Migração de entidades — Base44 → Supabase compartilhado (TMS)

Status: **rascunho da Fase 1 — nenhuma migration criada.** Aguardando as decisões D1–D4
(fim do documento).

Fonte: `base44/entities/*.jsonc` (commit `59aa58c`) × schema real do projeto Supabase
`rcweqbvdkskjtzjgpsnl`, lido em 2026-09-25 via `information_schema`/`pg_policies` (46
migrations aplicadas, última `m1_agendamentos_acoes`). Somente leitura; nada foi alterado no banco.

## 1. O que o schema do TMS é de fato (e por que isso muda a Fase 1)

### 1.1 As tabelas do TMS são projeções de tela, não tabelas de domínio

As tabelas que o prompt sugere reaproveitar (`rotas_roteirizador`, `motoristas_agregados`,
`tms_veiculos`, `comprovantes_entrega`, `tickets_atendimento`...) foram criadas no cutover das
telas do TMS e guardam **o que a tela exibe**, não o fato de negócio:

- colunas de apresentação: `*_label`, `*_tom`, `*_icone`, `posicao`, `selecionado_padrao`;
- datas e horários como `text` (`comprovantes_entrega.data_hora`, `mensagens_ticket.horario`,
  `tickets_atendimento.aberto_em_label`);
- coordenadas como `text` (`comprovantes_entrega.coordenadas`) ou posição relativa no mapa
  desenhado (`torre_gps_veiculos.x_pct/y_pct`, `ordens_rastreio.map_x/map_y`);
- paradas de uma rota em **`jsonb`** dentro de `rotas_roteirizador.paradas` — não há tabela de
  paradas nem de volumes;
- chaves `id text` e referências por nome/placa em texto (`motorista_nome`, `veiculo_placa`),
  sem FK entre `rotas_roteirizador` ↔ `motoristas_agregados` ↔ `tms_veiculos`.

O app do motorista **escreve** eventos operacionais (bipagem de volume, chegada/saída de
parada, POD com assinatura e GPS, odômetro, trilha GPS) que precisam de tipos reais
(`timestamptz`, `numeric` lat/lng), FKs e idempotência. Gravar isso em colunas `*_label`
não é viável. Ler "as próprias viagens" também não: não há coluna que ligue uma rota a um
usuário de `auth.users`.

### 1.2 RBAC: `motorista_terceiro` existe, mas sem permissões e sem portal próprio

- O papel `motorista_terceiro` existe em `public.roles` com **`portal = interno` e zero
  permissões** (a auditoria dizia `tms.ver` e `rastreio.ver`; hoje `role_permissions` não tem
  nenhuma linha para ele — provavelmente removidas em `b0_6_matriz_perfis_por_setor`). Nenhum
  usuário tem esse papel hoje.
- `custom_access_token_hook` injeta `tenant_id`, `portal` e `user_role` a partir de
  `public.users`. `users_valida_portal_tenant` só aceita `portal = 'interno'` para o tenant de
  tipo `plataforma`, e `'portal-cliente'` para os demais.
- **Risco de segurança:** a policy de SELECT padrão de todas as tabelas de negócio é
  `tenant_id = jwt.tenant_id OR jwt.portal = 'interno'`. Um motorista cadastrado como está hoje
  (`portal = interno`) **leria todas as tabelas de todos os tenants** — financeiro, fiscal, RH
  etc. O app do motorista não pode entrar pelo portal `interno`.

### 1.3 Arquivos

`storage.buckets` está vazio. `public.documents` guarda `r2_key` (Cloudflare R2), com
`entity_table/entity_id`. O app gera fotos (POD, falha, odômetro, avaria de via, anexos de
chamado), assinaturas PNG e PDF de recibo: precisa de um destino decidido (D4).

### 1.4 GPS

Não existe tabela de telemetria/geolocalização bruta no TMS (`telemetria_gps`/`geolocalizacao`
não existem; `torre_gps_*` são projeções da tela da torre). `Route.gps_track` precisa de tabela
nova de pontos (`app_motorista_gps_pontos`), particionável por mês.

## 2. Mapeamento entidade a entidade (proposta)

Legenda: **(a)** usa tabela existente do TMS · **(b)** tabela nova `app_motorista_*` ·
**(c)** coluna/objeto dentro de tabela existente · **(x)** não migra.

| entidade Base44 | decisão | destino proposto | observação |
|---|---|---|---|
| `User` (`role`) | (x) | `auth.users` + `public.users` + `roles` | papel admin/user do Base44 é substituído pelo RBAC do TMS (`motorista_terceiro`). |
| `DriverProfile` | (b) | `app_motorista_perfis` (1:1 com `auth.users`) | tem CPF, CNH, endereço, contato de emergência → dado pessoal (LGPD). Guarda `motorista_agregado_id text` opcional para ligar ao cadastro do TMS (`motoristas_agregados`), que hoje é projeção sem `user_id`. Depende de D2. |
| `Vehicle` | (a)* | leitura de `tms_veiculos` por placa | *só leitura. O app usa `plate`, `brand_model`, `last_odometer_km`, `status`; `tms_veiculos` tem `placa`, `modelo`, `hodometro_km`, `status_operacional`. O app **não** atualiza hodômetro do TMS diretamente — grava em `app_motorista_checklists` e o TMS consome. |
| `Route` | (b) | `app_motorista_rotas` | domínio real da execução (status da máquina de estados, odômetros, horários). Referência à rota planejada: `rota_roteirizador_id text` → `rotas_roteirizador.id`. Sem `gps_track`/`polyline` jsonb (ver `app_motorista_gps_pontos`). Depende de D2. |
| `Route.gps_track` | (b) | `app_motorista_gps_pontos` (`rota_id, t, lat, lng, speed, accuracy`) | append-only, índice `(rota_id, t)`, candidata a particionamento mensal. |
| `Stop` | (b) | `app_motorista_paradas` | hoje as paradas do TMS estão em `rotas_roteirizador.paradas jsonb` (sem id estável garantido). Depende de D2. |
| `Volume` | (b) | `app_motorista_volumes` | bipagem/devolução. Chave natural: `nfe_key` + `vol_code`; liga a `etiquetas.codigo`/`pedidos.id` quando existir. |
| `DeliveryProof` | (b) + (a) | `app_motorista_comprovantes` (fonte) → projeta em `comprovantes_entrega` | `comprovantes_entrega` é a tela de POD do TMS (texto); o app grava o fato tipado e um trigger/rotina preenche a projeção. |
| `FailureReport` | (b) | `app_motorista_insucessos` | pode alimentar `ocorrencias_sac` do TMS via projeção (fora do escopo desta fase). |
| `VehicleChecklist` | (b) | `app_motorista_checklists` | `type pre/retorno`, `items jsonb`, odômetro + foto. |
| `RoadHazardReport` | (b) | `app_motorista_alertas_via` | só existe no app. Pode alimentar `torre_gps_alertas`. |
| `SyncQueueItem` | (x) | — | é estado local do dispositivo (IndexedDB, `offlineQueue.js`). Não vira tabela; a idempotência no servidor é feita por `idempotency_key` único nas tabelas de destino (padrão já usado em `event_log`). |
| `DriverPreferences` | (b) | `app_motorista_preferencias` (PK `user_id`) | preferências do app. |
| `Notification` | (b) | `app_motorista_notificacoes` | a caixa de entrada do motorista (lida/não lida, deep link). `notification_log` do TMS é **log de envio** (canal, tentativas), outro conceito. |
| `Ticket` | (a) | `tickets_atendimento` via RPCs `atendimento_abrir_chamado` / `atendimento_responder` / `atendimento_encerrar` | o TMS já tem o fluxo de chamados com RPC; o app deve usá-lo. Categoria `emergencia` **sai** daqui (Fase 3 → `app_motorista_emergencias`). Falta: coluna/relacionamento que identifique o motorista autor (hoje `aberto_por text`). |
| `TicketMessage` | (a) | `mensagens_ticket` (via `atendimento_responder`) | anexos via `documento_id` → `documents`. |
| `Faq` | (b) | `app_motorista_faq` | conteúdo; leitura para todos os motoristas do tenant. |
| `PersonalDocument` | (b) + (a) | `app_motorista_documentos_pessoais` → arquivo em `documents` | CNH/CRLV/ASO. Dado pessoal: seguir o padrão `leitura_auditada`/`ler_dado_sensivel` do TMS. |
| `BankAccount` | (b) | `app_motorista_contas_bancarias` | dado sensível (LGPD, `leitura_auditada`). Troca de conta com `pending_change` → aprovação do financeiro. |
| `Receipt` | (b) | `app_motorista_recibos` | recibo quinzenal do motorista agregado. Relaciona-se com `apuracoes_frete_terceiros`/`motoristas_fila_acerto` do financeiro, que são projeções — definir quem gera o recibo (provavelmente o financeiro do TMS escreve aqui). |
| `ReceiptItem` | (b) | `app_motorista_recibo_itens` | |
| `ReceiptRouteLink` | (b) | `app_motorista_recibo_rotas` | FK para `app_motorista_rotas`. |
| (novo, Fase 3) | (b) | `app_motorista_emergencias` | fluxo de emergência próprio. |

Todas as tabelas (b) seguem o padrão do TMS: `tenant_id uuid not null`, `created_at`,
`updated_at` (trigger `set_updated_at`), `deleted_at`, RLS habilitada com
`tenant_id = (auth.jwt()->>'tenant_id')::uuid` **mais** filtro por motorista
(`user_id = auth.uid()` ou via `app_motorista_perfis`) para o papel `motorista_terceiro`, e
leitura para os papéis internos que precisarem (`tms.ver`).

## 3. Decisões pendentes (bloqueiam a primeira migration)

- **D1 — Prefixo.** Confirmar `app_motorista_` (o prompt pede confirmação antes da primeira
  migration).
- **D2 — Fonte de verdade de rota/parada/volume.** As tabelas do TMS são projeções de tela sem
  FKs nem tipos (seção 1.1). Proposta: o app grava em tabelas de domínio novas
  (`app_motorista_rotas/paradas/volumes/comprovantes`) e o TMS passa a **ler/projetar** delas.
  Isso contraria a regra "não duplicar domínio" do prompt ao pé da letra, mas não há domínio
  normalizado a reaproveitar. Alternativa: normalizar primeiro o domínio de viagem no próprio
  TMS (tabelas sem prefixo, ex. `viagens`/`viagem_paradas`) — trabalho do repositório do TMS,
  não deste.
- **D3 — Portal do motorista.** Criar o portal `'app-motorista'` (ajustando
  `users_valida_portal_tenant`), com `motorista_terceiro` vinculado a ele e ao tenant da
  transportadora (não `plataforma`), para que a cláusula `portal = 'interno'` das policies nunca
  se aplique ao motorista. Também é preciso definir as permissões do papel (hoje vazio).
  Mexe em funções/policies compartilhadas com o TMS.
- **D4 — Armazenamento de arquivos.** Supabase Storage (bucket privado `app-motorista`, com RLS
  por pasta `tenant_id/user_id/`) ou o R2 que `documents.r2_key` já usa (exige Edge Function
  para URL assinada). Recomendação: registrar tudo em `documents` e usar o mesmo R2, para o TMS
  enxergar os anexos pelo caminho que já conhece.
