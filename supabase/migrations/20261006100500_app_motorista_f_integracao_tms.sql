-- App Motorista × TMS — integração de dados (lotes 2 e 3 da integração).
--
--   TMS → app : a rota planejada ganha motorista e veículo do cadastro oficial e é DESPACHADA para o app
--               (`rota_despachar_app`), com volumes numerados por parada (a bipagem vira conferência por contagem
--               até existir o vínculo parada × pedido/etiqueta do embarcador).
--   app → TMS : a posição do app vira telemetria da Torre GPS (`fonte = 'app_motorista'`, no máximo 1 ponto a cada
--               30 s por placa) e todo insucesso de entrega abre uma ocorrência (protocolo OC-…) no K.1.
--
-- Sem bloco `do $$`; corpos de função com $fn$.

-- ==========================================================================
-- 1) Rota planejada: motorista, veículo e despacho
-- ==========================================================================
alter table public.rotas_planejadas
  add column motorista_id uuid,
  add column veiculo_id uuid,
  add column despachada_em timestamptz,
  add column despachada_por uuid;
alter table public.rotas_planejadas
  add foreign key (tenant_id, motorista_id) references public.motoristas(tenant_id, id) on delete set null (motorista_id),
  add foreign key (tenant_id, veiculo_id) references public.veiculos(tenant_id, id) on delete set null (veiculo_id);
create index rotas_planejadas_motorista_idx on public.rotas_planejadas (tenant_id, motorista_id) where motorista_id is not null;
create index rotas_planejadas_veiculo_idx on public.rotas_planejadas (tenant_id, veiculo_id) where veiculo_id is not null;
comment on column public.rotas_planejadas.motorista_id is 'Cadastro oficial do motorista (motoristas). motorista_nome continua como rótulo.';
comment on column public.rotas_planejadas.veiculo_id is 'Cadastro oficial do veículo (veiculos). placa continua como rótulo.';

-- Define motorista e veículo pelo cadastro oficial e mantém os rótulos de texto.
create or replace function public.rota_definir_motorista_veiculo(p_rota_id uuid, p_motorista_id uuid, p_veiculo_id uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_tenant uuid := public.app_motorista_exigir_interno('tms.operar');
  v_status text;
  v_nome text;
  v_placa text;
begin
  select r.status into v_status from public.rotas_planejadas r
   where r.tenant_id = v_tenant and r.id = p_rota_id and r.deleted_at is null for update;
  if v_status is null then
    raise exception 'Rota não encontrada' using errcode = 'P0002';
  end if;
  if v_status not in ('planejada', 'pronta') then
    raise exception 'Rota % não pode mudar de motorista', v_status using errcode = '22023';
  end if;
  select m.nome into v_nome from public.motoristas m
   where m.tenant_id = v_tenant and m.id = p_motorista_id and m.status = 'ativo' and m.deleted_at is null;
  if v_nome is null then
    raise exception 'Motorista ativo não encontrado' using errcode = 'P0002';
  end if;
  if p_veiculo_id is not null then
    select upper(regexp_replace(v.placa, '[^A-Za-z0-9]', '', 'g')) into v_placa from public.veiculos v
     where v.tenant_id = v_tenant and v.id = p_veiculo_id and v.ativo and not v.bloqueado and v.deleted_at is null;
    if v_placa is null then
      raise exception 'Veículo ativo não encontrado' using errcode = 'P0002';
    end if;
  end if;
  update public.rotas_planejadas
     set motorista_id = p_motorista_id, motorista_nome = v_nome, veiculo_id = p_veiculo_id, placa = coalesce(v_placa, placa)
   where tenant_id = v_tenant and id = p_rota_id;
end;
$fn$;

-- Despacha a rota PRONTA para o App Motorista do motorista da rota.
create or replace function public.rota_despachar_app(p_rota_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_tenant uuid := public.app_motorista_exigir_interno('tms.operar');
  v_rota record;
  v_user uuid;
  v_paradas jsonb;
  v_app uuid;
begin
  select r.* into v_rota from public.rotas_planejadas r
   where r.tenant_id = v_tenant and r.id = p_rota_id and r.deleted_at is null for update;
  if not found then
    raise exception 'Rota não encontrada' using errcode = 'P0002';
  end if;
  if v_rota.status <> 'pronta' then
    raise exception 'Só uma rota pronta é despachada (esta está %)', v_rota.status using errcode = '22023';
  end if;
  if v_rota.motorista_id is null then
    raise exception 'Defina o motorista da rota pelo cadastro de motoristas' using errcode = '22023';
  end if;
  select p.user_id into v_user from public.app_motorista_perfis p
   where p.tenant_id = v_tenant and p.motorista_id = v_rota.motorista_id
     and p.situacao_cadastro = 'ativo' and p.deleted_at is null;
  if v_user is null then
    raise exception 'O motorista da rota não tem acesso ao App Motorista' using errcode = '22023';
  end if;

  select jsonb_agg(jsonb_build_object(
      'sequencia', pa.ordem, 'tipo', 'outro', 'destinatario_nome', pa.titulo, 'endereco', pa.endereco,
      'instrucoes_acesso', pa.referencia, 'lat', pa.latitude, 'lng', pa.longitude,
      'volumes', coalesce((select jsonb_agg(jsonb_build_object('codigo_volume', left(v_rota.codigo || '-' || pa.ordem || '-' || n, 80)) order by n)
                             from generate_series(1, coalesce(pa.volumes, 0)) n), '[]'::jsonb)
    ) order by pa.ordem)
    into v_paradas
  from public.rotas_paradas pa
  where pa.tenant_id = v_tenant and pa.rota_id = p_rota_id and pa.deleted_at is null;
  if v_paradas is null then
    raise exception 'A rota não tem paradas' using errcode = '22023';
  end if;

  v_app := public.app_motorista_publicar_rota(v_user, jsonb_build_object(
    'codigo', v_rota.codigo, 'data', v_rota.data_planejada, 'rota_planejada_id', v_rota.id,
    'veiculo_id', v_rota.veiculo_id, 'paradas', v_paradas));
  update public.rotas_planejadas set despachada_em = now(), despachada_por = (select auth.uid())
   where tenant_id = v_tenant and id = p_rota_id;
  return v_app;
end;
$fn$;

-- Estado da execução no app, por rota planejada (J.3 mostra: não despachada / despachada / em execução / concluída).
create or replace function public.app_motorista_estado_das_rotas(p_rota_ids uuid[])
returns table (rota_planejada_id uuid, status text, iniciada_em timestamptz, finalizada_em timestamptz,
               paradas_total integer, paradas_entregues integer, paradas_falha integer)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_tenant uuid := public.app_motorista_exigir_interno('tms.ver');
begin
  return query
  select r.rota_planejada_id, r.status, r.iniciada_em, r.finalizada_em,
         (select count(*)::int from public.app_motorista_paradas p where p.rota_id = r.id and p.deleted_at is null),
         (select count(*)::int from public.app_motorista_paradas p where p.rota_id = r.id and p.deleted_at is null and p.status = 'entregue'),
         (select count(*)::int from public.app_motorista_paradas p where p.rota_id = r.id and p.deleted_at is null and p.status = 'falha')
    from public.app_motorista_rotas r
   where r.tenant_id = v_tenant and r.deleted_at is null and r.rota_planejada_id = any (p_rota_ids);
end;
$fn$;

revoke all on function public.rota_definir_motorista_veiculo(uuid, uuid, uuid) from public, anon;
revoke all on function public.rota_despachar_app(uuid) from public, anon;
revoke all on function public.app_motorista_estado_das_rotas(uuid[]) from public, anon;
grant execute on function public.rota_definir_motorista_veiculo(uuid, uuid, uuid) to authenticated;
grant execute on function public.rota_despachar_app(uuid) to authenticated;
grant execute on function public.app_motorista_estado_das_rotas(uuid[]) to authenticated;

-- ==========================================================================
-- 2) App → TMS: posição do app vira telemetria da Torre GPS
-- ==========================================================================
create or replace function public.app_motorista_projetar_gps()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_placa text;
begin
  select upper(regexp_replace(v.placa, '[^A-Za-z0-9]', '', 'g')) into v_placa
    from public.app_motorista_rotas r
    join public.veiculos v on v.tenant_id = r.tenant_id and v.id = r.veiculo_id
   where r.id = new.rota_id;
  if v_placa is null or v_placa !~ '^[A-Z0-9]{7}$' then
    return null;
  end if;
  -- Amostragem: o GPS do app chega a cada ~12 s; a Torre guarda no máximo 1 ponto por placa a cada 30 s.
  if exists (select 1 from public.telemetria_posicoes t
              where t.tenant_id = new.tenant_id and t.placa = v_placa and t.fonte = 'app_motorista'
                and t.registrado_em > new.registrado_em - interval '30 seconds'
                and t.registrado_em < new.registrado_em + interval '30 seconds') then
    return null;
  end if;
  insert into public.telemetria_posicoes (tenant_id, placa, latitude, longitude, velocidade_kmh, fonte, registrado_em, registrado_por)
  values (new.tenant_id, v_placa, round(new.lat, 6), round(new.lng, 6), new.velocidade_kmh, 'app_motorista',
          new.registrado_em, new.motorista_id);
  return null;
end;
$fn$;
revoke all on function public.app_motorista_projetar_gps() from public, anon, authenticated;
create trigger app_motorista_projetar_gps after insert on public.app_motorista_gps_pontos
  for each row execute function public.app_motorista_projetar_gps();

-- ==========================================================================
-- 3) App → TMS: insucesso de entrega abre ocorrência (K.1)
-- ==========================================================================
create or replace function public.app_motorista_projetar_insucesso()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_parada record;
  v_rota_codigo text;
  v_cliente uuid;
  v_pedido text;
  v_id uuid;
  v_protocolo text;
  v_motivo text;
begin
  select p.* into v_parada from public.app_motorista_paradas p where p.id = new.parada_id;
  select r.codigo into v_rota_codigo from public.app_motorista_rotas r where r.id = new.rota_id;
  v_motivo := case new.motivo
    when 'cliente_ausente' then 'cliente ausente' when 'endereco_nao_localizado' then 'endereço não localizado'
    when 'recusado' then 'entrega recusada' when 'avaria' then 'avaria' when 'acesso_risco' then 'acesso com risco'
    else 'outro motivo' end;
  -- O embarcador só entra quando a parada está ligada a um pedido existente dele; sem vínculo, a ocorrência
  -- fica no próprio tenant plataforma (nada de pedido inventado).
  if v_parada.pedido_tenant_id is not null and v_parada.pedido_id is not null
     and exists (select 1 from public.pedidos pe where pe.tenant_id = v_parada.pedido_tenant_id and pe.id = v_parada.pedido_id)
     and exists (select 1 from public.tenants t where t.id = v_parada.pedido_tenant_id and t.tipo = 'cliente') then
    v_cliente := v_parada.pedido_tenant_id;
    v_pedido := v_parada.pedido_id;
  else
    v_cliente := new.tenant_id;
    v_pedido := null;
  end if;
  v_protocolo := 'OC-' || to_char(now() at time zone 'America/Sao_Paulo', 'YYYY') || '-' || lpad(nextval('public.ocorrencias_protocolo_seq')::text, 5, '0');
  insert into public.ocorrencias (tenant_id, protocolo, cliente_tenant_id, pedido_id, tipo, severidade, descricao, aberta_em, aberta_por)
  values (new.tenant_id, v_protocolo, v_cliente, v_pedido,
          case when new.motivo = 'avaria' then 'avaria' else 'insucesso' end,
          case when new.motivo in ('avaria', 'acesso_risco') then 'alta' else 'media' end,
          left('Insucesso de entrega registrado pelo App Motorista. Motivo: ' || v_motivo || '. Rota ' || coalesce(v_rota_codigo, '?')
               || ', parada ' || v_parada.sequencia || coalesce(' (' || v_parada.destinatario_nome || ')', '') || '.'
               || coalesce(' Observações: ' || new.observacoes, ''), 2000),
          new.registrado_em, new.motorista_id)
  returning id into v_id;
  insert into public.ocorrencia_eventos (tenant_id, ocorrencia_id, de_status, para_status, nota, autor)
  values (new.tenant_id, v_id, null, 'aberta', 'Aberta pelo App Motorista (insucesso de entrega)', new.motorista_id);
  return null;
end;
$fn$;
revoke all on function public.app_motorista_projetar_insucesso() from public, anon, authenticated;
create trigger app_motorista_projetar_insucesso after insert on public.app_motorista_insucessos
  for each row execute function public.app_motorista_projetar_insucesso();
