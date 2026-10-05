-- App Motorista × TMS — despacho da rota, posição → Torre GPS e insucesso → ocorrência.
begin;
create extension if not exists pgtap with schema extensions;

select plan(21);

insert into auth.users (id, email) values
  ('a1a1a1a1-0000-0000-0000-000000000102', 'mot.a102@teste.local'),
  ('adadadad-0000-0000-0000-000000000102', 'admin.102@teste.local'),
  ('b1b1b1b1-0000-0000-0000-000000000102', 'rh.102@teste.local');
insert into public.users (id, tenant_id, role_id, nome, email, portal, ativo) values
  ('adadadad-0000-0000-0000-000000000102', '00000000-0000-4000-8000-00000000a001', (select id from public.roles where code = 'admin_tenant'), 'Admin 102', 'admin.102@teste.local', 'interno', true),
  ('b1b1b1b1-0000-0000-0000-000000000102', '00000000-0000-4000-8000-00000000a001', (select id from public.roles where code = 'rh'), 'RH 102', 'rh.102@teste.local', 'interno', true);

insert into public.motoristas (id, tenant_id, nome, vinculo) values ('f0102000-0000-0000-0000-000000000001', '00000000-0000-4000-8000-00000000a001', 'Ana Cadastro 102', 'proprio');
insert into public.veiculos (id, tenant_id, placa, modelo) values ('ee102000-0000-0000-0000-000000000001', '00000000-0000-4000-8000-00000000a001', 'TST-2A02', 'Caminhão 102');
insert into public.rotas_planejadas (id, tenant_id, seq, codigo, data_planejada) values ('ac102000-0000-0000-0000-000000000001', '00000000-0000-4000-8000-00000000a001', 92001, 'RP-T102', current_date);
insert into public.rotas_paradas (tenant_id, rota_id, ordem, tipo, titulo, endereco, latitude, longitude, volumes) values
  ('00000000-0000-4000-8000-00000000a001', 'ac102000-0000-0000-0000-000000000001', 1, 'entrega', 'Mercado Um', 'Rua A, 100, São Paulo', -23.550520, -46.633308, 2),
  ('00000000-0000-4000-8000-00000000a001', 'ac102000-0000-0000-0000-000000000001', 2, 'entrega', 'Clínica Dois', 'Rua B, 200, São Paulo', -23.560000, -46.640000, null);

create function pg_temp.como(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', (public.custom_access_token_hook(jsonb_build_object(
    'user_id', p_user, 'claims', jsonb_build_object('sub', p_user, 'role', 'authenticated'))) -> 'claims')::text, true);
end $$;

-- 1) Despacho -------------------------------------------------------------------------------------------------
select pg_temp.como('adadadad-0000-0000-0000-000000000102');
set local role authenticated;
select throws_ok($$ select public.rota_despachar_app('ac102000-0000-0000-0000-000000000001') $$, '22023', null, 'rota que não está pronta não é despachada');
reset role;
update public.rotas_planejadas set status = 'pronta' where id = 'ac102000-0000-0000-0000-000000000001';
select pg_temp.como('adadadad-0000-0000-0000-000000000102');
set local role authenticated;
select throws_ok($$ select public.rota_despachar_app('ac102000-0000-0000-0000-000000000001') $$, '22023', null, 'rota sem motorista não é despachada');
select lives_ok($$ select public.rota_definir_motorista_veiculo('ac102000-0000-0000-0000-000000000001', 'f0102000-0000-0000-0000-000000000001', 'ee102000-0000-0000-0000-000000000001') $$,
  'operação define motorista e veículo pelo cadastro oficial');
select throws_ok($$ select public.rota_despachar_app('ac102000-0000-0000-0000-000000000001') $$, '22023', null, 'motorista sem acesso ao app não recebe a rota');
select lives_ok($$ select public.app_motorista_vincular_motorista('mot.a102@teste.local', 'Ana Motorista', '123.456.789-02', 'MAT102',
  p_motorista_id => 'f0102000-0000-0000-0000-000000000001') $$, 'admin dá acesso ao app ao motorista do cadastro');
reset role;
select is((select placa from public.rotas_planejadas where id = 'ac102000-0000-0000-0000-000000000001'), 'TST2A02', 'rótulo da placa acompanha o cadastro (sem hífen, como a rota exige)');

select pg_temp.como('b1b1b1b1-0000-0000-0000-000000000102');
set local role authenticated;
select throws_ok($$ select public.rota_despachar_app('ac102000-0000-0000-0000-000000000001') $$, '42501', null, 'perfil sem tms.operar (RH) não despacha');
reset role;
select pg_temp.como('adadadad-0000-0000-0000-000000000102');
set local role authenticated;
select isnt(public.rota_despachar_app('ac102000-0000-0000-0000-000000000001'), null, 'rota pronta é despachada ao app do motorista certo');
select lives_ok($$ select public.rota_despachar_app('ac102000-0000-0000-0000-000000000001') $$, 'republicar antes de o motorista iniciar é permitido');
reset role;
select is((select count(*)::int from public.app_motorista_rotas where codigo = 'RP-T102' and rota_planejada_id = 'ac102000-0000-0000-0000-000000000001'
  and motorista_id = 'a1a1a1a1-0000-0000-0000-000000000102' and veiculo_id = 'ee102000-0000-0000-0000-000000000001'), 1, 'uma rota no app, ligada ao planejamento, ao motorista e ao veículo');
select is((select count(*)::int from public.app_motorista_paradas where rota_id = (select id from public.app_motorista_rotas where codigo = 'RP-T102')), 2, 'paradas copiadas do planejamento');
select is((select array_agg(codigo_volume order by codigo_volume) from public.app_motorista_volumes where rota_id = (select id from public.app_motorista_rotas where codigo = 'RP-T102')),
  array['RP-T102-1-1', 'RP-T102-1-2'], 'volumes numerados por parada (conferência por contagem)');
select isnt((select despachada_em from public.rotas_planejadas where id = 'ac102000-0000-0000-0000-000000000001'), null, 'despacho registra quando e por quem');
select pg_temp.como('adadadad-0000-0000-0000-000000000102');
set local role authenticated;
select is((select status from public.app_motorista_estado_das_rotas(array['ac102000-0000-0000-0000-000000000001']::uuid[])), 'planejada', 'J.3 enxerga o estado da rota no app');
reset role;

-- 2) App → TMS: posição e insucesso ---------------------------------------------------------------------------
select pg_temp.como('a1a1a1a1-0000-0000-0000-000000000102');
set local role authenticated;
select lives_ok($$ select public.app_motorista_iniciar_rota('c0000000-0000-0000-0000-000000000102', (select id from public.app_motorista_rotas where codigo = 'RP-T102'),
  '[{"key":"pneus","label":"Pneus","ok":true}]'::jsonb, 1000) $$, 'motorista inicia a rota despachada');
select is(public.app_motorista_registrar_gps((select id from public.app_motorista_rotas where codigo = 'RP-T102'), jsonb_build_array(
  jsonb_build_object('t', now() - interval '90 seconds', 'lat', -23.55, 'lng', -46.63, 'speed', 30),
  jsonb_build_object('t', now() - interval '78 seconds', 'lat', -23.551, 'lng', -46.631),
  jsonb_build_object('t', now() - interval '66 seconds', 'lat', -23.552, 'lng', -46.632),
  jsonb_build_object('t', now() - interval '50 seconds', 'lat', -23.553, 'lng', -46.633))), 4, 'app grava os 4 pontos');
select is((public.app_motorista_registrar_insucesso('c0000000-0000-0000-0000-000000000103',
  (select id from public.app_motorista_paradas where rota_id = (select id from public.app_motorista_rotas where codigo = 'RP-T102') and sequencia = 2),
  'cliente_ausente', 'Ninguém atendeu', null, '[]'::jsonb, -23.56, -46.64, 10, now(), false)) ->> 'status', 'falha', 'insucesso registrado no app');
reset role;
select is((select count(*)::int from public.telemetria_posicoes where fonte = 'app_motorista' and placa = 'TST2A02'), 2,
  'Torre GPS recebe no máximo 1 ponto a cada 30 s por placa (4 pontos do app viram 2)');
select is((select count(*)::int from public.ocorrencias where tipo = 'insucesso' and descricao like '%Rota RP-T102%' and protocolo ~ '^OC-[0-9]{4}-[0-9]{5}$'
  and cliente_tenant_id = '00000000-0000-4000-8000-00000000a001' and pedido_id is null), 1, 'insucesso sem pedido ligado abre ocorrência no tenant plataforma (nada de pedido inventado)');
select is((select count(*)::int from public.ocorrencia_eventos e join public.ocorrencias o on o.id = e.ocorrencia_id and o.tenant_id = e.tenant_id
  where o.descricao like '%Rota RP-T102%' and e.para_status = 'aberta'), 1, 'ocorrência nasce com o evento inicial');

select pg_temp.como('a1a1a1a1-0000-0000-0000-000000000102');
set local role authenticated;
select throws_ok($$ select public.rota_despachar_app('ac102000-0000-0000-0000-000000000001') $$, '42501', null, 'motorista não despacha rota');
reset role;

select * from finish();
rollback;
