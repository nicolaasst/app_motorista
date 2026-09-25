-- App Motorista, lote B — tabelas, RLS e grants.
--
-- Desenho: docs/MIGRACAO_ENTIDADES_BASE44.md (colunas) e
-- docs/RBAC_RLS_APP_MOTORISTA.md (acesso). Resumo das regras:
--   * Toda tabela segue o padrão do TMS auditado pelo pgTAP 00032: RLS ligada,
--     tenant_id not null → tenants(id), tenant_id primeira coluna de um índice,
--     policy `tenant_isolation_select` no padrão (aqui estreitada por permissão
--     do vocabulário existente), sem policy de INSERT/UPDATE/DELETE.
--   * O motorista (portal app-motorista, sem claim tenant_id) lê só as próprias
--     linhas pela policy `app_motorista_proprio_select`. Nunca escreve direto:
--     `authenticated` só tem SELECT; toda escrita é RPC security definer (lote C).
--   * Dado pessoal sensível (perfis, documentos pessoais, contas bancárias):
--     `authenticated` não tem nenhum privilégio na tabela. Motorista lê por RPC;
--     interno por public.ler_dado_sensivel (leitura auditada, lote D).
--   * FKs para projeções do TMS usam `on delete set null (coluna)`: o app nunca
--     impede o TMS de apagar/recriar as próprias linhas.
--
-- Sem bloco `do $$`; corpo de função com $fn$.

-- ==========================================================================
-- Funções de contexto usadas pelas policies
-- ==========================================================================

-- Tenant do motorista logado; null para qualquer outro portal.
create or replace function public.app_motorista_tenant()
returns uuid
language sql
stable
set search_path = ''
as $fn$
  select case when (select auth.jwt()) ->> 'portal' = 'app-motorista'
              then nullif((select auth.jwt()) ->> 'app_motorista_tenant_id', '')::uuid end;
$fn$;

-- Usuário interno (portal interno) com a permissão pedida no vocabulário do TMS.
create or replace function public.app_motorista_interno_pode(p_permissao text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select coalesce((select auth.jwt()) ->> 'portal' = 'interno', false)
     and exists (
       select 1
       from public.role_permissions rp
       join public.roles r on r.id = rp.role_id
       join public.permissions p on p.id = rp.permission_id
       where r.code = (select auth.jwt()) ->> 'user_role'
         and p.code = p_permissao);
$fn$;

revoke all on function public.app_motorista_tenant() from public, anon;
revoke all on function public.app_motorista_interno_pode(text) from public, anon;
grant execute on function public.app_motorista_tenant() to authenticated;
grant execute on function public.app_motorista_interno_pode(text) to authenticated;

-- ==========================================================================
-- Configuração por tenant
-- ==========================================================================
create table public.app_motorista_config (
  tenant_id uuid primary key references public.tenants(id),
  raio_geofence_m integer not null default 150 check (raio_geofence_m between 20 and 5000),
  dias_documento_vencendo integer not null default 30 check (dias_documento_vencendo between 1 and 180),
  retencao_gps_dias integer not null default 180 check (retencao_gps_dias between 30 and 1825),
  telefone_central text,
  whatsapp_central text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.app_motorista_config is
  'App Motorista: parâmetros por tenant (raio do geofence, prazo de documento vencendo, retenção de GPS, contatos da central).';

-- ==========================================================================
-- Motorista
-- ==========================================================================
create table public.app_motorista_perfis (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id),
  motorista_agregado_id text,
  nome_completo text not null check (length(btrim(nome_completo)) between 3 and 120),
  matricula text check (matricula ~ '^[0-9A-Za-z.-]{1,30}$'),
  cpf text not null check (cpf ~ '^[0-9]{11}$'),
  cnh_numero text,
  cnh_categoria text,
  cnh_validade date,
  telefone text,
  email_corporativo text,
  email_pessoal text,
  avatar_documento_id uuid references public.documents(id) on delete set null,
  frota text,
  nivel text,
  sla_pct numeric(5,2) check (sla_pct between 0 and 100),
  situacao_cadastro text not null default 'ativo' check (situacao_cadastro in ('ativo', 'inativo', 'suspenso')),
  endereco jsonb not null default '{}'::jsonb check (jsonb_typeof(endereco) = 'object'),
  contato_emergencia jsonb not null default '{}'::jsonb check (jsonb_typeof(contato_emergencia) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  foreign key (tenant_id, motorista_agregado_id)
    references public.motoristas_agregados(tenant_id, id) on delete set null (motorista_agregado_id),
  unique (tenant_id, cpf),
  unique (tenant_id, matricula)
);
comment on table public.app_motorista_perfis is
  'App Motorista: cadastro completo do motorista (1:1 com auth.users). Dado pessoal: sem grant para authenticated; motorista lê pela RPC app_motorista_contexto, interno por ler_dado_sensivel.';
create index app_motorista_perfis_tenant_idx on public.app_motorista_perfis (tenant_id, situacao_cadastro);

create table public.app_motorista_preferencias (
  user_id uuid primary key references public.app_motorista_perfis(user_id) on delete cascade,
  tenant_id uuid not null references public.tenants(id),
  app_navegacao text not null default 'google_maps' check (app_navegacao in ('waze', 'google_maps', 'rotapro')),
  alertas_sonoros boolean not null default true,
  bipe_leitura boolean not null default true,
  tema text not null default 'system' check (tema in ('system', 'light', 'dark')),
  orientacao text not null default 'automatica' check (orientacao in ('automatica', 'retrato', 'paisagem_mapa')),
  area_mapa_offline text,
  mapa_offline_mb numeric(8,1),
  lembrar_login boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.app_motorista_preferencias is 'App Motorista: preferências do aplicativo por motorista.';
create index app_motorista_preferencias_tenant_idx on public.app_motorista_preferencias (tenant_id);

-- ==========================================================================
-- Execução da rota
-- ==========================================================================
create table public.app_motorista_rotas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  codigo text not null check (length(codigo) between 1 and 40),
  motorista_id uuid not null references public.app_motorista_perfis(user_id),
  rota_roteirizador_id text,
  tms_veiculo_id text,
  data date not null,
  turno text check (turno in ('manha', 'tarde', 'integral')),
  setor text,
  bairros text[] not null default '{}',
  paradas_previstas integer check (paradas_previstas >= 0),
  km_previsto numeric(8,1) check (km_previsto >= 0),
  previsao_fim timestamptz,
  status text not null default 'planejada'
    check (status in ('planejada', 'checklist_ok', 'em_operacao', 'concluida', 'retorno_ok', 'encerrada')),
  iniciada_em timestamptz,
  finalizada_em timestamptz,
  odometro_inicial numeric(10,1) check (odometro_inicial >= 0),
  odometro_final numeric(10,1) check (odometro_final >= 0),
  foto_odometro_inicial_id uuid references public.documents(id) on delete set null,
  foto_odometro_final_id uuid references public.documents(id) on delete set null,
  origem jsonb,
  polyline text check (length(polyline) <= 200000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, codigo),
  foreign key (tenant_id, rota_roteirizador_id)
    references public.rotas_roteirizador(tenant_id, id) on delete set null (rota_roteirizador_id),
  foreign key (tenant_id, tms_veiculo_id)
    references public.tms_veiculos(tenant_id, id) on delete set null (tms_veiculo_id),
  check (odometro_final is null or odometro_inicial is null or odometro_final >= odometro_inicial)
);
comment on table public.app_motorista_rotas is
  'App Motorista: execução da rota pelo motorista (fato tipado). Referencia a rota planejada (rotas_roteirizador) e o veículo (tms_veiculos) do TMS.';
create index app_motorista_rotas_motorista_idx on public.app_motorista_rotas (tenant_id, motorista_id, data desc);
create index app_motorista_rotas_status_idx on public.app_motorista_rotas (tenant_id, status, data) where deleted_at is null;

create table public.app_motorista_paradas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  rota_id uuid not null references public.app_motorista_rotas(id) on delete cascade,
  motorista_id uuid not null references public.app_motorista_perfis(user_id),
  sequencia integer not null check (sequencia >= 0),
  tipo text not null default 'outro' check (tipo in ('comercial', 'residencial', 'hospital', 'clinica', 'mercado', 'outro')),
  destinatario_nome text not null,
  destinatario_documento text,
  endereco text,
  bairro text,
  cidade text,
  uf text check (uf ~ '^[A-Z]{2}$'),
  cep text,
  lat numeric(9,6) check (lat between -90 and 90),
  lng numeric(9,6) check (lng between -180 and 180),
  janela_inicio timestamptz,
  janela_fim timestamptz,
  contato_nome text,
  contato_funcao text,
  contato_telefone text,
  instrucoes_acesso text,
  status text not null default 'nao_iniciada'
    check (status in ('nao_iniciada', 'em_rota', 'em_atendimento', 'entregue', 'falha', 'reagendada')),
  chegada_em timestamptz,
  finalizada_em timestamptz,
  eta timestamptz,
  pedido_tenant_id uuid references public.tenants(id),
  pedido_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (rota_id, sequencia)
);
comment on table public.app_motorista_paradas is
  'App Motorista: paradas da rota. pedido_tenant_id/pedido_id apontam para o pedido do embarcador (outro tenant, sem FK composta).';
create index app_motorista_paradas_motorista_idx on public.app_motorista_paradas (tenant_id, motorista_id, rota_id);
create index app_motorista_paradas_rota_idx on public.app_motorista_paradas (rota_id, sequencia);

create table public.app_motorista_volumes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  parada_id uuid not null references public.app_motorista_paradas(id) on delete cascade,
  rota_id uuid not null references public.app_motorista_rotas(id) on delete cascade,
  motorista_id uuid not null references public.app_motorista_perfis(user_id),
  nf_numero text,
  nfe_chave text check (nfe_chave ~ '^[0-9]{44}$'),
  etiqueta_tenant_id uuid references public.tenants(id),
  etiqueta_codigo text,
  rotulo text,
  ean text,
  codigo_volume text not null check (length(codigo_volume) between 1 and 80),
  peso_kg numeric(10,3) check (peso_kg >= 0),
  tipo text not null default 'seco' check (tipo in ('sensivel', 'seco', 'documento')),
  status_leitura text not null default 'pendente' check (status_leitura in ('pendente', 'bipado', 'divergente')),
  lido_em timestamptz,
  lido_por uuid references auth.users(id),
  status_devolucao text not null default 'none' check (status_devolucao in ('none', 'devolver', 'devolvido')),
  devolvido_em timestamptz,
  doca_devolucao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (rota_id, codigo_volume)
);
comment on table public.app_motorista_volumes is 'App Motorista: volumes a entregar em cada parada (bipagem e devolução).';
create index app_motorista_volumes_motorista_idx on public.app_motorista_volumes (tenant_id, motorista_id, rota_id);
create index app_motorista_volumes_parada_idx on public.app_motorista_volumes (parada_id);

create table public.app_motorista_comprovantes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  parada_id uuid not null references public.app_motorista_paradas(id),
  rota_id uuid not null references public.app_motorista_rotas(id),
  motorista_id uuid not null references public.app_motorista_perfis(user_id),
  recebedor_nome text not null check (length(btrim(recebedor_nome)) between 2 and 120),
  recebedor_documento text check (length(recebedor_documento) <= 30),
  recebedor_titular boolean not null default false,
  recebedor_tipo text not null check (recebedor_tipo in ('proprio_destinatario', 'conjuge_familiar', 'porteiro_portaria',
    'recepcao_zelador', 'vizinho', 'funcionario_local', 'outro')),
  recebedor_tipo_outro text check (length(recebedor_tipo_outro) <= 60),
  assinatura_documento_id uuid references public.documents(id) on delete set null,
  assinatura_sha256 text check (assinatura_sha256 ~ '^[0-9a-f]{64}$'),
  observacoes text check (length(observacoes) <= 300),
  lat numeric(9,6) check (lat between -90 and 90),
  lng numeric(9,6) check (lng between -180 and 180),
  precisao_m numeric(8,1) check (precisao_m >= 0),
  distancia_parada_m numeric(10,1),
  dentro_geofence boolean,
  entregue_em timestamptz not null,
  recebido_em timestamptz not null default now(),
  dispositivo jsonb not null default '{}'::jsonb,
  chave_idempotencia uuid not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
comment on table public.app_motorista_comprovantes is
  'App Motorista: prova de entrega (POD). Assinatura e fotos no R2 via documents; hash, distância e geofence calculados no servidor.';
create unique index app_motorista_comprovantes_parada_uidx on public.app_motorista_comprovantes (parada_id) where deleted_at is null;
create index app_motorista_comprovantes_motorista_idx on public.app_motorista_comprovantes (tenant_id, motorista_id, rota_id);

create table public.app_motorista_insucessos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  parada_id uuid not null references public.app_motorista_paradas(id),
  rota_id uuid not null references public.app_motorista_rotas(id),
  motorista_id uuid not null references public.app_motorista_perfis(user_id),
  motivo text not null check (motivo in ('cliente_ausente', 'endereco_nao_localizado', 'recusado', 'avaria', 'acesso_risco', 'outro')),
  observacoes text check (length(observacoes) <= 500),
  tentativas_contato jsonb not null default '[]'::jsonb check (jsonb_typeof(tentativas_contato) = 'array'),
  lat numeric(9,6) check (lat between -90 and 90),
  lng numeric(9,6) check (lng between -180 and 180),
  precisao_m numeric(8,1) check (precisao_m >= 0),
  distancia_parada_m numeric(10,1),
  dentro_geofence boolean,
  registrado_em timestamptz not null,
  recebido_em timestamptz not null default now(),
  devolver_volumes boolean not null default false,
  chave_idempotencia uuid not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
comment on table public.app_motorista_insucessos is 'App Motorista: registro de insucesso de entrega (motivo, fotos, posição).';
create index app_motorista_insucessos_motorista_idx on public.app_motorista_insucessos (tenant_id, motorista_id, rota_id);
create index app_motorista_insucessos_parada_idx on public.app_motorista_insucessos (parada_id);

create table public.app_motorista_checklists (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  rota_id uuid not null references public.app_motorista_rotas(id),
  motorista_id uuid not null references public.app_motorista_perfis(user_id),
  tms_veiculo_id text,
  tipo text not null check (tipo in ('pre', 'retorno')),
  itens jsonb not null check (jsonb_typeof(itens) = 'array'),
  odometro_km numeric(10,1) not null check (odometro_km >= 0),
  foto_odometro_id uuid references public.documents(id) on delete set null,
  declaracao_aceita boolean not null check (declaracao_aceita),
  supervisor_nome text,
  supervisor_matricula text,
  concluido_em timestamptz not null,
  assinatura_sha256 text check (assinatura_sha256 ~ '^[0-9a-f]{64}$'),
  chave_idempotencia uuid not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (rota_id, tipo),
  foreign key (tenant_id, tms_veiculo_id)
    references public.tms_veiculos(tenant_id, id) on delete set null (tms_veiculo_id)
);
comment on table public.app_motorista_checklists is 'App Motorista: checklist do veículo antes (pre) e depois (retorno) da rota.';
create index app_motorista_checklists_motorista_idx on public.app_motorista_checklists (tenant_id, motorista_id, rota_id);

-- GPS: particionada por mês (partições app_motorista_gps_pontos_AAAA_MM, sem grants).
create table public.app_motorista_gps_pontos (
  tenant_id uuid not null references public.tenants(id),
  motorista_id uuid not null references public.app_motorista_perfis(user_id),
  rota_id uuid not null references public.app_motorista_rotas(id),
  registrado_em timestamptz not null,
  lat numeric(9,6) not null check (lat between -90 and 90),
  lng numeric(9,6) not null check (lng between -180 and 180),
  velocidade_kmh numeric(6,1) check (velocidade_kmh between 0 and 400),
  precisao_m numeric(8,1) check (precisao_m >= 0),
  rumo_graus numeric(5,1) check (rumo_graus >= 0 and rumo_graus < 360),
  recebido_em timestamptz not null default now(),
  primary key (rota_id, registrado_em)
) partition by range (registrado_em);
comment on table public.app_motorista_gps_pontos is
  'App Motorista: trilha GPS (append-only), particionada por mês (app_motorista_gps_pontos_AAAA_MM). Reenvio do mesmo ponto é ignorado (PK rota_id + registrado_em).';
create index app_motorista_gps_pontos_motorista_idx on public.app_motorista_gps_pontos (tenant_id, motorista_id, registrado_em desc);

create table public.app_motorista_alertas_via (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  rota_id uuid references public.app_motorista_rotas(id),
  motorista_id uuid not null references public.app_motorista_perfis(user_id),
  tipo text not null check (tipo in ('transito', 'acidente', 'via_bloqueada', 'blitz', 'obra', 'alagamento', 'risco')),
  lat numeric(9,6) not null check (lat between -90 and 90),
  lng numeric(9,6) not null check (lng between -180 and 180),
  foto_documento_id uuid references public.documents(id) on delete set null,
  observacoes text check (length(observacoes) <= 500),
  reportado_em timestamptz not null,
  chave_idempotencia uuid not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
comment on table public.app_motorista_alertas_via is 'App Motorista: ocorrências na via reportadas pelo motorista.';
create index app_motorista_alertas_via_idx on public.app_motorista_alertas_via (tenant_id, reportado_em desc);
create index app_motorista_alertas_via_motorista_idx on public.app_motorista_alertas_via (motorista_id);

-- ==========================================================================
-- Comunicação
-- ==========================================================================
create table public.app_motorista_notificacoes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  motorista_id uuid not null references public.app_motorista_perfis(user_id),
  tipo text not null check (tipo in ('rota', 'recibo', 'chamado', 'alerta', 'sistema')),
  titulo text not null check (length(titulo) <= 120),
  corpo text check (length(corpo) <= 1000),
  deep_link text check (deep_link ~ '^/[A-Za-z0-9/_?=&.-]*$'),
  lida_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
comment on table public.app_motorista_notificacoes is
  'App Motorista: caixa de entrada do motorista. Escrita só pelo servidor. (notification_log do TMS é outro conceito: log de envio por canal.)';
create index app_motorista_notificacoes_motorista_idx on public.app_motorista_notificacoes (tenant_id, motorista_id, created_at desc);
create index app_motorista_notificacoes_nao_lidas_idx on public.app_motorista_notificacoes (motorista_id) where lida_em is null and deleted_at is null;

create table public.app_motorista_faq (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  categoria text not null,
  pergunta text not null check (length(pergunta) <= 300),
  resposta text not null check (length(resposta) <= 4000),
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
comment on table public.app_motorista_faq is 'App Motorista: perguntas frequentes da central de apoio, por tenant.';
create index app_motorista_faq_tenant_idx on public.app_motorista_faq (tenant_id, ordem);

create table public.app_motorista_chamados (
  tenant_id uuid not null references public.tenants(id),
  ticket_codigo text not null,
  motorista_id uuid not null references public.app_motorista_perfis(user_id),
  categoria_app text not null check (categoria_app in ('pagamento', 'mecanica', 'coleta_nfe', 'app_sync', 'outro')),
  rota_id uuid references public.app_motorista_rotas(id),
  recibo_id uuid,
  chave_idempotencia uuid not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, ticket_codigo),
  foreign key (tenant_id, ticket_codigo) references public.tickets_atendimento(tenant_id, codigo)
);
comment on table public.app_motorista_chamados is
  'App Motorista: de quem é cada chamado. O chamado em si é o do TMS (tickets_atendimento/mensagens_ticket), atendido na Central de Atendimento.';
create index app_motorista_chamados_motorista_idx on public.app_motorista_chamados (tenant_id, motorista_id, created_at desc);

create table public.app_motorista_emergencias (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  motorista_id uuid not null references public.app_motorista_perfis(user_id),
  rota_id uuid references public.app_motorista_rotas(id),
  tipo text not null check (tipo in ('acidente', 'mal_subito', 'roubo_assalto', 'pane_local_risco', 'outro')),
  lat numeric(9,6) check (lat between -90 and 90),
  lng numeric(9,6) check (lng between -180 and 180),
  precisao_m numeric(8,1) check (precisao_m >= 0),
  acionada_em timestamptz not null,
  recebida_em timestamptz not null default now(),
  status text not null default 'aberta' check (status in ('aberta', 'reconhecida', 'em_atendimento', 'encerrada', 'falso_alarme')),
  reconhecida_por uuid references auth.users(id),
  reconhecida_em timestamptz,
  encerrada_em timestamptz,
  notas_central text check (length(notas_central) <= 2000),
  chave_idempotencia uuid not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
comment on table public.app_motorista_emergencias is
  'App Motorista: acionamento de emergência — fluxo próprio, fora da fila de chamados e de notificações.';
create index app_motorista_emergencias_abertas_idx on public.app_motorista_emergencias (tenant_id, status, acionada_em desc);
create index app_motorista_emergencias_motorista_idx on public.app_motorista_emergencias (motorista_id);

-- ==========================================================================
-- Pessoal e financeiro
-- ==========================================================================
create table public.app_motorista_documentos_pessoais (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  motorista_id uuid not null references public.app_motorista_perfis(user_id),
  tipo text not null check (tipo in ('cnh', 'crlv', 'aso')),
  titulo text not null,
  subtitulo text,
  valido_ate date,
  documento_id uuid references public.documents(id) on delete set null,
  enviado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
comment on table public.app_motorista_documentos_pessoais is
  'App Motorista: CNH/CRLV/ASO do motorista. Dado pessoal: sem grant para authenticated.';
create index app_motorista_documentos_pessoais_idx on public.app_motorista_documentos_pessoais (tenant_id, motorista_id, valido_ate);

create table public.app_motorista_contas_bancarias (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  motorista_id uuid not null references public.app_motorista_perfis(user_id),
  banco_codigo text not null check (banco_codigo ~ '^[0-9]{3}$'),
  banco_nome text not null,
  agencia text not null check (agencia ~ '^[0-9]{1,6}(-[0-9Xx])?$'),
  conta text not null check (conta ~ '^[0-9]{1,15}(-[0-9Xx])?$'),
  tipo_conta text not null check (tipo_conta in ('corrente', 'poupanca')),
  pix_tipo text check (pix_tipo in ('cpf', 'cnpj', 'celular', 'email', 'aleatoria')),
  pix_chave text check (length(pix_chave) <= 140),
  principal boolean not null default false,
  situacao text not null default 'pendente_aprovacao'
    check (situacao in ('ativa', 'pendente_aprovacao', 'rejeitada', 'substituida')),
  alterada_em timestamptz not null default now(),
  aprovada_por uuid references auth.users(id),
  aprovada_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check ((pix_tipo is null) = (pix_chave is null))
);
comment on table public.app_motorista_contas_bancarias is
  'App Motorista: conta para pagamento do motorista. Troca exige aprovação do financeiro. Dado sensível: sem grant para authenticated.';
create unique index app_motorista_contas_bancarias_principal_uidx
  on public.app_motorista_contas_bancarias (motorista_id) where principal and situacao = 'ativa' and deleted_at is null;
create unique index app_motorista_contas_bancarias_pendente_uidx
  on public.app_motorista_contas_bancarias (motorista_id) where situacao = 'pendente_aprovacao' and deleted_at is null;
create index app_motorista_contas_bancarias_idx on public.app_motorista_contas_bancarias (tenant_id, motorista_id);

create table public.app_motorista_recibos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  codigo text not null,
  motorista_id uuid not null references public.app_motorista_perfis(user_id),
  apuracao_frete_id text,
  periodo_inicio date not null,
  periodo_fim date not null,
  quinzena smallint check (quinzena in (1, 2)),
  bruto numeric(12,2) not null check (bruto >= 0),
  descontos_total numeric(12,2) not null default 0 check (descontos_total >= 0),
  liquido numeric(12,2) not null,
  status text not null default 'previsto'
    check (status in ('previsto', 'pendente_assinatura', 'em_contestacao', 'assinado', 'pago')),
  prazo_assinatura timestamptz,
  data_deposito date,
  pago_em timestamptz,
  pago_via text,
  conta_snapshot jsonb,
  assinado_em timestamptz,
  assinatura_documento_id uuid references public.documents(id) on delete set null,
  assinatura_sha256 text check (assinatura_sha256 ~ '^[0-9a-f]{64}$'),
  assinatura_lat numeric(9,6) check (assinatura_lat between -90 and 90),
  assinatura_lng numeric(9,6) check (assinatura_lng between -180 and 180),
  assinatura_ip inet,
  pdf_documento_id uuid references public.documents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, codigo),
  foreign key (tenant_id, apuracao_frete_id)
    references public.apuracoes_frete_terceiros(tenant_id, id) on delete set null (apuracao_frete_id),
  check (periodo_fim >= periodo_inicio),
  check (liquido = bruto - descontos_total),
  check (status not in ('assinado', 'pago') or (assinado_em is not null and assinatura_sha256 is not null))
);
comment on table public.app_motorista_recibos is
  'App Motorista: recibo quinzenal do motorista. Emitido pelo financeiro; assinado pelo motorista por RPC (hash e IP no servidor).';
create index app_motorista_recibos_motorista_idx on public.app_motorista_recibos (tenant_id, motorista_id, periodo_inicio desc);

create table public.app_motorista_recibo_itens (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  recibo_id uuid not null references public.app_motorista_recibos(id) on delete cascade,
  motorista_id uuid not null references public.app_motorista_perfis(user_id),
  grupo text not null check (grupo in ('ganho', 'desconto')),
  rotulo text not null,
  detalhe text,
  quantidade numeric(10,2),
  valor_unitario numeric(12,2),
  valor numeric(12,2) not null check (valor >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.app_motorista_recibo_itens is 'App Motorista: linhas de ganho e desconto do recibo.';
create index app_motorista_recibo_itens_idx on public.app_motorista_recibo_itens (tenant_id, motorista_id, recibo_id);

create table public.app_motorista_recibo_rotas (
  tenant_id uuid not null references public.tenants(id),
  recibo_id uuid not null references public.app_motorista_recibos(id) on delete cascade,
  rota_id uuid not null references public.app_motorista_rotas(id),
  motorista_id uuid not null references public.app_motorista_perfis(user_id),
  data date not null,
  paradas_concluidas integer not null default 0 check (paradas_concluidas >= 0),
  sla_pct numeric(5,2) check (sla_pct between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (recibo_id, rota_id)
);
comment on table public.app_motorista_recibo_rotas is 'App Motorista: rotas que compõem o recibo.';
create index app_motorista_recibo_rotas_idx on public.app_motorista_recibo_rotas (tenant_id, motorista_id, recibo_id);

-- ==========================================================================
-- Arquivos enviados pelo motorista (metadado do app sobre public.documents)
-- ==========================================================================
-- A Edge Function app-motorista-arquivos recebe os bytes, confere o tipo real
-- (assinatura de bytes), calcula o SHA-256, grava no R2 e registra aqui com
-- service_role. As RPCs só aceitam anexos desta tabela, do próprio motorista,
-- ainda não vinculados — e copiam o hash daqui (nunca do cliente).
create table public.app_motorista_arquivos (
  documento_id uuid primary key references public.documents(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id),
  motorista_id uuid not null references public.app_motorista_perfis(user_id),
  tipo text not null check (tipo in ('assinatura_entrega', 'foto_entrega', 'foto_insucesso', 'foto_odometro',
    'avatar', 'documento_pessoal', 'anexo_chamado', 'foto_alerta', 'assinatura_recibo')),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  mime_type text not null,
  tamanho_bytes integer not null check (tamanho_bytes > 0),
  vinculado_a text,
  vinculado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.app_motorista_arquivos is
  'App Motorista: arquivos enviados pelo motorista (hash SHA-256 calculado no servidor). Escrita só pela Edge Function (service_role).';
create index app_motorista_arquivos_motorista_idx on public.app_motorista_arquivos (tenant_id, motorista_id, created_at desc);

-- ==========================================================================
-- Idempotência e controle de login
-- ==========================================================================
create table public.app_motorista_operacoes (
  chave uuid primary key,
  tenant_id uuid not null references public.tenants(id),
  motorista_id uuid not null references public.app_motorista_perfis(user_id),
  operacao text not null,
  resultado jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
comment on table public.app_motorista_operacoes is
  'App Motorista: registro de idempotência — a chave é o id do item da fila offline. Reenvio devolve o resultado gravado. Só RPC; retenção 90 dias.';
create index app_motorista_operacoes_idx on public.app_motorista_operacoes (tenant_id, created_at);

create table public.app_motorista_tentativas_login (
  id bigint generated always as identity primary key,
  chave text not null,
  ip inet,
  sucesso boolean not null,
  created_at timestamptz not null default now()
);
comment on table public.app_motorista_tentativas_login is
  'App Motorista: tentativas de login por CPF/matrícula (limite de tentativas da Edge Function app-motorista-login). chave = SHA-256 do identificador; nunca o CPF em claro. Só service_role.';
create index app_motorista_tentativas_login_idx on public.app_motorista_tentativas_login (chave, created_at desc);
create index app_motorista_tentativas_login_ip_idx on public.app_motorista_tentativas_login (ip, created_at desc);

-- ==========================================================================
-- Triggers: updated_at, desnormalização de dono, auditoria
-- ==========================================================================
create trigger set_updated_at before update on public.app_motorista_config for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.app_motorista_perfis for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.app_motorista_preferencias for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.app_motorista_rotas for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.app_motorista_paradas for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.app_motorista_volumes for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.app_motorista_comprovantes for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.app_motorista_insucessos for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.app_motorista_checklists for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.app_motorista_alertas_via for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.app_motorista_notificacoes for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.app_motorista_faq for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.app_motorista_chamados for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.app_motorista_emergencias for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.app_motorista_documentos_pessoais for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.app_motorista_contas_bancarias for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.app_motorista_recibos for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.app_motorista_recibo_itens for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.app_motorista_recibo_rotas for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.app_motorista_arquivos for each row execute function public.set_updated_at();

-- Paradas/volumes/itens herdam tenant e motorista do pai: a RLS por motorista
-- nunca depende do que o chamador informou.
create or replace function public.app_motorista_herda_dono()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if tg_table_name in ('app_motorista_paradas', 'app_motorista_volumes') then
    select r.tenant_id, r.motorista_id into new.tenant_id, new.motorista_id
    from public.app_motorista_rotas r where r.id = new.rota_id;
  elsif tg_table_name in ('app_motorista_recibo_itens', 'app_motorista_recibo_rotas') then
    select r.tenant_id, r.motorista_id into new.tenant_id, new.motorista_id
    from public.app_motorista_recibos r where r.id = new.recibo_id;
  end if;
  if new.motorista_id is null then
    raise exception '% sem registro pai', tg_table_name using errcode = 'foreign_key_violation';
  end if;
  -- `if` aninhado: o PL/pgSQL não garante curto-circuito, e paradas não têm parada_id.
  if tg_table_name = 'app_motorista_volumes' then
    if not exists (select 1 from public.app_motorista_paradas p where p.id = new.parada_id and p.rota_id = new.rota_id) then
      raise exception 'volume: a parada não pertence à rota' using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$fn$;
revoke all on function public.app_motorista_herda_dono() from public, anon, authenticated;

create trigger app_motorista_herda_dono before insert or update of rota_id on public.app_motorista_paradas
  for each row execute function public.app_motorista_herda_dono();
create trigger app_motorista_herda_dono before insert or update of rota_id, parada_id on public.app_motorista_volumes
  for each row execute function public.app_motorista_herda_dono();
create trigger app_motorista_herda_dono before insert or update of recibo_id on public.app_motorista_recibo_itens
  for each row execute function public.app_motorista_herda_dono();
create trigger app_motorista_herda_dono before insert or update of recibo_id on public.app_motorista_recibo_rotas
  for each row execute function public.app_motorista_herda_dono();

-- Rota reatribuída a outro motorista: filhas acompanham.
create or replace function public.app_motorista_propaga_dono_rota()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  update public.app_motorista_paradas set motorista_id = new.motorista_id where rota_id = new.id;
  update public.app_motorista_volumes set motorista_id = new.motorista_id where rota_id = new.id;
  return new;
end;
$fn$;
revoke all on function public.app_motorista_propaga_dono_rota() from public, anon, authenticated;

create trigger app_motorista_propaga_dono after update of motorista_id on public.app_motorista_rotas
  for each row when (old.motorista_id is distinct from new.motorista_id)
  execute function public.app_motorista_propaga_dono_rota();

create trigger audit_app_motorista_perfis after insert or update or delete on public.app_motorista_perfis
  for each row execute function public.audit_registrar('app_motorista.perfil');
create trigger audit_app_motorista_rotas after insert or update or delete on public.app_motorista_rotas
  for each row execute function public.audit_registrar('app_motorista.rota');
create trigger audit_app_motorista_comprovantes after insert or update or delete on public.app_motorista_comprovantes
  for each row execute function public.audit_registrar('app_motorista.comprovante');
create trigger audit_app_motorista_insucessos after insert or update or delete on public.app_motorista_insucessos
  for each row execute function public.audit_registrar('app_motorista.insucesso');
create trigger audit_app_motorista_checklists after insert or update or delete on public.app_motorista_checklists
  for each row execute function public.audit_registrar('app_motorista.checklist');
create trigger audit_app_motorista_contas after insert or update or delete on public.app_motorista_contas_bancarias
  for each row execute function public.audit_registrar('app_motorista.conta_bancaria');
create trigger audit_app_motorista_recibos after insert or update or delete on public.app_motorista_recibos
  for each row execute function public.audit_registrar('app_motorista.recibo');
create trigger audit_app_motorista_emergencias after insert or update or delete on public.app_motorista_emergencias
  for each row execute function public.audit_registrar('app_motorista.emergencia');

-- ==========================================================================
-- Partições do GPS
-- ==========================================================================
-- Cada partição fica no public e cumpre as regras do catálogo do TMS (pgTAP
-- 00032): RLS ligada, policy tenant_isolation_select no padrão e nenhum grant
-- para anon/authenticated — o acesso é sempre pela tabela-mãe e pela RLS dela.
create or replace function public.app_motorista_gps_garantir_particoes(p_de date, p_meses integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_mes date := date_trunc('month', p_de)::date;
  v_nome text;
  v_criadas integer := 0;
begin
  if p_meses not between 1 and 36 then
    raise exception 'p_meses entre 1 e 36' using errcode = '22023';
  end if;
  for i in 0 .. p_meses - 1 loop
    v_nome := 'app_motorista_gps_pontos_' || to_char(v_mes, 'YYYY_MM');
    if to_regclass('public.' || v_nome) is null then
      execute format(
        'create table public.%I partition of public.app_motorista_gps_pontos for values from (%L) to (%L)',
        v_nome, v_mes, (v_mes + interval '1 month')::date);
      execute format('alter table public.%I enable row level security', v_nome);
      execute format(
        'create policy "tenant_isolation_select" on public.%I for select using ((((tenant_id = (((select auth.jwt()) ->> ''tenant_id''::text))::uuid) OR (((select auth.jwt()) ->> ''portal''::text) = ''interno''::text))) and ((select public.app_motorista_interno_pode(''tms.ver'')) or (select public.app_motorista_interno_pode(''torre.ver''))))',
        v_nome);
      execute format('revoke all on public.%I from anon, authenticated', v_nome);
      execute format('comment on table public.%I is %L', v_nome,
        'App Motorista: partição mensal de app_motorista_gps_pontos. Sem grants; acesso pela tabela-mãe.');
      v_criadas := v_criadas + 1;
    end if;
    v_mes := (v_mes + interval '1 month')::date;
  end loop;
  return v_criadas;
end;
$fn$;

-- Retenção (LGPD): remove partições inteiras anteriores ao mês de p_antes.
create or replace function public.app_motorista_gps_expurgar(p_antes date)
returns integer
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_part record;
  v_removidas integer := 0;
begin
  for v_part in
    select c.relname
    from pg_inherits i
    join pg_class c on c.oid = i.inhrelid
    where i.inhparent = 'public.app_motorista_gps_pontos'::regclass
      and c.relname ~ '^app_motorista_gps_pontos_[0-9]{4}_[0-9]{2}$'
      and to_date(right(c.relname, 7), 'YYYY_MM') < date_trunc('month', p_antes)::date
  loop
    execute format('drop table public.%I', v_part.relname);
    v_removidas := v_removidas + 1;
  end loop;
  return v_removidas;
end;
$fn$;

revoke all on function public.app_motorista_gps_garantir_particoes(date, integer) from public, anon, authenticated;
revoke all on function public.app_motorista_gps_expurgar(date) from public, anon, authenticated;
grant execute on function public.app_motorista_gps_garantir_particoes(date, integer) to service_role;
grant execute on function public.app_motorista_gps_expurgar(date) to service_role;

-- ==========================================================================
-- RLS
-- ==========================================================================
alter table public.app_motorista_config enable row level security;
alter table public.app_motorista_perfis enable row level security;
alter table public.app_motorista_preferencias enable row level security;
alter table public.app_motorista_rotas enable row level security;
alter table public.app_motorista_paradas enable row level security;
alter table public.app_motorista_volumes enable row level security;
alter table public.app_motorista_comprovantes enable row level security;
alter table public.app_motorista_insucessos enable row level security;
alter table public.app_motorista_checklists enable row level security;
alter table public.app_motorista_gps_pontos enable row level security;
alter table public.app_motorista_alertas_via enable row level security;
alter table public.app_motorista_notificacoes enable row level security;
alter table public.app_motorista_faq enable row level security;
alter table public.app_motorista_chamados enable row level security;
alter table public.app_motorista_emergencias enable row level security;
alter table public.app_motorista_documentos_pessoais enable row level security;
alter table public.app_motorista_contas_bancarias enable row level security;
alter table public.app_motorista_recibos enable row level security;
alter table public.app_motorista_recibo_itens enable row level security;
alter table public.app_motorista_recibo_rotas enable row level security;
alter table public.app_motorista_operacoes enable row level security;
alter table public.app_motorista_arquivos enable row level security;
alter table public.app_motorista_tentativas_login enable row level security;

-- Leitura interna: padrão do TMS (próprio tenant ou operador interno) + a
-- permissão do vocabulário existente que a tela interna exigiria.
create policy "tenant_isolation_select" on public.app_motorista_config for select
  using ((((tenant_id = (((select auth.jwt()) ->> 'tenant_id'::text))::uuid) OR (((select auth.jwt()) ->> 'portal'::text) = 'interno'::text))) and (select public.app_motorista_interno_pode('tms.ver')));
create policy "tenant_isolation_select" on public.app_motorista_perfis for select
  using ((((tenant_id = (((select auth.jwt()) ->> 'tenant_id'::text))::uuid) OR (((select auth.jwt()) ->> 'portal'::text) = 'interno'::text))) and (select public.app_motorista_interno_pode('rh.ver')));
create policy "tenant_isolation_select" on public.app_motorista_preferencias for select
  using ((((tenant_id = (((select auth.jwt()) ->> 'tenant_id'::text))::uuid) OR (((select auth.jwt()) ->> 'portal'::text) = 'interno'::text))) and (select public.app_motorista_interno_pode('tms.ver')));
create policy "tenant_isolation_select" on public.app_motorista_rotas for select
  using ((((tenant_id = (((select auth.jwt()) ->> 'tenant_id'::text))::uuid) OR (((select auth.jwt()) ->> 'portal'::text) = 'interno'::text))) and (select public.app_motorista_interno_pode('tms.ver')));
create policy "tenant_isolation_select" on public.app_motorista_paradas for select
  using ((((tenant_id = (((select auth.jwt()) ->> 'tenant_id'::text))::uuid) OR (((select auth.jwt()) ->> 'portal'::text) = 'interno'::text))) and (select public.app_motorista_interno_pode('tms.ver')));
create policy "tenant_isolation_select" on public.app_motorista_volumes for select
  using ((((tenant_id = (((select auth.jwt()) ->> 'tenant_id'::text))::uuid) OR (((select auth.jwt()) ->> 'portal'::text) = 'interno'::text))) and (select public.app_motorista_interno_pode('tms.ver')));
create policy "tenant_isolation_select" on public.app_motorista_comprovantes for select
  using ((((tenant_id = (((select auth.jwt()) ->> 'tenant_id'::text))::uuid) OR (((select auth.jwt()) ->> 'portal'::text) = 'interno'::text))) and (select public.app_motorista_interno_pode('tms.ver')));
create policy "tenant_isolation_select" on public.app_motorista_insucessos for select
  using ((((tenant_id = (((select auth.jwt()) ->> 'tenant_id'::text))::uuid) OR (((select auth.jwt()) ->> 'portal'::text) = 'interno'::text))) and (select public.app_motorista_interno_pode('tms.ver')));
create policy "tenant_isolation_select" on public.app_motorista_checklists for select
  using ((((tenant_id = (((select auth.jwt()) ->> 'tenant_id'::text))::uuid) OR (((select auth.jwt()) ->> 'portal'::text) = 'interno'::text))) and (select public.app_motorista_interno_pode('tms.ver')));
create policy "tenant_isolation_select" on public.app_motorista_gps_pontos for select
  using ((((tenant_id = (((select auth.jwt()) ->> 'tenant_id'::text))::uuid) OR (((select auth.jwt()) ->> 'portal'::text) = 'interno'::text))) and ((select public.app_motorista_interno_pode('tms.ver')) or (select public.app_motorista_interno_pode('torre.ver'))));
create policy "tenant_isolation_select" on public.app_motorista_alertas_via for select
  using ((((tenant_id = (((select auth.jwt()) ->> 'tenant_id'::text))::uuid) OR (((select auth.jwt()) ->> 'portal'::text) = 'interno'::text))) and ((select public.app_motorista_interno_pode('tms.ver')) or (select public.app_motorista_interno_pode('torre.ver'))));
create policy "tenant_isolation_select" on public.app_motorista_notificacoes for select
  using ((((tenant_id = (((select auth.jwt()) ->> 'tenant_id'::text))::uuid) OR (((select auth.jwt()) ->> 'portal'::text) = 'interno'::text))) and (select public.app_motorista_interno_pode('tms.ver')));
create policy "tenant_isolation_select" on public.app_motorista_faq for select
  using ((((tenant_id = (((select auth.jwt()) ->> 'tenant_id'::text))::uuid) OR (((select auth.jwt()) ->> 'portal'::text) = 'interno'::text))) and (select public.app_motorista_interno_pode('atendimento.ver')));
create policy "tenant_isolation_select" on public.app_motorista_chamados for select
  using ((((tenant_id = (((select auth.jwt()) ->> 'tenant_id'::text))::uuid) OR (((select auth.jwt()) ->> 'portal'::text) = 'interno'::text))) and (select public.app_motorista_interno_pode('atendimento.ver')));
create policy "tenant_isolation_select" on public.app_motorista_emergencias for select
  using ((((tenant_id = (((select auth.jwt()) ->> 'tenant_id'::text))::uuid) OR (((select auth.jwt()) ->> 'portal'::text) = 'interno'::text))) and ((select public.app_motorista_interno_pode('tms.ver')) or (select public.app_motorista_interno_pode('torre.ver'))));
create policy "tenant_isolation_select" on public.app_motorista_documentos_pessoais for select
  using ((((tenant_id = (((select auth.jwt()) ->> 'tenant_id'::text))::uuid) OR (((select auth.jwt()) ->> 'portal'::text) = 'interno'::text))) and (select public.app_motorista_interno_pode('rh.ver')));
create policy "tenant_isolation_select" on public.app_motorista_contas_bancarias for select
  using ((((tenant_id = (((select auth.jwt()) ->> 'tenant_id'::text))::uuid) OR (((select auth.jwt()) ->> 'portal'::text) = 'interno'::text))) and (select public.app_motorista_interno_pode('financeiro.ver')));
create policy "tenant_isolation_select" on public.app_motorista_recibos for select
  using ((((tenant_id = (((select auth.jwt()) ->> 'tenant_id'::text))::uuid) OR (((select auth.jwt()) ->> 'portal'::text) = 'interno'::text))) and (select public.app_motorista_interno_pode('financeiro.ver')));
create policy "tenant_isolation_select" on public.app_motorista_recibo_itens for select
  using ((((tenant_id = (((select auth.jwt()) ->> 'tenant_id'::text))::uuid) OR (((select auth.jwt()) ->> 'portal'::text) = 'interno'::text))) and (select public.app_motorista_interno_pode('financeiro.ver')));
create policy "tenant_isolation_select" on public.app_motorista_recibo_rotas for select
  using ((((tenant_id = (((select auth.jwt()) ->> 'tenant_id'::text))::uuid) OR (((select auth.jwt()) ->> 'portal'::text) = 'interno'::text))) and (select public.app_motorista_interno_pode('financeiro.ver')));
create policy "tenant_isolation_select" on public.app_motorista_arquivos for select
  using ((((tenant_id = (((select auth.jwt()) ->> 'tenant_id'::text))::uuid) OR (((select auth.jwt()) ->> 'portal'::text) = 'interno'::text))) and (select public.app_motorista_interno_pode('tms.ver')));
create policy "tenant_isolation_select" on public.app_motorista_operacoes for select
  using ((((tenant_id = (((select auth.jwt()) ->> 'tenant_id'::text))::uuid) OR (((select auth.jwt()) ->> 'portal'::text) = 'interno'::text))) and (select public.app_motorista_interno_pode('tms.operar')));

-- Motorista: só as próprias linhas, do próprio tenant, não apagadas.
create policy "app_motorista_proprio_select" on public.app_motorista_preferencias for select
  using ((tenant_id = (select public.app_motorista_tenant())) and (user_id = (select auth.uid())));
create policy "app_motorista_proprio_select" on public.app_motorista_rotas for select
  using ((tenant_id = (select public.app_motorista_tenant())) and (motorista_id = (select auth.uid())) and (deleted_at is null));
create policy "app_motorista_proprio_select" on public.app_motorista_paradas for select
  using ((tenant_id = (select public.app_motorista_tenant())) and (motorista_id = (select auth.uid())) and (deleted_at is null));
create policy "app_motorista_proprio_select" on public.app_motorista_volumes for select
  using ((tenant_id = (select public.app_motorista_tenant())) and (motorista_id = (select auth.uid())) and (deleted_at is null));
create policy "app_motorista_proprio_select" on public.app_motorista_comprovantes for select
  using ((tenant_id = (select public.app_motorista_tenant())) and (motorista_id = (select auth.uid())) and (deleted_at is null));
create policy "app_motorista_proprio_select" on public.app_motorista_insucessos for select
  using ((tenant_id = (select public.app_motorista_tenant())) and (motorista_id = (select auth.uid())) and (deleted_at is null));
create policy "app_motorista_proprio_select" on public.app_motorista_checklists for select
  using ((tenant_id = (select public.app_motorista_tenant())) and (motorista_id = (select auth.uid())) and (deleted_at is null));
create policy "app_motorista_proprio_select" on public.app_motorista_gps_pontos for select
  using ((tenant_id = (select public.app_motorista_tenant())) and (motorista_id = (select auth.uid())));
create policy "app_motorista_proprio_select" on public.app_motorista_alertas_via for select
  using ((tenant_id = (select public.app_motorista_tenant())) and (motorista_id = (select auth.uid())) and (deleted_at is null));
create policy "app_motorista_proprio_select" on public.app_motorista_notificacoes for select
  using ((tenant_id = (select public.app_motorista_tenant())) and (motorista_id = (select auth.uid())) and (deleted_at is null));
create policy "app_motorista_proprio_select" on public.app_motorista_faq for select
  using ((tenant_id = (select public.app_motorista_tenant())) and (deleted_at is null));
create policy "app_motorista_proprio_select" on public.app_motorista_chamados for select
  using ((tenant_id = (select public.app_motorista_tenant())) and (motorista_id = (select auth.uid())));
create policy "app_motorista_proprio_select" on public.app_motorista_emergencias for select
  using ((tenant_id = (select public.app_motorista_tenant())) and (motorista_id = (select auth.uid())) and (deleted_at is null));
create policy "app_motorista_proprio_select" on public.app_motorista_recibos for select
  using ((tenant_id = (select public.app_motorista_tenant())) and (motorista_id = (select auth.uid())) and (deleted_at is null));
create policy "app_motorista_proprio_select" on public.app_motorista_recibo_itens for select
  using ((tenant_id = (select public.app_motorista_tenant())) and (motorista_id = (select auth.uid())));
create policy "app_motorista_proprio_select" on public.app_motorista_recibo_rotas for select
  using ((tenant_id = (select public.app_motorista_tenant())) and (motorista_id = (select auth.uid())));

-- ==========================================================================
-- Grants: authenticated só lê (e só onde há policy de leitura útil).
-- Sensíveis, idempotência, config e login: nenhum privilégio de tabela.
-- ==========================================================================
revoke all on public.app_motorista_config, public.app_motorista_perfis, public.app_motorista_preferencias,
  public.app_motorista_rotas, public.app_motorista_paradas, public.app_motorista_volumes,
  public.app_motorista_comprovantes, public.app_motorista_insucessos, public.app_motorista_checklists,
  public.app_motorista_gps_pontos, public.app_motorista_alertas_via, public.app_motorista_notificacoes,
  public.app_motorista_faq, public.app_motorista_chamados, public.app_motorista_emergencias,
  public.app_motorista_documentos_pessoais, public.app_motorista_contas_bancarias, public.app_motorista_recibos,
  public.app_motorista_recibo_itens, public.app_motorista_recibo_rotas, public.app_motorista_operacoes,
  public.app_motorista_tentativas_login, public.app_motorista_arquivos
  from anon, authenticated;

grant select on public.app_motorista_preferencias, public.app_motorista_rotas, public.app_motorista_paradas,
  public.app_motorista_volumes, public.app_motorista_comprovantes, public.app_motorista_insucessos,
  public.app_motorista_checklists, public.app_motorista_gps_pontos, public.app_motorista_alertas_via,
  public.app_motorista_notificacoes, public.app_motorista_faq, public.app_motorista_chamados,
  public.app_motorista_emergencias, public.app_motorista_recibos, public.app_motorista_recibo_itens,
  public.app_motorista_recibo_rotas, public.app_motorista_config
  to authenticated;

revoke all on sequence public.app_motorista_tentativas_login_id_seq from anon, authenticated;

-- Partições 2026-09 a 2027-12; depois, rotina mensal (docs/OPERACAO_APP_MOTORISTA.md).
select public.app_motorista_gps_garantir_particoes(date '2026-09-01', 16);
