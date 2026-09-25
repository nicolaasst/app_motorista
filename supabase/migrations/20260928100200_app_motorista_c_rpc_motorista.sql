-- App Motorista, lote C — RPCs do motorista (toda escrita do app passa aqui).
--
-- Regras comuns (docs/RBAC_RLS_APP_MOTORISTA.md §5.5):
--   * security definer + search_path '' + execute só para authenticated;
--     primeira coisa: app_motorista_eu() confere portal app-motorista, perfil
--     e usuário ativos — qualquer outro portal recebe 42501;
--   * dono conferido em toda linha tocada (rota/parada/recibo do próprio
--     motorista), com `for update` para serializar ações concorrentes;
--   * RPCs chamadas pela fila offline recebem p_chave (uuid do item da fila):
--     reenvio devolve o resultado já gravado em app_motorista_operacoes;
--   * o servidor decide o que é prova: hash de assinatura (dos bytes gravados
--     pela Edge Function), distância/geofence, IP e horário de recebimento;
--   * horários do aparelho aceitos só entre 30 dias atrás e 5 min à frente.
--
-- Erros: 42501 sem acesso · P0002 não encontrado · 22023 regra de negócio.
-- Sem bloco `do $$`; corpo de função com $fn$.

-- ==========================================================================
-- Internas (não expostas)
-- ==========================================================================

create or replace function public.app_motorista_eu(out o_tenant uuid, out o_motorista uuid, out o_nome text)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
begin
  o_tenant := public.app_motorista_tenant();
  o_motorista := (select auth.uid());
  if o_tenant is null or o_motorista is null then
    raise exception 'Acesso restrito ao App Motorista' using errcode = '42501';
  end if;
  select p.nome_completo into o_nome
  from public.app_motorista_perfis p
  join public.users u on u.id = p.user_id
  where p.user_id = o_motorista and p.tenant_id = o_tenant
    and p.situacao_cadastro = 'ativo' and p.deleted_at is null
    and u.ativo and u.portal = 'app-motorista';
  if o_nome is null then
    raise exception 'Cadastro de motorista inativo ou não encontrado' using errcode = '42501';
  end if;
end;
$fn$;

-- Idempotência: reserva a chave; se já existe, devolve o resultado gravado.
create or replace function public.app_motorista_idem_reservar(p_chave uuid, p_tenant uuid, p_motorista uuid, p_operacao text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v record;
begin
  if p_chave is null then
    raise exception 'Chave de idempotência obrigatória' using errcode = '22023';
  end if;
  insert into public.app_motorista_operacoes (chave, tenant_id, motorista_id, operacao)
  values (p_chave, p_tenant, p_motorista, p_operacao)
  on conflict (chave) do nothing;
  if found then
    return null;
  end if;
  select * into v from public.app_motorista_operacoes where chave = p_chave;
  if v.motorista_id <> p_motorista or v.operacao <> p_operacao then
    raise exception 'Chave de idempotência já usada em outra operação' using errcode = '22023';
  end if;
  return v.resultado;
end;
$fn$;

create or replace function public.app_motorista_idem_concluir(p_chave uuid, p_resultado jsonb)
returns jsonb
language sql
security definer
set search_path = ''
as $fn$
  update public.app_motorista_operacoes set resultado = p_resultado where chave = p_chave;
  select p_resultado;
$fn$;

-- Horário informado pelo aparelho: dentro de uma janela plausível.
create or replace function public.app_motorista_momento(p_momento timestamptz, p_campo text)
returns timestamptz
language plpgsql
stable
set search_path = ''
as $fn$
begin
  if p_momento is null then
    return now();
  end if;
  if p_momento > now() + interval '5 minutes' or p_momento < now() - interval '30 days' then
    raise exception '% fora da janela aceita (30 dias atrás a 5 min à frente)', p_campo using errcode = '22023';
  end if;
  return p_momento;
end;
$fn$;

-- Distância em metros (haversine; raio médio da Terra 6 371 008,8 m).
create or replace function public.app_motorista_distancia_m(p_lat1 numeric, p_lng1 numeric, p_lat2 numeric, p_lng2 numeric)
returns numeric
language sql
immutable
set search_path = ''
as $fn$
  select case when p_lat1 is null or p_lng1 is null or p_lat2 is null or p_lng2 is null then null
    else round((2 * 6371008.8 * asin(sqrt(
      power(sin(radians((p_lat2 - p_lat1)::float8) / 2), 2)
      + cos(radians(p_lat1::float8)) * cos(radians(p_lat2::float8)) * power(sin(radians((p_lng2 - p_lng1)::float8) / 2), 2)
    )))::numeric, 1) end;
$fn$;

create or replace function public.app_motorista_raio_geofence(p_tenant uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $fn$
  select coalesce((select c.raio_geofence_m from public.app_motorista_config c where c.tenant_id = p_tenant), 150);
$fn$;

-- Vincula anexos enviados pela Edge Function a uma entidade. Só aceita arquivo
-- do próprio motorista, do tipo esperado e ainda não vinculado.
create or replace function public.app_motorista_vincular_arquivos(
  p_tenant uuid, p_motorista uuid, p_ids uuid[], p_tipo text, p_entity_table text, p_entity_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_ids uuid[] := coalesce((select array_agg(distinct x) from unnest(p_ids) x where x is not null), '{}');
  v_ok integer;
begin
  if cardinality(v_ids) = 0 then
    return 0;
  end if;
  update public.app_motorista_arquivos a
     set vinculado_a = p_entity_table || ':' || p_entity_id, vinculado_em = now()
   where a.documento_id = any (v_ids)
     and a.tenant_id = p_tenant and a.motorista_id = p_motorista
     and a.tipo = p_tipo and a.vinculado_em is null;
  get diagnostics v_ok = row_count;
  if v_ok <> cardinality(v_ids) then
    raise exception 'Anexo inválido, de outro motorista ou já utilizado (%)', p_tipo using errcode = '22023';
  end if;
  update public.documents d
     set entity_table = p_entity_table, entity_id = p_entity_id
   where d.id = any (v_ids);
  return v_ok;
end;
$fn$;

create or replace function public.app_motorista_notificar(
  p_tenant uuid, p_motorista uuid, p_tipo text, p_titulo text, p_corpo text, p_link text)
returns uuid
language sql
security definer
set search_path = ''
as $fn$
  insert into public.app_motorista_notificacoes (tenant_id, motorista_id, tipo, titulo, corpo, deep_link)
  values (p_tenant, p_motorista, p_tipo, p_titulo, p_corpo, p_link)
  returning id;
$fn$;

-- Abre o chamado no TMS (mesmos campos/rótulos de atendimento_abrir_chamado,
-- para a Central de Atendimento exibir sem mudança) e registra o dono.
create or replace function public.app_motorista_abrir_chamado_interno(
  p_tenant uuid, p_motorista uuid, p_nome text, p_chave uuid,
  p_categoria text, p_assunto text, p_descricao text, p_rota_id uuid, p_recibo_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_agora timestamptz := now();
  v_seq bigint;
  v_codigo text;
  v_referencia text;
  v_label text := case p_categoria
    when 'pagamento' then 'Pagamento'
    when 'mecanica' then 'Mecânica / Veículo'
    when 'coleta_nfe' then 'Coleta / NF-e'
    when 'app_sync' then 'App / Sincronização'
    else 'Outro' end;
begin
  if p_categoria is null or p_categoria not in ('pagamento', 'mecanica', 'coleta_nfe', 'app_sync', 'outro') then
    raise exception 'Categoria inválida (emergência tem fluxo próprio)' using errcode = '22023';
  end if;
  if coalesce(btrim(p_assunto), '') = '' or coalesce(btrim(p_descricao), '') = '' then
    raise exception 'Assunto e descrição são obrigatórios' using errcode = '22023';
  end if;
  if length(p_assunto) > 140 or length(p_descricao) > 4000 then
    raise exception 'Texto acima do limite' using errcode = '22001';
  end if;

  select coalesce('Rota ' || r.codigo, null) into v_referencia
  from public.app_motorista_rotas r where r.id = p_rota_id and r.motorista_id = p_motorista;
  if p_recibo_id is not null then
    select coalesce(v_referencia || ' · ', '') || 'Recibo ' || r.codigo into v_referencia
    from public.app_motorista_recibos r where r.id = p_recibo_id and r.motorista_id = p_motorista;
  end if;

  -- Mesmo contador de proximo_codigo('CH'), com o tenant explícito (o
  -- motorista não tem a claim tenant_id que proximo_codigo lê).
  insert into public.codigos_sequenciais as c (tenant_id, prefixo, ultimo)
  values (p_tenant, 'CH', 1)
  on conflict (tenant_id, prefixo) do update set ultimo = c.ultimo + 1
  returning c.ultimo into v_seq;
  v_codigo := 'CH-' || to_char(v_agora at time zone 'America/Sao_Paulo', 'YYYY') || '-' || lpad(v_seq::text, 5, '0');

  insert into public.tickets_atendimento (
    tenant_id, codigo, status, status_label, referencia_label, assunto, resumo,
    aberto_em_label, categoria_label, aberto_por, aberto_por_cargo,
    sla_acionado_em, sla_restante_label
  ) values (
    p_tenant, v_codigo, 'em_andamento', 'Em andamento',
    coalesce(v_referencia, 'App Motorista'),
    btrim(p_assunto), left(btrim(p_descricao), 280),
    to_char(v_agora at time zone 'America/Sao_Paulo', 'DD/MM') || ' às ' || public.atendimento_hora(v_agora),
    v_label, p_nome, 'Motorista',
    public.atendimento_hora(v_agora), 'Aguardando triagem'
  );

  -- 'cliente' = quem abriu o chamado, na visão da Central (o enum da tela do
  -- TMS só conhece cliente/suporte/sistema).
  insert into public.mensagens_ticket (tenant_id, id, ticket_codigo, autor_tipo, autor_nome, texto, horario)
  values (p_tenant, gen_random_uuid()::text, v_codigo, 'cliente', p_nome, btrim(p_descricao), public.atendimento_hora(v_agora));

  insert into public.app_motorista_chamados (tenant_id, ticket_codigo, motorista_id, categoria_app, rota_id, recibo_id, chave_idempotencia)
  values (p_tenant, v_codigo, p_motorista, p_categoria, p_rota_id, p_recibo_id, p_chave);

  return v_codigo;
end;
$fn$;

revoke all on function public.app_motorista_eu() from public, anon, authenticated;
revoke all on function public.app_motorista_idem_reservar(uuid, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.app_motorista_idem_concluir(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.app_motorista_momento(timestamptz, text) from public, anon, authenticated;
revoke all on function public.app_motorista_distancia_m(numeric, numeric, numeric, numeric) from public, anon, authenticated;
revoke all on function public.app_motorista_raio_geofence(uuid) from public, anon, authenticated;
revoke all on function public.app_motorista_vincular_arquivos(uuid, uuid, uuid[], text, text, uuid) from public, anon, authenticated;
revoke all on function public.app_motorista_notificar(uuid, uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function public.app_motorista_abrir_chamado_interno(uuid, uuid, text, uuid, text, text, text, uuid, uuid) from public, anon, authenticated;

-- ==========================================================================
-- Leitura
-- ==========================================================================

-- Perfil + preferências + parâmetros do tenant (substitui getDriver()).
create or replace function public.app_motorista_contexto()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  eu record;
begin
  select * into eu from public.app_motorista_eu();
  return jsonb_build_object(
    'perfil', (select to_jsonb(p) - 'deleted_at' - 'tenant_id' from public.app_motorista_perfis p where p.user_id = eu.o_motorista),
    'preferencias', coalesce(
      (select to_jsonb(x) - 'tenant_id' from public.app_motorista_preferencias x where x.user_id = eu.o_motorista),
      jsonb_build_object('user_id', eu.o_motorista, 'app_navegacao', 'google_maps', 'alertas_sonoros', true,
        'bipe_leitura', true, 'tema', 'system', 'orientacao', 'automatica', 'lembrar_login', false)),
    'config', jsonb_build_object(
      'raio_geofence_m', public.app_motorista_raio_geofence(eu.o_tenant),
      'dias_documento_vencendo', coalesce((select c.dias_documento_vencendo from public.app_motorista_config c where c.tenant_id = eu.o_tenant), 30),
      'telefone_central', (select c.telefone_central from public.app_motorista_config c where c.tenant_id = eu.o_tenant),
      'whatsapp_central', (select c.whatsapp_central from public.app_motorista_config c where c.tenant_id = eu.o_tenant)));
end;
$fn$;

-- Veículo da rota (ou da rota mais recente) — lido do cadastro do TMS.
create or replace function public.app_motorista_meu_veiculo(p_rota_id uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  eu record;
  v_veiculo text;
begin
  select * into eu from public.app_motorista_eu();
  select r.tms_veiculo_id into v_veiculo
  from public.app_motorista_rotas r
  where r.tenant_id = eu.o_tenant and r.motorista_id = eu.o_motorista and r.deleted_at is null
    and (p_rota_id is null or r.id = p_rota_id)
  order by r.data desc, r.created_at desc
  limit 1;
  if v_veiculo is null then
    return null;
  end if;
  return (
    select jsonb_build_object('id', v.id, 'placa', v.placa, 'modelo', v.modelo, 'codigo_interno', v.codigo_interno,
      'tipo_label', v.tipo_label, 'ano_label', v.ano_label, 'capacidade_label', v.capacidade_label,
      'hodometro_km', v.hodometro_km, 'status_operacional', v.status_operacional)
    from public.tms_veiculos v
    where v.tenant_id = eu.o_tenant and v.id = v_veiculo and v.deleted_at is null);
end;
$fn$;

-- Documentos pessoais (status derivado da validade).
create or replace function public.app_motorista_meus_documentos()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  eu record;
  v_dias integer;
begin
  select * into eu from public.app_motorista_eu();
  v_dias := coalesce((select c.dias_documento_vencendo from public.app_motorista_config c where c.tenant_id = eu.o_tenant), 30);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', d.id, 'tipo', d.tipo, 'titulo', d.titulo, 'subtitulo', d.subtitulo, 'valido_ate', d.valido_ate,
      'documento_id', d.documento_id, 'enviado_em', d.enviado_em,
      'status', case when d.valido_ate is null then 'valido'
                     when d.valido_ate < current_date then 'vencido'
                     when d.valido_ate <= current_date + v_dias then 'vencendo'
                     else 'valido' end) order by d.valido_ate nulls last)
    from public.app_motorista_documentos_pessoais d
    where d.tenant_id = eu.o_tenant and d.motorista_id = eu.o_motorista and d.deleted_at is null), '[]'::jsonb);
end;
$fn$;

-- Contas bancárias do próprio motorista (conta e chave Pix mascaradas).
create or replace function public.app_motorista_minhas_contas()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  eu record;
begin
  select * into eu from public.app_motorista_eu();
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id, 'banco_codigo', c.banco_codigo, 'banco_nome', c.banco_nome, 'agencia', c.agencia,
      'conta', '•••' || right(c.conta, 4), 'tipo_conta', c.tipo_conta, 'pix_tipo', c.pix_tipo,
      'pix_chave', case when c.pix_chave is null then null
                        when length(c.pix_chave) <= 6 then '•••'
                        else left(c.pix_chave, 3) || '•••' || right(c.pix_chave, 3) end,
      'principal', c.principal, 'situacao', c.situacao, 'alterada_em', c.alterada_em)
      order by (c.situacao = 'ativa') desc, c.principal desc, c.alterada_em desc)
    from public.app_motorista_contas_bancarias c
    where c.tenant_id = eu.o_tenant and c.motorista_id = eu.o_motorista and c.deleted_at is null
      and c.situacao in ('ativa', 'pendente_aprovacao')), '[]'::jsonb);
end;
$fn$;

-- Chamados do motorista, com o status e a última resposta da Central.
create or replace function public.app_motorista_meus_chamados(p_limite integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  eu record;
begin
  select * into eu from public.app_motorista_eu();
  return coalesce((
    select jsonb_agg(x order by x ->> 'aberto_em' desc)
    from (
      select jsonb_build_object(
        'codigo', t.codigo, 'categoria', c.categoria_app, 'assunto', t.assunto, 'descricao', t.resumo,
        'status_tms', t.status,
        'status', case when t.status = 'encerrado' then 'fechado'
                       when exists (select 1 from public.mensagens_ticket m where m.tenant_id = t.tenant_id
                                     and m.ticket_codigo = t.codigo and m.autor_tipo = 'suporte' and m.deleted_at is null)
                         then 'em_andamento'
                       else 'aberto' end,
        'aberto_em', c.created_at, 'encerrado_em', t.encerrado_em,
        'rota_id', c.rota_id, 'recibo_id', c.recibo_id,
        'resposta_central', (select m.texto from public.mensagens_ticket m where m.tenant_id = t.tenant_id
                              and m.ticket_codigo = t.codigo and m.autor_tipo = 'suporte' and m.deleted_at is null
                              order by m.created_at desc limit 1)) as x
      from public.app_motorista_chamados c
      join public.tickets_atendimento t on t.tenant_id = c.tenant_id and t.codigo = c.ticket_codigo
      where c.tenant_id = eu.o_tenant and c.motorista_id = eu.o_motorista and t.deleted_at is null
      order by c.created_at desc
      limit least(greatest(coalesce(p_limite, 30), 1), 100)) s), '[]'::jsonb);
end;
$fn$;

-- ==========================================================================
-- Turno e rota
-- ==========================================================================

create or replace function public.app_motorista_iniciar_rota(
  p_chave uuid, p_rota_id uuid, p_itens jsonb, p_odometro numeric,
  p_foto_odometro_id uuid default null, p_concluido_em timestamptz default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  eu record;
  v_prev jsonb;
  v_rota record;
  v_momento timestamptz;
  v_checklist uuid;
begin
  select * into eu from public.app_motorista_eu();
  v_prev := public.app_motorista_idem_reservar(p_chave, eu.o_tenant, eu.o_motorista, 'iniciar_rota');
  if v_prev is not null then return v_prev; end if;
  v_momento := public.app_motorista_momento(p_concluido_em, 'Horário do checklist');

  select * into v_rota from public.app_motorista_rotas r
   where r.id = p_rota_id and r.tenant_id = eu.o_tenant and r.motorista_id = eu.o_motorista and r.deleted_at is null
   for update;
  if not found then
    raise exception 'Rota não encontrada' using errcode = 'P0002';
  end if;
  if v_rota.status not in ('planejada', 'checklist_ok') then
    raise exception 'Rota já iniciada (status %)', v_rota.status using errcode = '22023';
  end if;
  if exists (select 1 from public.app_motorista_rotas r where r.motorista_id = eu.o_motorista
               and r.status = 'em_operacao' and r.deleted_at is null and r.id <> p_rota_id) then
    raise exception 'Há outra rota em operação; conclua-a antes de iniciar uma nova' using errcode = '22023';
  end if;
  if jsonb_typeof(p_itens) is distinct from 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Checklist sem itens' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_array_elements(p_itens) i
              where coalesce(i ->> 'key', '') = '' or (i -> 'ok') is distinct from 'true'::jsonb) then
    raise exception 'Checklist com item reprovado ou incompleto: a rota não pode iniciar' using errcode = '22023';
  end if;
  if p_odometro is null or p_odometro <= 0 or p_odometro >= 10000000 then
    raise exception 'Odômetro inválido' using errcode = '22023';
  end if;

  insert into public.app_motorista_checklists (tenant_id, rota_id, motorista_id, tms_veiculo_id, tipo, itens,
    odometro_km, declaracao_aceita, concluido_em, chave_idempotencia)
  values (eu.o_tenant, p_rota_id, eu.o_motorista, v_rota.tms_veiculo_id, 'pre', p_itens,
    p_odometro, true, v_momento, p_chave)
  returning id into v_checklist;

  if p_foto_odometro_id is not null then
    perform public.app_motorista_vincular_arquivos(eu.o_tenant, eu.o_motorista, array[p_foto_odometro_id],
      'foto_odometro', 'app_motorista_checklists', v_checklist);
    update public.app_motorista_checklists set foto_odometro_id = p_foto_odometro_id where id = v_checklist;
  end if;

  update public.app_motorista_rotas
     set status = 'em_operacao', iniciada_em = v_momento, odometro_inicial = p_odometro,
         foto_odometro_inicial_id = p_foto_odometro_id
   where id = p_rota_id;

  -- Hodômetro do veículo no TMS só avança.
  if v_rota.tms_veiculo_id is not null then
    update public.tms_veiculos
       set hodometro_km = p_odometro
     where tenant_id = eu.o_tenant and id = v_rota.tms_veiculo_id
       and (hodometro_km is null or hodometro_km < p_odometro);
  end if;

  return public.app_motorista_idem_concluir(p_chave, jsonb_build_object(
    'rota_id', p_rota_id, 'status', 'em_operacao', 'iniciada_em', v_momento, 'checklist_id', v_checklist));
end;
$fn$;

create or replace function public.app_motorista_bipar_volumes(
  p_chave uuid, p_parada_id uuid, p_volume_ids uuid[], p_lido_em timestamptz default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  eu record;
  v_prev jsonb;
  v_parada record;
  v_momento timestamptz;
  v_validos integer;
  v_bipados integer;
begin
  select * into eu from public.app_motorista_eu();
  v_prev := public.app_motorista_idem_reservar(p_chave, eu.o_tenant, eu.o_motorista, 'bipar_volumes');
  if v_prev is not null then return v_prev; end if;
  v_momento := public.app_motorista_momento(p_lido_em, 'Horário da leitura');

  select p.*, r.status as rota_status into v_parada
  from public.app_motorista_paradas p
  join public.app_motorista_rotas r on r.id = p.rota_id
  where p.id = p_parada_id and p.tenant_id = eu.o_tenant and p.motorista_id = eu.o_motorista and p.deleted_at is null
  for update of p;
  if not found then
    raise exception 'Parada não encontrada' using errcode = 'P0002';
  end if;
  if v_parada.rota_status <> 'em_operacao' then
    raise exception 'A rota não está em operação' using errcode = '22023';
  end if;
  if p_volume_ids is null or cardinality(p_volume_ids) not between 1 and 500 then
    raise exception 'Informe de 1 a 500 volumes' using errcode = '22023';
  end if;

  select count(*) into v_validos from public.app_motorista_volumes v
   where v.id = any (p_volume_ids) and v.parada_id = p_parada_id and v.deleted_at is null;
  if v_validos <> (select count(distinct x) from unnest(p_volume_ids) x) then
    raise exception 'Volume não pertence a esta parada' using errcode = '22023';
  end if;

  update public.app_motorista_volumes
     set status_leitura = 'bipado', lido_em = v_momento, lido_por = eu.o_motorista
   where id = any (p_volume_ids) and parada_id = p_parada_id and status_leitura <> 'bipado';
  get diagnostics v_bipados = row_count;

  return public.app_motorista_idem_concluir(p_chave, jsonb_build_object(
    'parada_id', p_parada_id, 'bipados', v_bipados, 'lido_em', v_momento));
end;
$fn$;

create or replace function public.app_motorista_confirmar_entrega(
  p_chave uuid, p_parada_id uuid, p_recebedor jsonb, p_assinatura_id uuid, p_fotos uuid[],
  p_lat numeric, p_lng numeric, p_precisao numeric, p_entregue_em timestamptz,
  p_dispositivo jsonb default '{}'::jsonb, p_observacoes text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  eu record;
  v_prev jsonb;
  v_parada record;
  v_momento timestamptz;
  v_id uuid := gen_random_uuid();
  v_sha text;
  v_dist numeric;
  v_dentro boolean;
  v_tipo text := p_recebedor ->> 'tipo';
begin
  select * into eu from public.app_motorista_eu();
  v_prev := public.app_motorista_idem_reservar(p_chave, eu.o_tenant, eu.o_motorista, 'confirmar_entrega');
  if v_prev is not null then return v_prev; end if;
  v_momento := public.app_motorista_momento(p_entregue_em, 'Horário da entrega');

  select p.*, r.status as rota_status into v_parada
  from public.app_motorista_paradas p
  join public.app_motorista_rotas r on r.id = p.rota_id
  where p.id = p_parada_id and p.tenant_id = eu.o_tenant and p.motorista_id = eu.o_motorista and p.deleted_at is null
  for update of p;
  if not found then
    raise exception 'Parada não encontrada' using errcode = 'P0002';
  end if;
  -- 'concluida': entrega feita offline que chega depois de a rota ser concluída.
  if v_parada.rota_status not in ('em_operacao', 'concluida') then
    raise exception 'A rota não está em operação' using errcode = '22023';
  end if;
  if v_parada.status in ('entregue', 'falha') then
    raise exception 'Parada já finalizada (%)', v_parada.status using errcode = '22023';
  end if;
  if length(coalesce(btrim(p_recebedor ->> 'nome'), '')) not between 2 and 120 then
    raise exception 'Nome de quem recebeu inválido (2 a 120 caracteres)' using errcode = '22023';
  end if;
  if length(p_recebedor ->> 'documento') > 30 or length(p_recebedor ->> 'tipo_outro') > 60 then
    raise exception 'Dados de quem recebeu acima do limite' using errcode = '22023';
  end if;
  if v_tipo is null or v_tipo not in ('proprio_destinatario', 'conjuge_familiar', 'porteiro_portaria',
      'recepcao_zelador', 'vizinho', 'funcionario_local', 'outro') then
    raise exception 'Vínculo de quem recebeu inválido' using errcode = '22023';
  end if;
  if v_tipo = 'outro' and coalesce(btrim(p_recebedor ->> 'tipo_outro'), '') = '' then
    raise exception 'Descreva o vínculo de quem recebeu' using errcode = '22023';
  end if;
  if p_assinatura_id is null then
    raise exception 'Assinatura do recebedor é obrigatória' using errcode = '22023';
  end if;
  if cardinality(coalesce(p_fotos, '{}')) > 5 then
    raise exception 'No máximo 5 fotos' using errcode = '22023';
  end if;
  if (p_lat is null) <> (p_lng is null) then
    raise exception 'Coordenada incompleta' using errcode = '22023';
  end if;

  v_dist := public.app_motorista_distancia_m(p_lat, p_lng, v_parada.lat, v_parada.lng);
  v_dentro := case when v_dist is null then null else v_dist <= public.app_motorista_raio_geofence(eu.o_tenant) end;

  insert into public.app_motorista_comprovantes (id, tenant_id, parada_id, rota_id, motorista_id,
    recebedor_nome, recebedor_documento, recebedor_titular, recebedor_tipo, recebedor_tipo_outro,
    observacoes, lat, lng, precisao_m, distancia_parada_m, dentro_geofence, entregue_em, dispositivo, chave_idempotencia)
  values (v_id, eu.o_tenant, p_parada_id, v_parada.rota_id, eu.o_motorista,
    btrim(p_recebedor ->> 'nome'), nullif(btrim(p_recebedor ->> 'documento'), ''),
    coalesce((p_recebedor ->> 'titular')::boolean, false), v_tipo,
    case when v_tipo = 'outro' then btrim(p_recebedor ->> 'tipo_outro') end,
    left(nullif(btrim(p_observacoes), ''), 300), p_lat, p_lng, p_precisao, v_dist, v_dentro, v_momento,
    coalesce(p_dispositivo, '{}'::jsonb), p_chave);

  perform public.app_motorista_vincular_arquivos(eu.o_tenant, eu.o_motorista, array[p_assinatura_id],
    'assinatura_entrega', 'app_motorista_comprovantes', v_id);
  perform public.app_motorista_vincular_arquivos(eu.o_tenant, eu.o_motorista, p_fotos,
    'foto_entrega', 'app_motorista_comprovantes', v_id);
  select a.sha256 into v_sha from public.app_motorista_arquivos a where a.documento_id = p_assinatura_id;
  update public.app_motorista_comprovantes
     set assinatura_documento_id = p_assinatura_id, assinatura_sha256 = v_sha
   where id = v_id;

  update public.app_motorista_paradas
     set status = 'entregue', finalizada_em = v_momento, chegada_em = coalesce(chegada_em, v_momento)
   where id = p_parada_id;

  return public.app_motorista_idem_concluir(p_chave, jsonb_build_object(
    'comprovante_id', v_id, 'parada_id', p_parada_id, 'status', 'entregue', 'entregue_em', v_momento,
    'assinatura_sha256', v_sha, 'distancia_parada_m', v_dist, 'dentro_geofence', v_dentro));
end;
$fn$;

create or replace function public.app_motorista_registrar_insucesso(
  p_chave uuid, p_parada_id uuid, p_motivo text, p_observacoes text, p_fotos uuid[],
  p_tentativas jsonb, p_lat numeric, p_lng numeric, p_precisao numeric, p_registrado_em timestamptz,
  p_devolver_volumes boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  eu record;
  v_prev jsonb;
  v_parada record;
  v_momento timestamptz;
  v_id uuid := gen_random_uuid();
  v_dist numeric;
  v_dentro boolean;
begin
  select * into eu from public.app_motorista_eu();
  v_prev := public.app_motorista_idem_reservar(p_chave, eu.o_tenant, eu.o_motorista, 'registrar_insucesso');
  if v_prev is not null then return v_prev; end if;
  v_momento := public.app_motorista_momento(p_registrado_em, 'Horário do insucesso');

  select p.*, r.status as rota_status into v_parada
  from public.app_motorista_paradas p
  join public.app_motorista_rotas r on r.id = p.rota_id
  where p.id = p_parada_id and p.tenant_id = eu.o_tenant and p.motorista_id = eu.o_motorista and p.deleted_at is null
  for update of p;
  if not found then
    raise exception 'Parada não encontrada' using errcode = 'P0002';
  end if;
  if v_parada.rota_status not in ('em_operacao', 'concluida') then
    raise exception 'A rota não está em operação' using errcode = '22023';
  end if;
  if v_parada.status in ('entregue', 'falha') then
    raise exception 'Parada já finalizada (%)', v_parada.status using errcode = '22023';
  end if;
  if p_motivo is null or p_motivo not in ('cliente_ausente', 'endereco_nao_localizado', 'recusado', 'avaria', 'acesso_risco', 'outro') then
    raise exception 'Motivo inválido' using errcode = '22023';
  end if;
  if cardinality(coalesce(p_fotos, '{}')) > 5 then
    raise exception 'No máximo 5 fotos' using errcode = '22023';
  end if;
  if (p_lat is null) <> (p_lng is null) then
    raise exception 'Coordenada incompleta' using errcode = '22023';
  end if;

  v_dist := public.app_motorista_distancia_m(p_lat, p_lng, v_parada.lat, v_parada.lng);
  v_dentro := case when v_dist is null then null else v_dist <= public.app_motorista_raio_geofence(eu.o_tenant) end;

  insert into public.app_motorista_insucessos (id, tenant_id, parada_id, rota_id, motorista_id, motivo, observacoes,
    tentativas_contato, lat, lng, precisao_m, distancia_parada_m, dentro_geofence, registrado_em,
    devolver_volumes, chave_idempotencia)
  values (v_id, eu.o_tenant, p_parada_id, v_parada.rota_id, eu.o_motorista, p_motivo, left(nullif(btrim(p_observacoes), ''), 500),
    case when jsonb_typeof(p_tentativas) = 'array' then p_tentativas else '[]'::jsonb end,
    p_lat, p_lng, p_precisao, v_dist, v_dentro, v_momento, coalesce(p_devolver_volumes, false), p_chave);

  perform public.app_motorista_vincular_arquivos(eu.o_tenant, eu.o_motorista, p_fotos,
    'foto_insucesso', 'app_motorista_insucessos', v_id);

  update public.app_motorista_paradas
     set status = 'falha', finalizada_em = v_momento, chegada_em = coalesce(chegada_em, v_momento)
   where id = p_parada_id;

  if coalesce(p_devolver_volumes, false) then
    update public.app_motorista_volumes set status_devolucao = 'devolver'
     where parada_id = p_parada_id and status_devolucao = 'none';
  end if;

  return public.app_motorista_idem_concluir(p_chave, jsonb_build_object(
    'insucesso_id', v_id, 'parada_id', p_parada_id, 'status', 'falha', 'registrado_em', v_momento,
    'distancia_parada_m', v_dist, 'dentro_geofence', v_dentro));
end;
$fn$;

-- Pontos GPS em lote. Idempotente pela PK (rota_id, registrado_em); ponto
-- inválido ou fora da janela da rota é descartado (não trava a fila).
create or replace function public.app_motorista_registrar_gps(p_rota_id uuid, p_pontos jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  eu record;
  v_rota record;
  v_inseridos integer;
begin
  select * into eu from public.app_motorista_eu();
  select * into v_rota from public.app_motorista_rotas r
   where r.id = p_rota_id and r.tenant_id = eu.o_tenant and r.motorista_id = eu.o_motorista and r.deleted_at is null;
  if not found then
    raise exception 'Rota não encontrada' using errcode = 'P0002';
  end if;
  if jsonb_typeof(p_pontos) is distinct from 'array' or jsonb_array_length(p_pontos) > 500 then
    raise exception 'Envie um lote de até 500 pontos' using errcode = '22023';
  end if;
  if v_rota.iniciada_em is null then
    return 0;
  end if;

  insert into public.app_motorista_gps_pontos (tenant_id, motorista_id, rota_id, registrado_em, lat, lng,
    velocidade_kmh, precisao_m, rumo_graus)
  select eu.o_tenant, eu.o_motorista, p_rota_id, x.t, x.lat, x.lng,
    case when x.speed between 0 and 400 then x.speed end,
    case when x.accuracy >= 0 then x.accuracy end,
    case when x.heading >= 0 and x.heading < 360 then x.heading end
  from jsonb_to_recordset(p_pontos) as x(t timestamptz, lat numeric, lng numeric, speed numeric, accuracy numeric, heading numeric)
  where x.t is not null and x.lat between -90 and 90 and x.lng between -180 and 180
    and x.t >= v_rota.iniciada_em - interval '10 minutes'
    and x.t <= least(coalesce(v_rota.finalizada_em, now()) + interval '10 minutes', now() + interval '5 minutes')
  on conflict (rota_id, registrado_em) do nothing;
  get diagnostics v_inseridos = row_count;
  return v_inseridos;
end;
$fn$;

create or replace function public.app_motorista_atualizar_polyline(p_rota_id uuid, p_polyline text)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  eu record;
begin
  select * into eu from public.app_motorista_eu();
  if p_polyline is not null and length(p_polyline) > 200000 then
    raise exception 'Polyline acima do limite' using errcode = '22001';
  end if;
  update public.app_motorista_rotas set polyline = p_polyline
   where id = p_rota_id and tenant_id = eu.o_tenant and motorista_id = eu.o_motorista
     and deleted_at is null and status = 'em_operacao';
  if not found then
    raise exception 'Rota não encontrada ou fora de operação' using errcode = 'P0002';
  end if;
end;
$fn$;

-- Concluir: paradas não atendidas viram 'reagendada' (a rota não fica presa).
create or replace function public.app_motorista_concluir_rota(p_chave uuid, p_rota_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  eu record;
  v_prev jsonb;
  v_status text;
  v_reagendadas integer;
begin
  select * into eu from public.app_motorista_eu();
  v_prev := public.app_motorista_idem_reservar(p_chave, eu.o_tenant, eu.o_motorista, 'concluir_rota');
  if v_prev is not null then return v_prev; end if;

  select r.status into v_status from public.app_motorista_rotas r
   where r.id = p_rota_id and r.tenant_id = eu.o_tenant and r.motorista_id = eu.o_motorista and r.deleted_at is null
   for update;
  if v_status is null then
    raise exception 'Rota não encontrada' using errcode = 'P0002';
  end if;
  if v_status <> 'em_operacao' then
    raise exception 'A rota não está em operação (status %)', v_status using errcode = '22023';
  end if;

  update public.app_motorista_paradas set status = 'reagendada'
   where rota_id = p_rota_id and status in ('nao_iniciada', 'em_rota', 'em_atendimento') and deleted_at is null;
  get diagnostics v_reagendadas = row_count;

  update public.app_motorista_rotas set status = 'concluida' where id = p_rota_id;

  return public.app_motorista_idem_concluir(p_chave, jsonb_build_object(
    'rota_id', p_rota_id, 'status', 'concluida', 'paradas_reagendadas', v_reagendadas));
end;
$fn$;

create or replace function public.app_motorista_encerrar_turno(
  p_chave uuid, p_rota_id uuid, p_itens jsonb, p_odometro numeric,
  p_foto_odometro_id uuid default null, p_concluido_em timestamptz default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  eu record;
  v_prev jsonb;
  v_rota record;
  v_momento timestamptz;
  v_checklist uuid;
begin
  select * into eu from public.app_motorista_eu();
  v_prev := public.app_motorista_idem_reservar(p_chave, eu.o_tenant, eu.o_motorista, 'encerrar_turno');
  if v_prev is not null then return v_prev; end if;
  v_momento := public.app_motorista_momento(p_concluido_em, 'Horário do checklist');

  select * into v_rota from public.app_motorista_rotas r
   where r.id = p_rota_id and r.tenant_id = eu.o_tenant and r.motorista_id = eu.o_motorista and r.deleted_at is null
   for update;
  if not found then
    raise exception 'Rota não encontrada' using errcode = 'P0002';
  end if;
  if v_rota.status not in ('concluida', 'retorno_ok') then
    raise exception 'Conclua a rota antes de encerrar o turno (status %)', v_rota.status using errcode = '22023';
  end if;
  if jsonb_typeof(p_itens) is distinct from 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Checklist sem itens' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_array_elements(p_itens) i
              where coalesce(i ->> 'key', '') = '' or (i -> 'ok') is distinct from 'true'::jsonb) then
    raise exception 'Checklist de retorno com item reprovado ou incompleto' using errcode = '22023';
  end if;
  if p_odometro is null or p_odometro <= 0 or p_odometro >= 10000000 then
    raise exception 'Odômetro inválido' using errcode = '22023';
  end if;
  if v_rota.odometro_inicial is not null and p_odometro < v_rota.odometro_inicial then
    raise exception 'Odômetro final menor que o inicial (% km)', v_rota.odometro_inicial using errcode = '22023';
  end if;

  insert into public.app_motorista_checklists (tenant_id, rota_id, motorista_id, tms_veiculo_id, tipo, itens,
    odometro_km, declaracao_aceita, concluido_em, chave_idempotencia)
  values (eu.o_tenant, p_rota_id, eu.o_motorista, v_rota.tms_veiculo_id, 'retorno', p_itens,
    p_odometro, true, v_momento, p_chave)
  returning id into v_checklist;

  if p_foto_odometro_id is not null then
    perform public.app_motorista_vincular_arquivos(eu.o_tenant, eu.o_motorista, array[p_foto_odometro_id],
      'foto_odometro', 'app_motorista_checklists', v_checklist);
    update public.app_motorista_checklists set foto_odometro_id = p_foto_odometro_id where id = v_checklist;
  end if;

  update public.app_motorista_rotas
     set status = 'encerrada', finalizada_em = v_momento, odometro_final = p_odometro,
         foto_odometro_final_id = p_foto_odometro_id
   where id = p_rota_id;

  if v_rota.tms_veiculo_id is not null then
    update public.tms_veiculos
       set hodometro_km = p_odometro
     where tenant_id = eu.o_tenant and id = v_rota.tms_veiculo_id
       and (hodometro_km is null or hodometro_km < p_odometro);
  end if;

  return public.app_motorista_idem_concluir(p_chave, jsonb_build_object(
    'rota_id', p_rota_id, 'status', 'encerrada', 'finalizada_em', v_momento, 'checklist_id', v_checklist));
end;
$fn$;

create or replace function public.app_motorista_reportar_alerta_via(
  p_chave uuid, p_tipo text, p_lat numeric, p_lng numeric, p_reportado_em timestamptz,
  p_rota_id uuid default null, p_foto_id uuid default null, p_observacoes text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  eu record;
  v_prev jsonb;
  v_id uuid := gen_random_uuid();
  v_momento timestamptz;
begin
  select * into eu from public.app_motorista_eu();
  v_prev := public.app_motorista_idem_reservar(p_chave, eu.o_tenant, eu.o_motorista, 'reportar_alerta_via');
  if v_prev is not null then return v_prev; end if;
  v_momento := public.app_motorista_momento(p_reportado_em, 'Horário do alerta');
  if p_rota_id is not null and not exists (select 1 from public.app_motorista_rotas r
       where r.id = p_rota_id and r.motorista_id = eu.o_motorista and r.deleted_at is null) then
    raise exception 'Rota não encontrada' using errcode = 'P0002';
  end if;
  insert into public.app_motorista_alertas_via (id, tenant_id, rota_id, motorista_id, tipo, lat, lng, observacoes,
    reportado_em, chave_idempotencia)
  values (v_id, eu.o_tenant, p_rota_id, eu.o_motorista, p_tipo, p_lat, p_lng, left(nullif(btrim(p_observacoes), ''), 500),
    v_momento, p_chave);
  if p_foto_id is not null then
    perform public.app_motorista_vincular_arquivos(eu.o_tenant, eu.o_motorista, array[p_foto_id],
      'foto_alerta', 'app_motorista_alertas_via', v_id);
    update public.app_motorista_alertas_via set foto_documento_id = p_foto_id where id = v_id;
  end if;
  return public.app_motorista_idem_concluir(p_chave, jsonb_build_object('alerta_id', v_id));
end;
$fn$;

-- ==========================================================================
-- Emergência (fluxo próprio, fora da fila de chamados)
-- ==========================================================================
create or replace function public.app_motorista_acionar_emergencia(
  p_chave uuid, p_tipo text, p_lat numeric, p_lng numeric, p_precisao numeric,
  p_acionada_em timestamptz, p_rota_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  eu record;
  v_prev jsonb;
  v_id uuid;
  v_momento timestamptz;
  v_rota uuid;
  v_ja_aberta boolean := false;
begin
  select * into eu from public.app_motorista_eu();
  v_prev := public.app_motorista_idem_reservar(p_chave, eu.o_tenant, eu.o_motorista, 'acionar_emergencia');
  if v_prev is not null then return v_prev; end if;
  -- Emergência nunca é recusada por horário: vale o do servidor se o do aparelho for implausível.
  v_momento := case when p_acionada_em between now() - interval '30 days' and now() + interval '5 minutes'
                    then p_acionada_em else now() end;
  if p_tipo is null or p_tipo not in ('acidente', 'mal_subito', 'roubo_assalto', 'pane_local_risco', 'outro') then
    raise exception 'Tipo de emergência inválido' using errcode = '22023';
  end if;
  select r.id into v_rota from public.app_motorista_rotas r
   where r.motorista_id = eu.o_motorista and r.deleted_at is null
     and (r.id = p_rota_id or (p_rota_id is null and r.status = 'em_operacao'))
   order by r.data desc limit 1;

  -- Uma emergência em aberto por vez: novo toque atualiza a posição da existente.
  select e.id into v_id from public.app_motorista_emergencias e
   where e.motorista_id = eu.o_motorista and e.status in ('aberta', 'reconhecida', 'em_atendimento') and e.deleted_at is null
   order by e.acionada_em desc limit 1
   for update;
  if v_id is not null then
    v_ja_aberta := true;
    if p_lat is not null and p_lng is not null then
      update public.app_motorista_emergencias set lat = p_lat, lng = p_lng, precisao_m = p_precisao where id = v_id;
    end if;
  else
    insert into public.app_motorista_emergencias (tenant_id, motorista_id, rota_id, tipo, lat, lng, precisao_m,
      acionada_em, chave_idempotencia)
    values (eu.o_tenant, eu.o_motorista, v_rota, p_tipo,
      case when p_lat between -90 and 90 then p_lat end, case when p_lng between -180 and 180 then p_lng end,
      case when p_precisao >= 0 then p_precisao end, v_momento, p_chave)
    returning id into v_id;
  end if;

  return public.app_motorista_idem_concluir(p_chave, jsonb_build_object(
    'emergencia_id', v_id, 'status', (select e.status from public.app_motorista_emergencias e where e.id = v_id),
    'ja_estava_aberta', v_ja_aberta,
    'telefone_central', (select c.telefone_central from public.app_motorista_config c where c.tenant_id = eu.o_tenant)));
end;
$fn$;

-- ==========================================================================
-- Chamados
-- ==========================================================================
create or replace function public.app_motorista_abrir_chamado(
  p_chave uuid, p_categoria text, p_assunto text, p_descricao text,
  p_rota_id uuid default null, p_recibo_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  eu record;
  v_prev jsonb;
  v_codigo text;
begin
  select * into eu from public.app_motorista_eu();
  v_prev := public.app_motorista_idem_reservar(p_chave, eu.o_tenant, eu.o_motorista, 'abrir_chamado');
  if v_prev is not null then return v_prev; end if;
  v_codigo := public.app_motorista_abrir_chamado_interno(eu.o_tenant, eu.o_motorista, eu.o_nome, p_chave,
    p_categoria, p_assunto, p_descricao, p_rota_id, p_recibo_id);
  return public.app_motorista_idem_concluir(p_chave, jsonb_build_object('codigo', v_codigo));
end;
$fn$;

-- LGPD: pedido de exclusão de conta vira chamado padronizado para a Central.
create or replace function public.app_motorista_solicitar_exclusao_conta(p_chave uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  eu record;
  v_prev jsonb;
  v_codigo text;
begin
  select * into eu from public.app_motorista_eu();
  v_prev := public.app_motorista_idem_reservar(p_chave, eu.o_tenant, eu.o_motorista, 'solicitar_exclusao_conta');
  if v_prev is not null then return v_prev; end if;
  v_codigo := public.app_motorista_abrir_chamado_interno(eu.o_tenant, eu.o_motorista, eu.o_nome, p_chave, 'outro',
    'Solicitação de Exclusão de Conta',
    'Motorista solicitou a exclusão definitiva da conta e dos dados pessoais (LGPD).', null, null);
  return public.app_motorista_idem_concluir(p_chave, jsonb_build_object('codigo', v_codigo));
end;
$fn$;

-- ==========================================================================
-- Perfil, preferências, notificações
-- ==========================================================================
create or replace function public.app_motorista_atualizar_perfil(
  p_telefone text, p_email_pessoal text, p_endereco jsonb, p_contato_emergencia jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  eu record;
begin
  select * into eu from public.app_motorista_eu();
  if p_telefone is not null and regexp_replace(p_telefone, '\D', '', 'g') !~ '^[0-9]{10,13}$' then
    raise exception 'Telefone inválido' using errcode = '22023';
  end if;
  if nullif(btrim(p_email_pessoal), '') is not null and btrim(p_email_pessoal) !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'E-mail inválido' using errcode = '22023';
  end if;
  if p_endereco is not null and (jsonb_typeof(p_endereco) <> 'object' or length(p_endereco::text) > 2000) then
    raise exception 'Endereço inválido' using errcode = '22023';
  end if;
  if p_contato_emergencia is not null and (jsonb_typeof(p_contato_emergencia) <> 'object' or length(p_contato_emergencia::text) > 1000) then
    raise exception 'Contato de emergência inválido' using errcode = '22023';
  end if;
  update public.app_motorista_perfis
     set telefone = coalesce(p_telefone, telefone),
         email_pessoal = case when p_email_pessoal is null then email_pessoal else nullif(btrim(p_email_pessoal), '') end,
         endereco = coalesce(p_endereco, endereco),
         contato_emergencia = coalesce(p_contato_emergencia, contato_emergencia)
   where user_id = eu.o_motorista;
  return (select to_jsonb(p) - 'deleted_at' - 'tenant_id' from public.app_motorista_perfis p where p.user_id = eu.o_motorista);
end;
$fn$;

create or replace function public.app_motorista_definir_avatar(p_documento_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  eu record;
begin
  select * into eu from public.app_motorista_eu();
  if p_documento_id is not null then
    perform public.app_motorista_vincular_arquivos(eu.o_tenant, eu.o_motorista, array[p_documento_id],
      'avatar', 'app_motorista_perfis', eu.o_motorista);
  end if;
  update public.app_motorista_perfis set avatar_documento_id = p_documento_id where user_id = eu.o_motorista;
end;
$fn$;

create or replace function public.app_motorista_atualizar_preferencias(p_preferencias jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  eu record;
  v_chave text;
begin
  select * into eu from public.app_motorista_eu();
  if jsonb_typeof(p_preferencias) is distinct from 'object' then
    raise exception 'Preferências inválidas' using errcode = '22023';
  end if;
  for v_chave in select jsonb_object_keys(p_preferencias) loop
    if v_chave not in ('app_navegacao', 'alertas_sonoros', 'bipe_leitura', 'tema', 'orientacao',
                       'area_mapa_offline', 'mapa_offline_mb', 'lembrar_login') then
      raise exception 'Preferência desconhecida: %', v_chave using errcode = '22023';
    end if;
  end loop;
  insert into public.app_motorista_preferencias (user_id, tenant_id) values (eu.o_motorista, eu.o_tenant)
  on conflict (user_id) do nothing;
  update public.app_motorista_preferencias x set
    app_navegacao = coalesce(p_preferencias ->> 'app_navegacao', x.app_navegacao),
    alertas_sonoros = coalesce((p_preferencias ->> 'alertas_sonoros')::boolean, x.alertas_sonoros),
    bipe_leitura = coalesce((p_preferencias ->> 'bipe_leitura')::boolean, x.bipe_leitura),
    tema = coalesce(p_preferencias ->> 'tema', x.tema),
    orientacao = coalesce(p_preferencias ->> 'orientacao', x.orientacao),
    area_mapa_offline = case when p_preferencias ? 'area_mapa_offline' then p_preferencias ->> 'area_mapa_offline' else x.area_mapa_offline end,
    mapa_offline_mb = case when p_preferencias ? 'mapa_offline_mb' then (p_preferencias ->> 'mapa_offline_mb')::numeric else x.mapa_offline_mb end,
    lembrar_login = coalesce((p_preferencias ->> 'lembrar_login')::boolean, x.lembrar_login)
  where x.user_id = eu.o_motorista;
  return (select to_jsonb(x) - 'tenant_id' from public.app_motorista_preferencias x where x.user_id = eu.o_motorista);
end;
$fn$;

create or replace function public.app_motorista_marcar_notificacao_lida(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  eu record;
begin
  select * into eu from public.app_motorista_eu();
  update public.app_motorista_notificacoes set lida_em = coalesce(lida_em, now())
   where id = p_id and tenant_id = eu.o_tenant and motorista_id = eu.o_motorista;
end;
$fn$;

-- ==========================================================================
-- Recibo
-- ==========================================================================
-- Hash = SHA-256 do JSON canônico (recibo + itens + hash dos bytes da
-- assinatura gravados pela Edge Function + momento). Nada vem do cliente.
create or replace function public.app_motorista_assinar_recibo(
  p_chave uuid, p_recibo_id uuid, p_assinatura_id uuid, p_lat numeric default null, p_lng numeric default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  eu record;
  v_prev jsonb;
  v_recibo record;
  v_agora timestamptz := now();
  v_sha_assinatura text;
  v_hash text;
  v_ip inet;
  v_conta jsonb;
begin
  select * into eu from public.app_motorista_eu();
  v_prev := public.app_motorista_idem_reservar(p_chave, eu.o_tenant, eu.o_motorista, 'assinar_recibo');
  if v_prev is not null then return v_prev; end if;

  select * into v_recibo from public.app_motorista_recibos r
   where r.id = p_recibo_id and r.tenant_id = eu.o_tenant and r.motorista_id = eu.o_motorista and r.deleted_at is null
   for update;
  if not found then
    raise exception 'Recibo não encontrado' using errcode = 'P0002';
  end if;
  if v_recibo.status <> 'pendente_assinatura' then
    raise exception 'Recibo não está aguardando assinatura (status %)', v_recibo.status using errcode = '22023';
  end if;
  if v_recibo.prazo_assinatura is not null and v_recibo.prazo_assinatura < v_agora then
    raise exception 'Prazo de assinatura encerrado; fale com a Central' using errcode = '22023';
  end if;
  if p_assinatura_id is null then
    raise exception 'Assinatura obrigatória' using errcode = '22023';
  end if;

  perform public.app_motorista_vincular_arquivos(eu.o_tenant, eu.o_motorista, array[p_assinatura_id],
    'assinatura_recibo', 'app_motorista_recibos', p_recibo_id);
  select a.sha256 into v_sha_assinatura from public.app_motorista_arquivos a where a.documento_id = p_assinatura_id;

  select jsonb_build_object('banco_codigo', c.banco_codigo, 'banco_nome', c.banco_nome, 'agencia', c.agencia,
           'conta', c.conta, 'tipo_conta', c.tipo_conta, 'pix_tipo', c.pix_tipo, 'pix_chave', c.pix_chave)
    into v_conta
  from public.app_motorista_contas_bancarias c
  where c.motorista_id = eu.o_motorista and c.situacao = 'ativa' and c.principal and c.deleted_at is null;

  v_hash := encode(sha256(convert_to(jsonb_build_object(
    'recibo', jsonb_build_object('id', v_recibo.id, 'codigo', v_recibo.codigo, 'motorista_id', v_recibo.motorista_id,
      'periodo_inicio', v_recibo.periodo_inicio, 'periodo_fim', v_recibo.periodo_fim,
      'bruto', v_recibo.bruto, 'descontos_total', v_recibo.descontos_total, 'liquido', v_recibo.liquido),
    'itens', coalesce((select jsonb_agg(jsonb_build_object('grupo', i.grupo, 'rotulo', i.rotulo, 'valor', i.valor)
                         order by i.grupo, i.rotulo, i.valor)
                       from public.app_motorista_recibo_itens i where i.recibo_id = v_recibo.id), '[]'::jsonb),
    'assinatura_sha256', v_sha_assinatura,
    'assinado_em', v_agora)::text, 'UTF8')), 'hex');

  -- IP do cabeçalho repassado pelo gateway (primeiro da lista); inválido → null.
  begin
    v_ip := nullif(btrim(split_part(coalesce(
      (nullif(current_setting('request.headers', true), '')::jsonb) ->> 'x-forwarded-for', ''), ',', 1)), '')::inet;
  exception when others then
    v_ip := null;
  end;

  update public.app_motorista_recibos
     set status = 'assinado', assinado_em = v_agora, assinatura_documento_id = p_assinatura_id,
         assinatura_sha256 = v_hash, assinatura_lat = case when p_lat between -90 and 90 then p_lat end,
         assinatura_lng = case when p_lng between -180 and 180 then p_lng end, assinatura_ip = v_ip,
         conta_snapshot = coalesce(v_conta, conta_snapshot)
   where id = p_recibo_id;

  return public.app_motorista_idem_concluir(p_chave, jsonb_build_object(
    'recibo_id', p_recibo_id, 'status', 'assinado', 'assinado_em', v_agora, 'assinatura_sha256', v_hash));
end;
$fn$;

-- ==========================================================================
-- Grants: só as RPCs públicas do motorista
-- ==========================================================================
revoke all on function public.app_motorista_contexto() from public, anon;
revoke all on function public.app_motorista_meu_veiculo(uuid) from public, anon;
revoke all on function public.app_motorista_meus_documentos() from public, anon;
revoke all on function public.app_motorista_minhas_contas() from public, anon;
revoke all on function public.app_motorista_meus_chamados(integer) from public, anon;
revoke all on function public.app_motorista_iniciar_rota(uuid, uuid, jsonb, numeric, uuid, timestamptz) from public, anon;
revoke all on function public.app_motorista_bipar_volumes(uuid, uuid, uuid[], timestamptz) from public, anon;
revoke all on function public.app_motorista_confirmar_entrega(uuid, uuid, jsonb, uuid, uuid[], numeric, numeric, numeric, timestamptz, jsonb, text) from public, anon;
revoke all on function public.app_motorista_registrar_insucesso(uuid, uuid, text, text, uuid[], jsonb, numeric, numeric, numeric, timestamptz, boolean) from public, anon;
revoke all on function public.app_motorista_registrar_gps(uuid, jsonb) from public, anon;
revoke all on function public.app_motorista_atualizar_polyline(uuid, text) from public, anon;
revoke all on function public.app_motorista_concluir_rota(uuid, uuid) from public, anon;
revoke all on function public.app_motorista_encerrar_turno(uuid, uuid, jsonb, numeric, uuid, timestamptz) from public, anon;
revoke all on function public.app_motorista_reportar_alerta_via(uuid, text, numeric, numeric, timestamptz, uuid, uuid, text) from public, anon;
revoke all on function public.app_motorista_acionar_emergencia(uuid, text, numeric, numeric, numeric, timestamptz, uuid) from public, anon;
revoke all on function public.app_motorista_abrir_chamado(uuid, text, text, text, uuid, uuid) from public, anon;
revoke all on function public.app_motorista_solicitar_exclusao_conta(uuid) from public, anon;
revoke all on function public.app_motorista_atualizar_perfil(text, text, jsonb, jsonb) from public, anon;
revoke all on function public.app_motorista_definir_avatar(uuid) from public, anon;
revoke all on function public.app_motorista_atualizar_preferencias(jsonb) from public, anon;
revoke all on function public.app_motorista_marcar_notificacao_lida(uuid) from public, anon;
revoke all on function public.app_motorista_assinar_recibo(uuid, uuid, uuid, numeric, numeric) from public, anon;

grant execute on function public.app_motorista_contexto() to authenticated;
grant execute on function public.app_motorista_meu_veiculo(uuid) to authenticated;
grant execute on function public.app_motorista_meus_documentos() to authenticated;
grant execute on function public.app_motorista_minhas_contas() to authenticated;
grant execute on function public.app_motorista_meus_chamados(integer) to authenticated;
grant execute on function public.app_motorista_iniciar_rota(uuid, uuid, jsonb, numeric, uuid, timestamptz) to authenticated;
grant execute on function public.app_motorista_bipar_volumes(uuid, uuid, uuid[], timestamptz) to authenticated;
grant execute on function public.app_motorista_confirmar_entrega(uuid, uuid, jsonb, uuid, uuid[], numeric, numeric, numeric, timestamptz, jsonb, text) to authenticated;
grant execute on function public.app_motorista_registrar_insucesso(uuid, uuid, text, text, uuid[], jsonb, numeric, numeric, numeric, timestamptz, boolean) to authenticated;
grant execute on function public.app_motorista_registrar_gps(uuid, jsonb) to authenticated;
grant execute on function public.app_motorista_atualizar_polyline(uuid, text) to authenticated;
grant execute on function public.app_motorista_concluir_rota(uuid, uuid) to authenticated;
grant execute on function public.app_motorista_encerrar_turno(uuid, uuid, jsonb, numeric, uuid, timestamptz) to authenticated;
grant execute on function public.app_motorista_reportar_alerta_via(uuid, text, numeric, numeric, timestamptz, uuid, uuid, text) to authenticated;
grant execute on function public.app_motorista_acionar_emergencia(uuid, text, numeric, numeric, numeric, timestamptz, uuid) to authenticated;
grant execute on function public.app_motorista_abrir_chamado(uuid, text, text, text, uuid, uuid) to authenticated;
grant execute on function public.app_motorista_solicitar_exclusao_conta(uuid) to authenticated;
grant execute on function public.app_motorista_atualizar_perfil(text, text, jsonb, jsonb) to authenticated;
grant execute on function public.app_motorista_definir_avatar(uuid) to authenticated;
grant execute on function public.app_motorista_atualizar_preferencias(jsonb) to authenticated;
grant execute on function public.app_motorista_marcar_notificacao_lida(uuid) to authenticated;
grant execute on function public.app_motorista_assinar_recibo(uuid, uuid, uuid, numeric, numeric) to authenticated;
