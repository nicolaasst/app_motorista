-- App Motorista × TMS — comprovante de entrega para o embarcador e emergências na Torre.
--
--   POD: quando a parada está ligada a um pedido existente do embarcador, o comprovante do app vira
--        `comprovantes_entrega` no TENANT DO EMBARCADOR (é o portal do cliente que lê) e a ordem de rastreio de mesmo
--        código passa a `concluido`/`pod_assinado`. Sem pedido ligado, nada é projetado (nada de pedido inventado).
--        A tabela é a da vitrine do A.12 (campos de texto obrigatórios): o que o app não tem vai vazio, nunca inventado.
--   Emergência: leitura para a Torre (tms.ver); tratar continua em `app_motorista_tratar_emergencia` (tms.operar).
--
-- Sem bloco `do $$`; corpos de função com $fn$.

create or replace function public.app_motorista_projetar_comprovante()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_parada record;
  v_motorista text;
  v_placa text;
  v_nf text;
  v_chave text;
  v_vinculo text;
begin
  if new.assinatura_sha256 is null then
    return null;
  end if;
  select p.pedido_tenant_id, p.pedido_id, p.destinatario_nome, p.endereco, p.bairro, p.cidade, p.uf into v_parada
    from public.app_motorista_paradas p where p.id = new.parada_id;
  -- Só com pedido existente de um embarcador (tenant do tipo cliente).
  if v_parada.pedido_tenant_id is null or v_parada.pedido_id is null
     or not exists (select 1 from public.pedidos pe where pe.tenant_id = v_parada.pedido_tenant_id and pe.id = v_parada.pedido_id)
     or not exists (select 1 from public.tenants t where t.id = v_parada.pedido_tenant_id and t.tipo = 'cliente') then
    return null;
  end if;
  select pf.nome_completo into v_motorista from public.app_motorista_perfis pf where pf.user_id = new.motorista_id;
  select upper(regexp_replace(v.placa, '[^A-Za-z0-9]', '', 'g')) into v_placa
    from public.app_motorista_rotas r join public.veiculos v on v.tenant_id = r.tenant_id and v.id = r.veiculo_id
   where r.id = new.rota_id;
  select vo.nf_numero, vo.nfe_chave into v_nf, v_chave from public.app_motorista_volumes vo
   where vo.parada_id = new.parada_id and (vo.nf_numero is not null or vo.nfe_chave is not null)
   order by vo.created_at limit 1;
  v_vinculo := case new.recebedor_tipo
    when 'proprio_destinatario' then 'Próprio destinatário' when 'conjuge_familiar' then 'Cônjuge ou familiar'
    when 'porteiro_portaria' then 'Porteiro / portaria' when 'recepcao_zelador' then 'Recepção / zelador'
    when 'vizinho' then 'Vizinho' when 'funcionario_local' then 'Funcionário do local'
    else coalesce(new.recebedor_tipo_outro, 'Outro') end;

  insert into public.comprovantes_entrega (tenant_id, codigo, tipo, tipo_label, status, status_label, destinatario_nome,
    bairro, cidade, uf, data_hora, responsavel_label, nfe, nfe_chave, recebedor_nome, recebedor_documento, recebedor_vinculo,
    endereco_confirmado, motorista_responsavel, veiculo, coordenadas, precisao_satelital, hash_sha256)
  values (v_parada.pedido_tenant_id, v_parada.pedido_id, 'foto_assinatura', 'Foto e assinatura', 'concluido', 'Concluído',
    coalesce(v_parada.destinatario_nome, ''), coalesce(v_parada.bairro, ''), coalesce(v_parada.cidade, ''), coalesce(v_parada.uf, ''),
    to_char(new.entregue_em at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI'), 'App Motorista',
    coalesce(v_nf, ''), coalesce(v_chave, ''), new.recebedor_nome, coalesce(new.recebedor_documento, ''), v_vinculo,
    coalesce(v_parada.endereco, ''), coalesce(v_motorista, ''), coalesce(v_placa, ''),
    case when new.lat is null then '' else new.lat::text || ', ' || new.lng::text end,
    case when new.precisao_m is null then '' else round(new.precisao_m)::text || ' m' end, new.assinatura_sha256)
  on conflict (tenant_id, codigo) do nothing;

  update public.ordens_rastreio set status = 'concluido', pod_assinado = true, motivo_falha = null
   where tenant_id = v_parada.pedido_tenant_id and codigo = v_parada.pedido_id and deleted_at is null;
  return null;
end;
$fn$;
revoke all on function public.app_motorista_projetar_comprovante() from public, anon, authenticated;
create trigger app_motorista_projetar_comprovante after insert or update of assinatura_sha256 on public.app_motorista_comprovantes
  for each row execute function public.app_motorista_projetar_comprovante();

-- Emergências em aberto para a Torre (acionadas e ainda não encerradas), mais antigas primeiro.
create or replace function public.app_motorista_emergencias_abertas()
returns table (id uuid, motorista_nome text, rota_codigo text, tipo text, lat numeric, lng numeric, acionada_em timestamptz,
               status text, reconhecida_em timestamptz, notas_central text)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_tenant uuid := public.app_motorista_exigir_interno('tms.ver');
begin
  return query
  select e.id, pf.nome_completo, r.codigo, e.tipo, e.lat, e.lng, e.acionada_em, e.status, e.reconhecida_em, e.notas_central
    from public.app_motorista_emergencias e
    join public.app_motorista_perfis pf on pf.user_id = e.motorista_id
    left join public.app_motorista_rotas r on r.id = e.rota_id
   where e.tenant_id = v_tenant and e.deleted_at is null and e.status in ('aberta', 'reconhecida', 'em_atendimento')
   order by e.acionada_em;
end;
$fn$;
revoke all on function public.app_motorista_emergencias_abertas() from public, anon;
grant execute on function public.app_motorista_emergencias_abertas() to authenticated;

-- ==========================================================================
-- Leituras para as telas do TMS (J.1 acesso ao app, J.3 configuração, K.1 FAQ, financeiro: recibos)
-- ==========================================================================
create sequence public.app_motorista_recibo_seq;
revoke all on sequence public.app_motorista_recibo_seq from public, anon, authenticated;

-- Acesso ao app de cada motorista do cadastro oficial (J.1).
create or replace function public.app_motorista_acessos(p_motorista_ids uuid[])
returns table (motorista_id uuid, user_id uuid, situacao text)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_tenant uuid := public.app_motorista_exigir_interno('tms.ver');
begin
  return query
  select p.motorista_id, p.user_id, p.situacao_cadastro
    from public.app_motorista_perfis p
   where p.tenant_id = v_tenant and p.deleted_at is null and p.motorista_id = any (p_motorista_ids);
end;
$fn$;

-- Configuração do app do tenant; sem linha, devolve os padrões da tabela.
create or replace function public.app_motorista_config_ler()
returns table (raio_geofence_m integer, dias_documento_vencendo integer, retencao_gps_dias integer, telefone_central text, whatsapp_central text)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_tenant uuid := public.app_motorista_exigir_interno('tms.ver');
begin
  return query
  select coalesce(c.raio_geofence_m, 150), coalesce(c.dias_documento_vencendo, 30), coalesce(c.retencao_gps_dias, 180),
         c.telefone_central, c.whatsapp_central
    from (select 1) x left join public.app_motorista_config c on c.tenant_id = v_tenant;
end;
$fn$;

-- FAQ do app (K.1).
create or replace function public.app_motorista_faq_lista()
returns table (id uuid, categoria text, pergunta text, resposta text, ordem integer)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_tenant uuid := public.app_motorista_exigir_interno('atendimento.ver');
begin
  return query
  select f.id, f.categoria, f.pergunta, f.resposta, f.ordem
    from public.app_motorista_faq f
   where f.tenant_id = v_tenant and f.deleted_at is null
   order by f.categoria, f.ordem, f.created_at;
end;
$fn$;

-- Recibos do app (financeiro): emitidos, assinados e pagos.
create or replace function public.app_motorista_recibos_lista(p_status text default null, p_limite integer default 100)
returns table (id uuid, codigo text, motorista_nome text, periodo_inicio date, periodo_fim date, bruto numeric, descontos_total numeric,
               liquido numeric, status text, prazo_assinatura timestamptz, assinado_em timestamptz, pago_em timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_tenant uuid := public.app_motorista_exigir_interno('financeiro.ver');
begin
  if p_limite is null or p_limite not between 1 and 500 then
    raise exception 'Limite inválido' using errcode = '22023';
  end if;
  if p_status is not null and p_status not in ('previsto', 'pendente_assinatura', 'em_contestacao', 'assinado', 'pago') then
    raise exception 'Status inválido' using errcode = '22023';
  end if;
  return query
  select r.id, r.codigo, pf.nome_completo, r.periodo_inicio, r.periodo_fim, r.bruto, r.descontos_total, r.liquido, r.status,
         r.prazo_assinatura, r.assinado_em, r.pago_em
    from public.app_motorista_recibos r
    join public.app_motorista_perfis pf on pf.user_id = r.motorista_id
   where r.tenant_id = v_tenant and r.deleted_at is null and (p_status is null or r.status = p_status)
   order by r.created_at desc
   limit p_limite;
end;
$fn$;

revoke all on function public.app_motorista_acessos(uuid[]) from public, anon;
revoke all on function public.app_motorista_config_ler() from public, anon;
revoke all on function public.app_motorista_faq_lista() from public, anon;
revoke all on function public.app_motorista_recibos_lista(text, integer) from public, anon;
grant execute on function public.app_motorista_acessos(uuid[]) to authenticated;
grant execute on function public.app_motorista_config_ler() to authenticated;
grant execute on function public.app_motorista_faq_lista() to authenticated;
grant execute on function public.app_motorista_recibos_lista(text, integer) to authenticated;
