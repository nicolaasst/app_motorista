-- App Motorista, lote D — RPCs internas (operadores do TMS) e leitura auditada.
--
-- Chamadas pelo portal interno do TMS ou por integração. Cada uma exige
-- portal interno + a permissão do vocabulário existente (nada novo):
--   rh.editar          vincular motorista, ativar/suspender, documentos pessoais
--   tms.operar         publicar rota, tratar emergência, configuração do app
--   financeiro.lancar  emitir recibo, cadastrar conta bancária
--   financeiro.conciliar marcar recibo como pago
--   atendimento.registrar FAQ do app
-- O tenant vem da claim tenant_id do operador (tenant plataforma).
--
-- Sem bloco `do $$`; corpo de função com $fn$.

create or replace function public.app_motorista_exigir_interno(p_permissao text)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_tenant uuid := nullif((select auth.jwt()) ->> 'tenant_id', '')::uuid;
begin
  if v_tenant is null or not public.app_motorista_interno_pode(p_permissao) then
    raise exception 'Requer a permissão % no portal interno', p_permissao using errcode = '42501';
  end if;
  return v_tenant;
end;
$fn$;
revoke all on function public.app_motorista_exigir_interno(text) from public, anon, authenticated;

-- ==========================================================================
-- Cadastro do motorista
-- ==========================================================================
-- Liga uma conta já existente no Auth (convite/cadastro feito pelo Dashboard
-- ou pela Edge Function de convite) ao app: public.users (portal app-motorista,
-- perfil motorista_terceiro) + perfil completo + preferências padrão.
create or replace function public.app_motorista_vincular_motorista(
  p_email text, p_nome text, p_cpf text, p_matricula text default null,
  p_motorista_agregado_id text default null, p_telefone text default null,
  p_cnh_numero text default null, p_cnh_categoria text default null, p_cnh_validade date default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_tenant uuid := public.app_motorista_exigir_interno('rh.editar');
  v_user uuid;
  v_role uuid;
  v_cpf text := regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g');
  v_portal_atual text;
begin
  if (select t.tipo from public.tenants t where t.id = v_tenant) is distinct from 'plataforma' then
    raise exception 'Motoristas são cadastrados pelo tenant plataforma' using errcode = '42501';
  end if;
  if v_cpf !~ '^[0-9]{11}$' then
    raise exception 'CPF inválido' using errcode = '22023';
  end if;
  select u.id into v_user from auth.users u where lower(u.email) = lower(btrim(p_email));
  if v_user is null then
    raise exception 'E-mail % não tem conta no Auth (envie o convite antes)', p_email using errcode = 'P0002';
  end if;
  select u.portal into v_portal_atual from public.users u where u.id = v_user;
  if v_portal_atual is not null and v_portal_atual <> 'app-motorista' then
    raise exception 'Este e-mail já é usuário do portal %; use outro e-mail para o motorista', v_portal_atual
      using errcode = '22023';
  end if;
  select r.id into v_role from public.roles r where r.code = 'motorista_terceiro';

  insert into public.users (id, tenant_id, role_id, nome, email, portal, ativo)
  values (v_user, v_tenant, v_role, btrim(p_nome), lower(btrim(p_email)), 'app-motorista', true)
  on conflict (id) do update
    set tenant_id = excluded.tenant_id, role_id = excluded.role_id, nome = excluded.nome,
        portal = excluded.portal, ativo = true;

  insert into public.app_motorista_perfis (user_id, tenant_id, motorista_agregado_id, nome_completo, matricula, cpf,
    telefone, email_corporativo, cnh_numero, cnh_categoria, cnh_validade, situacao_cadastro)
  values (v_user, v_tenant, nullif(btrim(p_motorista_agregado_id), ''), btrim(p_nome), nullif(btrim(p_matricula), ''), v_cpf,
    nullif(btrim(p_telefone), ''), lower(btrim(p_email)), nullif(btrim(p_cnh_numero), ''), nullif(btrim(p_cnh_categoria), ''),
    p_cnh_validade, 'ativo')
  on conflict (user_id) do update
    set motorista_agregado_id = excluded.motorista_agregado_id, nome_completo = excluded.nome_completo,
        matricula = excluded.matricula, cpf = excluded.cpf, telefone = coalesce(excluded.telefone, public.app_motorista_perfis.telefone),
        email_corporativo = excluded.email_corporativo,
        cnh_numero = coalesce(excluded.cnh_numero, public.app_motorista_perfis.cnh_numero),
        cnh_categoria = coalesce(excluded.cnh_categoria, public.app_motorista_perfis.cnh_categoria),
        cnh_validade = coalesce(excluded.cnh_validade, public.app_motorista_perfis.cnh_validade),
        situacao_cadastro = 'ativo', deleted_at = null;

  insert into public.app_motorista_preferencias (user_id, tenant_id) values (v_user, v_tenant)
  on conflict (user_id) do nothing;
  return v_user;
end;
$fn$;

-- Ativar / inativar / suspender. users.ativo acompanha: sem claims no próximo
-- token, e toda RPC do motorista já recusa na hora (app_motorista_eu).
create or replace function public.app_motorista_definir_situacao(p_user_id uuid, p_situacao text)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_tenant uuid := public.app_motorista_exigir_interno('rh.editar');
begin
  if p_situacao not in ('ativo', 'inativo', 'suspenso') then
    raise exception 'Situação inválida' using errcode = '22023';
  end if;
  update public.app_motorista_perfis set situacao_cadastro = p_situacao
   where user_id = p_user_id and tenant_id = v_tenant;
  if not found then
    raise exception 'Motorista não encontrado' using errcode = 'P0002';
  end if;
  update public.users set ativo = (p_situacao = 'ativo')
   where id = p_user_id and tenant_id = v_tenant and portal = 'app-motorista';
end;
$fn$;

create or replace function public.app_motorista_registrar_documento_pessoal(
  p_motorista_id uuid, p_tipo text, p_titulo text, p_subtitulo text, p_valido_ate date, p_documento_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_tenant uuid := public.app_motorista_exigir_interno('rh.editar');
  v_id uuid;
begin
  if not exists (select 1 from public.app_motorista_perfis p where p.user_id = p_motorista_id and p.tenant_id = v_tenant) then
    raise exception 'Motorista não encontrado' using errcode = 'P0002';
  end if;
  if p_documento_id is not null and not exists (
       select 1 from public.documents d where d.id = p_documento_id and d.tenant_id = v_tenant and d.deleted_at is null) then
    raise exception 'Arquivo não encontrado neste tenant' using errcode = 'P0002';
  end if;
  update public.app_motorista_documentos_pessoais set deleted_at = now()
   where motorista_id = p_motorista_id and tipo = p_tipo and deleted_at is null;
  insert into public.app_motorista_documentos_pessoais (tenant_id, motorista_id, tipo, titulo, subtitulo, valido_ate,
    documento_id, enviado_em)
  values (v_tenant, p_motorista_id, p_tipo, p_titulo, p_subtitulo, p_valido_ate, p_documento_id,
    case when p_documento_id is not null then now() end)
  returning id into v_id;
  return v_id;
end;
$fn$;

-- ==========================================================================
-- Rota
-- ==========================================================================
-- Publica (ou republica, enquanto 'planejada') a rota do motorista, com
-- paradas e volumes. Formato de p_rota em docs/OPERACAO_APP_MOTORISTA.md.
create or replace function public.app_motorista_publicar_rota(p_motorista_id uuid, p_rota jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_tenant uuid := public.app_motorista_exigir_interno('tms.operar');
  v_codigo text := btrim(p_rota ->> 'codigo');
  v_rota uuid;
  v_status text;
  v_parada jsonb;
  v_parada_id uuid;
  v_volume jsonb;
begin
  if not exists (select 1 from public.app_motorista_perfis p where p.user_id = p_motorista_id
                   and p.tenant_id = v_tenant and p.situacao_cadastro = 'ativo' and p.deleted_at is null) then
    raise exception 'Motorista ativo não encontrado' using errcode = 'P0002';
  end if;
  if coalesce(v_codigo, '') = '' or (p_rota ->> 'data') is null then
    raise exception 'Rota precisa de codigo e data' using errcode = '22023';
  end if;
  if jsonb_typeof(p_rota -> 'paradas') is distinct from 'array' or jsonb_array_length(p_rota -> 'paradas') = 0 then
    raise exception 'Rota sem paradas' using errcode = '22023';
  end if;

  select r.id, r.status into v_rota, v_status from public.app_motorista_rotas r
   where r.tenant_id = v_tenant and r.codigo = v_codigo for update;
  if v_rota is not null and v_status not in ('planejada', 'checklist_ok') then
    raise exception 'Rota % já iniciada; não pode ser republicada', v_codigo using errcode = '22023';
  end if;

  if v_rota is null then
    insert into public.app_motorista_rotas (tenant_id, codigo, motorista_id, data)
    values (v_tenant, v_codigo, p_motorista_id, (p_rota ->> 'data')::date)
    returning id into v_rota;
  else
    delete from public.app_motorista_volumes where rota_id = v_rota;
    delete from public.app_motorista_paradas where rota_id = v_rota;
  end if;

  update public.app_motorista_rotas set
    motorista_id = p_motorista_id,
    data = (p_rota ->> 'data')::date,
    rota_roteirizador_id = nullif(p_rota ->> 'rota_roteirizador_id', ''),
    tms_veiculo_id = nullif(p_rota ->> 'tms_veiculo_id', ''),
    turno = nullif(p_rota ->> 'turno', ''),
    setor = nullif(p_rota ->> 'setor', ''),
    bairros = coalesce((select array_agg(x) from jsonb_array_elements_text(p_rota -> 'bairros') x), '{}'),
    paradas_previstas = jsonb_array_length(p_rota -> 'paradas'),
    km_previsto = (p_rota ->> 'km_previsto')::numeric,
    previsao_fim = (p_rota ->> 'previsao_fim')::timestamptz,
    origem = p_rota -> 'origem',
    status = 'planejada', deleted_at = null
  where id = v_rota;

  for v_parada in select * from jsonb_array_elements(p_rota -> 'paradas') loop
    insert into public.app_motorista_paradas (tenant_id, rota_id, motorista_id, sequencia, tipo, destinatario_nome,
      destinatario_documento, endereco, bairro, cidade, uf, cep, lat, lng, janela_inicio, janela_fim,
      contato_nome, contato_funcao, contato_telefone, instrucoes_acesso, eta, pedido_tenant_id, pedido_id)
    values (v_tenant, v_rota, p_motorista_id, (v_parada ->> 'sequencia')::integer,
      coalesce(v_parada ->> 'tipo', 'outro'), v_parada ->> 'destinatario_nome', v_parada ->> 'destinatario_documento',
      v_parada ->> 'endereco', v_parada ->> 'bairro', v_parada ->> 'cidade', v_parada ->> 'uf', v_parada ->> 'cep',
      (v_parada ->> 'lat')::numeric, (v_parada ->> 'lng')::numeric,
      (v_parada ->> 'janela_inicio')::timestamptz, (v_parada ->> 'janela_fim')::timestamptz,
      v_parada ->> 'contato_nome', v_parada ->> 'contato_funcao', v_parada ->> 'contato_telefone',
      v_parada ->> 'instrucoes_acesso', (v_parada ->> 'eta')::timestamptz,
      nullif(v_parada ->> 'pedido_tenant_id', '')::uuid, v_parada ->> 'pedido_id')
    returning id into v_parada_id;

    for v_volume in select * from jsonb_array_elements(coalesce(v_parada -> 'volumes', '[]'::jsonb)) loop
      insert into public.app_motorista_volumes (tenant_id, parada_id, rota_id, motorista_id, nf_numero, nfe_chave,
        etiqueta_tenant_id, etiqueta_codigo, rotulo, ean, codigo_volume, peso_kg, tipo)
      values (v_tenant, v_parada_id, v_rota, p_motorista_id, v_volume ->> 'nf_numero', v_volume ->> 'nfe_chave',
        nullif(v_volume ->> 'etiqueta_tenant_id', '')::uuid, v_volume ->> 'etiqueta_codigo', v_volume ->> 'rotulo',
        v_volume ->> 'ean', v_volume ->> 'codigo_volume', (v_volume ->> 'peso_kg')::numeric,
        coalesce(v_volume ->> 'tipo', 'seco'));
    end loop;
  end loop;

  perform public.app_motorista_notificar(v_tenant, p_motorista_id, 'rota', 'Nova rota: ' || v_codigo,
    'Rota de ' || to_char((p_rota ->> 'data')::date, 'DD/MM') || ' com ' || jsonb_array_length(p_rota -> 'paradas') || ' paradas.', '/');
  return v_rota;
end;
$fn$;

create or replace function public.app_motorista_tratar_emergencia(p_id uuid, p_status text, p_notas text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_tenant uuid := public.app_motorista_exigir_interno('tms.operar');
  v_atual text;
  v_motorista uuid;
begin
  if p_status not in ('reconhecida', 'em_atendimento', 'encerrada', 'falso_alarme') then
    raise exception 'Status inválido' using errcode = '22023';
  end if;
  select e.status, e.motorista_id into v_atual, v_motorista from public.app_motorista_emergencias e
   where e.id = p_id and e.tenant_id = v_tenant and e.deleted_at is null for update;
  if v_atual is null then
    raise exception 'Emergência não encontrada' using errcode = 'P0002';
  end if;
  if v_atual in ('encerrada', 'falso_alarme') then
    raise exception 'Emergência já encerrada' using errcode = '22023';
  end if;
  update public.app_motorista_emergencias set
    status = p_status,
    reconhecida_por = coalesce(reconhecida_por, (select auth.uid())),
    reconhecida_em = coalesce(reconhecida_em, now()),
    encerrada_em = case when p_status in ('encerrada', 'falso_alarme') then now() end,
    notas_central = coalesce(left(p_notas, 2000), notas_central)
  where id = p_id;
  if p_status = 'reconhecida' then
    perform public.app_motorista_notificar(v_tenant, v_motorista, 'alerta', 'Central recebeu sua emergência',
      'A equipe está acompanhando sua ocorrência.', '/support');
  end if;
end;
$fn$;

create or replace function public.app_motorista_salvar_config(
  p_raio_geofence_m integer, p_dias_documento_vencendo integer, p_retencao_gps_dias integer,
  p_telefone_central text, p_whatsapp_central text)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_tenant uuid := public.app_motorista_exigir_interno('tms.operar');
begin
  insert into public.app_motorista_config (tenant_id, raio_geofence_m, dias_documento_vencendo, retencao_gps_dias,
    telefone_central, whatsapp_central)
  values (v_tenant, coalesce(p_raio_geofence_m, 150), coalesce(p_dias_documento_vencendo, 30), coalesce(p_retencao_gps_dias, 180),
    p_telefone_central, p_whatsapp_central)
  on conflict (tenant_id) do update set
    raio_geofence_m = excluded.raio_geofence_m, dias_documento_vencendo = excluded.dias_documento_vencendo,
    retencao_gps_dias = excluded.retencao_gps_dias, telefone_central = excluded.telefone_central,
    whatsapp_central = excluded.whatsapp_central;
end;
$fn$;

-- ==========================================================================
-- Financeiro
-- ==========================================================================
-- Emite o recibo: itens definem bruto/descontos (o total nunca vem pronto).
create or replace function public.app_motorista_emitir_recibo(p_motorista_id uuid, p_recibo jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_tenant uuid := public.app_motorista_exigir_interno('financeiro.lancar');
  v_id uuid;
  v_item jsonb;
  v_rota jsonb;
  v_bruto numeric(12,2);
  v_desc numeric(12,2);
  v_codigo text := btrim(p_recibo ->> 'codigo');
begin
  if not exists (select 1 from public.app_motorista_perfis p where p.user_id = p_motorista_id and p.tenant_id = v_tenant) then
    raise exception 'Motorista não encontrado' using errcode = 'P0002';
  end if;
  if coalesce(v_codigo, '') = '' then
    raise exception 'Recibo precisa de codigo' using errcode = '22023';
  end if;
  if jsonb_typeof(p_recibo -> 'itens') is distinct from 'array' or jsonb_array_length(p_recibo -> 'itens') = 0 then
    raise exception 'Recibo sem itens' using errcode = '22023';
  end if;
  select coalesce(sum((i ->> 'valor')::numeric) filter (where i ->> 'grupo' = 'ganho'), 0),
         coalesce(sum((i ->> 'valor')::numeric) filter (where i ->> 'grupo' = 'desconto'), 0)
    into v_bruto, v_desc
  from jsonb_array_elements(p_recibo -> 'itens') i;

  insert into public.app_motorista_recibos (tenant_id, codigo, motorista_id, apuracao_frete_id, periodo_inicio, periodo_fim,
    quinzena, bruto, descontos_total, liquido, status, prazo_assinatura, data_deposito)
  values (v_tenant, v_codigo, p_motorista_id, nullif(p_recibo ->> 'apuracao_frete_id', ''),
    (p_recibo ->> 'periodo_inicio')::date, (p_recibo ->> 'periodo_fim')::date, (p_recibo ->> 'quinzena')::smallint,
    v_bruto, v_desc, v_bruto - v_desc, 'pendente_assinatura',
    (p_recibo ->> 'prazo_assinatura')::timestamptz, (p_recibo ->> 'data_deposito')::date)
  returning id into v_id;

  for v_item in select * from jsonb_array_elements(p_recibo -> 'itens') loop
    insert into public.app_motorista_recibo_itens (tenant_id, recibo_id, motorista_id, grupo, rotulo, detalhe,
      quantidade, valor_unitario, valor)
    values (v_tenant, v_id, p_motorista_id, v_item ->> 'grupo', v_item ->> 'rotulo', v_item ->> 'detalhe',
      (v_item ->> 'quantidade')::numeric, (v_item ->> 'valor_unitario')::numeric, (v_item ->> 'valor')::numeric);
  end loop;

  for v_rota in select * from jsonb_array_elements(coalesce(p_recibo -> 'rotas', '[]'::jsonb)) loop
    if not exists (select 1 from public.app_motorista_rotas r where r.id = (v_rota ->> 'rota_id')::uuid
                     and r.motorista_id = p_motorista_id and r.tenant_id = v_tenant) then
      raise exception 'Rota % não é deste motorista', v_rota ->> 'rota_id' using errcode = '22023';
    end if;
    insert into public.app_motorista_recibo_rotas (tenant_id, recibo_id, rota_id, motorista_id, data, paradas_concluidas, sla_pct)
    values (v_tenant, v_id, (v_rota ->> 'rota_id')::uuid, p_motorista_id, (v_rota ->> 'data')::date,
      coalesce((v_rota ->> 'paradas_concluidas')::integer, 0), (v_rota ->> 'sla_pct')::numeric);
  end loop;

  perform public.app_motorista_notificar(v_tenant, p_motorista_id, 'recibo', 'Recibo ' || v_codigo || ' disponível',
    'Confira os valores e assine pelo app.', '/receipts/' || v_id);
  return v_id;
end;
$fn$;

create or replace function public.app_motorista_marcar_recibo_pago(p_recibo_id uuid, p_pago_em timestamptz, p_pago_via text)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_tenant uuid := public.app_motorista_exigir_interno('financeiro.conciliar');
  v_motorista uuid;
  v_codigo text;
begin
  update public.app_motorista_recibos set status = 'pago', pago_em = coalesce(p_pago_em, now()), pago_via = p_pago_via
   where id = p_recibo_id and tenant_id = v_tenant and status = 'assinado'
  returning motorista_id, codigo into v_motorista, v_codigo;
  if v_motorista is null then
    raise exception 'Recibo não encontrado ou ainda não assinado' using errcode = '22023';
  end if;
  perform public.app_motorista_notificar(v_tenant, v_motorista, 'recibo', 'Pagamento do recibo ' || v_codigo,
    'Pagamento registrado.', '/receipts/' || p_recibo_id);
end;
$fn$;

-- Conta cadastrada pelo financeiro já nasce ativa e principal; a anterior
-- vira 'substituida' (histórico preservado para auditoria).
create or replace function public.app_motorista_cadastrar_conta(
  p_motorista_id uuid, p_banco_codigo text, p_banco_nome text, p_agencia text, p_conta text, p_tipo_conta text,
  p_pix_tipo text default null, p_pix_chave text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_tenant uuid := public.app_motorista_exigir_interno('financeiro.lancar');
  v_id uuid;
begin
  if not exists (select 1 from public.app_motorista_perfis p where p.user_id = p_motorista_id and p.tenant_id = v_tenant) then
    raise exception 'Motorista não encontrado' using errcode = 'P0002';
  end if;
  update public.app_motorista_contas_bancarias set situacao = 'substituida', principal = false
   where motorista_id = p_motorista_id and situacao in ('ativa', 'pendente_aprovacao') and deleted_at is null;
  insert into public.app_motorista_contas_bancarias (tenant_id, motorista_id, banco_codigo, banco_nome, agencia, conta,
    tipo_conta, pix_tipo, pix_chave, principal, situacao, aprovada_por, aprovada_em)
  values (v_tenant, p_motorista_id, p_banco_codigo, p_banco_nome, p_agencia, p_conta, p_tipo_conta, p_pix_tipo, p_pix_chave,
    true, 'ativa', (select auth.uid()), now())
  returning id into v_id;
  return v_id;
end;
$fn$;

-- ==========================================================================
-- FAQ
-- ==========================================================================
create or replace function public.app_motorista_salvar_faq(
  p_id uuid, p_categoria text, p_pergunta text, p_resposta text, p_ordem integer default 0, p_remover boolean default false)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_tenant uuid := public.app_motorista_exigir_interno('atendimento.registrar');
  v_id uuid;
begin
  if p_id is null then
    insert into public.app_motorista_faq (tenant_id, categoria, pergunta, resposta, ordem)
    values (v_tenant, p_categoria, p_pergunta, p_resposta, coalesce(p_ordem, 0))
    returning id into v_id;
    return v_id;
  end if;
  update public.app_motorista_faq set
    categoria = coalesce(p_categoria, categoria), pergunta = coalesce(p_pergunta, pergunta),
    resposta = coalesce(p_resposta, resposta), ordem = coalesce(p_ordem, ordem),
    deleted_at = case when p_remover then now() end
  where id = p_id and tenant_id = v_tenant
  returning id into v_id;
  if v_id is null then
    raise exception 'Pergunta não encontrada' using errcode = 'P0002';
  end if;
  return v_id;
end;
$fn$;

-- ==========================================================================
-- Grants
-- ==========================================================================
revoke all on function public.app_motorista_vincular_motorista(text, text, text, text, text, text, text, text, date) from public, anon;
revoke all on function public.app_motorista_definir_situacao(uuid, text) from public, anon;
revoke all on function public.app_motorista_registrar_documento_pessoal(uuid, text, text, text, date, uuid) from public, anon;
revoke all on function public.app_motorista_publicar_rota(uuid, jsonb) from public, anon;
revoke all on function public.app_motorista_tratar_emergencia(uuid, text, text) from public, anon;
revoke all on function public.app_motorista_salvar_config(integer, integer, integer, text, text) from public, anon;
revoke all on function public.app_motorista_emitir_recibo(uuid, jsonb) from public, anon;
revoke all on function public.app_motorista_marcar_recibo_pago(uuid, timestamptz, text) from public, anon;
revoke all on function public.app_motorista_cadastrar_conta(uuid, text, text, text, text, text, text, text) from public, anon;
revoke all on function public.app_motorista_salvar_faq(uuid, text, text, text, integer, boolean) from public, anon;

grant execute on function public.app_motorista_vincular_motorista(text, text, text, text, text, text, text, text, date) to authenticated;
grant execute on function public.app_motorista_definir_situacao(uuid, text) to authenticated;
grant execute on function public.app_motorista_registrar_documento_pessoal(uuid, text, text, text, date, uuid) to authenticated;
grant execute on function public.app_motorista_publicar_rota(uuid, jsonb) to authenticated;
grant execute on function public.app_motorista_tratar_emergencia(uuid, text, text) to authenticated;
grant execute on function public.app_motorista_salvar_config(integer, integer, integer, text, text) to authenticated;
grant execute on function public.app_motorista_emitir_recibo(uuid, jsonb) to authenticated;
grant execute on function public.app_motorista_marcar_recibo_pago(uuid, timestamptz, text) to authenticated;
grant execute on function public.app_motorista_cadastrar_conta(uuid, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.app_motorista_salvar_faq(uuid, text, text, text, integer, boolean) to authenticated;

-- ==========================================================================
-- Leitura auditada (LGPD) — mecanismo do TMS, sem alteração na função
-- ==========================================================================
insert into public.leitura_auditada (tabela, permissao, filtro, ordem) values
  ('app_motorista_perfis', 'rh.ver', 'true', 't.nome_completo'),
  ('app_motorista_documentos_pessoais', 'rh.ver', 'true', 't.motorista_id, t.tipo'),
  ('app_motorista_contas_bancarias', 'financeiro.ver', 't.situacao in (''ativa'', ''pendente_aprovacao'')', 't.motorista_id, t.alterada_em desc')
on conflict (tabela) do nothing;
