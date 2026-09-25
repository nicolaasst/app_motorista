-- App Motorista — isolamento (critério de aceite da RLS, docs/RBAC_RLS_APP_MOTORISTA.md §8).
-- As claims saem do hook real (custom_access_token_hook), não de JSON montado à mão.
begin;
create extension if not exists pgtap with schema extensions;

select plan(41);

-- ---------------------------------------------------------------------------
-- Cenário
-- ---------------------------------------------------------------------------
insert into public.tenants (id, razao_social, cnpj, tenant_code, plano, regime_fiscal, plano_label, plano_descricao,
  volume_atual, volume_contratado, tabela_frete_nome, tabela_frete_descricao, tipo)
values ('cccccccc-0000-0000-0000-0000000100c1', 'Embarcador 100', '9001000000000191', 'TEN-00100-C', 'starter', 'simples',
  'Starter', 'Piloto', 0, 0, 'T', 'T', 'cliente');

insert into auth.users (id, email) values
  ('a1a1a1a1-0000-0000-0000-000000000100', 'motorista.a@teste.local'),
  ('b2b2b2b2-0000-0000-0000-000000000100', 'motorista.b@teste.local'),
  ('adadadad-0000-0000-0000-000000000100', 'admin.100@teste.local'),
  ('d1d1d1d1-0000-0000-0000-000000000100', 'wms.100@teste.local'),
  ('e1e1e1e1-0000-0000-0000-000000000100', 'tms.100@teste.local'),
  ('c1c1c1c1-0000-0000-0000-000000000100', 'cliente.100@teste.local'),
  ('f1f1f1f1-0000-0000-0000-000000000100', 'invalido.100@teste.local');

insert into public.users (id, tenant_id, role_id, nome, email, portal, ativo) values
  ('a1a1a1a1-0000-0000-0000-000000000100', '00000000-0000-4000-8000-00000000a001',
    (select id from public.roles where code = 'motorista_terceiro'), 'Motorista A', 'motorista.a@teste.local', 'app-motorista', true),
  ('b2b2b2b2-0000-0000-0000-000000000100', '00000000-0000-4000-8000-00000000a001',
    (select id from public.roles where code = 'motorista_terceiro'), 'Motorista B', 'motorista.b@teste.local', 'app-motorista', true),
  ('adadadad-0000-0000-0000-000000000100', '00000000-0000-4000-8000-00000000a001',
    (select id from public.roles where code = 'admin_tenant'), 'Admin 100', 'admin.100@teste.local', 'interno', true),
  ('d1d1d1d1-0000-0000-0000-000000000100', '00000000-0000-4000-8000-00000000a001',
    (select id from public.roles where code = 'operacao_wms'), 'WMS 100', 'wms.100@teste.local', 'interno', true),
  ('e1e1e1e1-0000-0000-0000-000000000100', '00000000-0000-4000-8000-00000000a001',
    (select id from public.roles where code = 'operacao_tms'), 'TMS 100', 'tms.100@teste.local', 'interno', true),
  ('c1c1c1c1-0000-0000-0000-000000000100', 'cccccccc-0000-0000-0000-0000000100c1',
    (select id from public.roles where code = 'cliente_admin'), 'Cliente 100', 'cliente.100@teste.local', 'portal-cliente', true);

insert into public.app_motorista_perfis (user_id, tenant_id, nome_completo, matricula, cpf, email_corporativo) values
  ('a1a1a1a1-0000-0000-0000-000000000100', '00000000-0000-4000-8000-00000000a001', 'Motorista A', 'M100A', '11122233344', 'motorista.a@teste.local'),
  ('b2b2b2b2-0000-0000-0000-000000000100', '00000000-0000-4000-8000-00000000a001', 'Motorista B', 'M100B', '55566677788', 'motorista.b@teste.local');

insert into public.app_motorista_rotas (id, tenant_id, codigo, motorista_id, data, tms_veiculo_id) values
  ('a0000000-0000-0000-0000-00000000a100', '00000000-0000-4000-8000-00000000a001', 'R100-A', 'a1a1a1a1-0000-0000-0000-000000000100', current_date, 'vei-1'),
  ('b0000000-0000-0000-0000-00000000b100', '00000000-0000-4000-8000-00000000a001', 'R100-B', 'b2b2b2b2-0000-0000-0000-000000000100', current_date, 'vei-2');
-- tenant/motorista das filhas vêm do trigger (valores errados de propósito)
insert into public.app_motorista_paradas (id, tenant_id, rota_id, motorista_id, sequencia, destinatario_nome) values
  ('a0000000-0000-0000-0000-0000000a1001', 'cccccccc-0000-0000-0000-0000000100c1', 'a0000000-0000-0000-0000-00000000a100',
    'b2b2b2b2-0000-0000-0000-000000000100', 1, 'Destinatário A1'),
  ('b0000000-0000-0000-0000-0000000b1001', '00000000-0000-4000-8000-00000000a001', 'b0000000-0000-0000-0000-00000000b100',
    'b2b2b2b2-0000-0000-0000-000000000100', 1, 'Destinatário B1');
insert into public.app_motorista_volumes (tenant_id, parada_id, rota_id, motorista_id, codigo_volume) values
  ('00000000-0000-4000-8000-00000000a001', 'a0000000-0000-0000-0000-0000000a1001', 'a0000000-0000-0000-0000-00000000a100',
    'a1a1a1a1-0000-0000-0000-000000000100', 'VOL-A1');

-- Claims pelo hook real; chamado como postgres, antes do `set local role`.
create function pg_temp.como(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', (public.custom_access_token_hook(jsonb_build_object(
    'user_id', p_user, 'claims', jsonb_build_object('sub', p_user, 'role', 'authenticated'))) -> 'claims')::text, true);
end $$;

-- Tabelas do TMS (fora do app) em que o papel authenticated tem SELECT e a linha é visível.
create function pg_temp.tms_visiveis() returns setof text language plpgsql as $$
declare r record; n bigint;
begin
  for r in select c.relname from pg_class c
           where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'p') and not c.relispartition
             and c.relname not like 'app\_motorista\_%'
             -- vocabulário de permissões: legível por qualquer authenticated por desenho do TMS, sem dado de tenant
             and c.relname not in ('roles', 'permissions', 'role_permissions')
             and has_table_privilege('authenticated', c.oid, 'SELECT') loop
    execute format('select count(*) from public.%I', r.relname) into n;
    if n > 0 then return next r.relname || ':' || n; end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 1) Hook e claims
-- ---------------------------------------------------------------------------
select pg_temp.como('a1a1a1a1-0000-0000-0000-000000000100');
select is(current_setting('request.jwt.claims')::jsonb ->> 'portal', 'app-motorista', 'hook: motorista recebe portal app-motorista');
select ok(not (current_setting('request.jwt.claims')::jsonb ? 'tenant_id'), 'hook: motorista NÃO recebe a claim tenant_id');
select is(current_setting('request.jwt.claims')::jsonb ->> 'app_motorista_tenant_id', '00000000-0000-4000-8000-00000000a001',
  'hook: tenant do motorista vai em app_motorista_tenant_id');
select is(current_setting('request.jwt.claims')::jsonb ->> 'user_role', 'motorista_terceiro', 'hook: user_role motorista_terceiro');

select pg_temp.como('adadadad-0000-0000-0000-000000000100');
select is(current_setting('request.jwt.claims')::jsonb ->> 'tenant_id', '00000000-0000-4000-8000-00000000a001',
  'hook: usuário interno continua recebendo tenant_id (fluxo do TMS inalterado)');

update public.users set ativo = false where id = 'b2b2b2b2-0000-0000-0000-000000000100';
select pg_temp.como('b2b2b2b2-0000-0000-0000-000000000100');
select ok(not (current_setting('request.jwt.claims')::jsonb ? 'portal')
          and not (current_setting('request.jwt.claims')::jsonb ? 'app_motorista_tenant_id'),
  'hook: motorista inativo não recebe claim nenhuma');
update public.users set ativo = true where id = 'b2b2b2b2-0000-0000-0000-000000000100';

-- ---------------------------------------------------------------------------
-- 2) Vínculo portal × tenant × perfil
-- ---------------------------------------------------------------------------
select throws_ok($$ insert into public.users (id, tenant_id, role_id, nome, email, portal)
  values ('f1f1f1f1-0000-0000-0000-000000000100', '00000000-0000-4000-8000-00000000a001',
    (select id from public.roles where code = 'motorista_terceiro'), 'X', 'invalido.100@teste.local', 'interno') $$,
  '23514', null, 'motorista_terceiro não pode entrar pelo portal interno');
select throws_ok($$ insert into public.users (id, tenant_id, role_id, nome, email, portal)
  values ('f1f1f1f1-0000-0000-0000-000000000100', 'cccccccc-0000-0000-0000-0000000100c1',
    (select id from public.roles where code = 'motorista_terceiro'), 'X', 'invalido.100@teste.local', 'app-motorista') $$,
  '23514', null, 'portal app-motorista só no tenant plataforma');
select throws_ok($$ insert into public.users (id, tenant_id, role_id, nome, email, portal)
  values ('f1f1f1f1-0000-0000-0000-000000000100', '00000000-0000-4000-8000-00000000a001',
    (select id from public.roles where code = 'admin_tenant'), 'X', 'invalido.100@teste.local', 'app-motorista') $$,
  '23514', null, 'portal app-motorista exige o perfil motorista_terceiro');
select throws_ok($$ update public.users set role_id = (select id from public.roles where code = 'admin_tenant')
  where id = 'a1a1a1a1-0000-0000-0000-000000000100' $$,
  '23514', null, 'trocar o perfil de um motorista para admin é recusado (trigger também olha role_id)');

-- ---------------------------------------------------------------------------
-- 3) Motorista × tabelas do TMS: nada visível, nada gravável
-- ---------------------------------------------------------------------------
select ok((select count(*) from public.motoristas_agregados) > 0 and (select count(*) from public.titulos_pagar) > 0,
  'pré-condição: o seed do TMS tem dados no tenant plataforma');

select pg_temp.como('a1a1a1a1-0000-0000-0000-000000000100');
set local role authenticated;
select is_empty($$ select * from pg_temp.tms_visiveis() $$,
  'motorista vê 0 linhas em TODAS as tabelas do TMS (fail-closed sem a claim tenant_id)');
select throws_ok($$ insert into public.tickets_atendimento (tenant_id, codigo, status) values
  ('00000000-0000-4000-8000-00000000a001', 'CH-X', 'em_andamento') $$, '42501', null,
  'motorista não insere em tabela do TMS');
update public.motoristas_agregados set nome = 'hack';
select is((select count(*)::int from public.motoristas_agregados), 0,
  'motorista não enxerga motoristas_agregados (o update acima não alcança nenhuma linha)');
select throws_ok($$ select * from public.ler_dado_sensivel('colaboradores') $$, '42501', null,
  'motorista não usa a leitura auditada do TMS');
select throws_ok($$ select public.atendimento_abrir_chamado('a', 'b', 'c', 'd') $$, '42501', null,
  'RPC do TMS que depende de tenant_id recusa o motorista');

-- ---------------------------------------------------------------------------
-- 4) Motorista × tabelas do app: só as próprias linhas, só leitura
-- ---------------------------------------------------------------------------
select results_eq($$ select codigo from public.app_motorista_rotas $$, $$ values ('R100-A') $$,
  'motorista A vê só a própria rota');
select results_eq($$ select destinatario_nome from public.app_motorista_paradas $$, $$ values ('Destinatário A1') $$,
  'motorista A vê só a própria parada (tenant/dono herdados da rota pelo trigger)');
select is((select count(*)::int from public.app_motorista_volumes), 1, 'motorista A vê o próprio volume');
select throws_ok($$ insert into public.app_motorista_rotas (tenant_id, codigo, motorista_id, data) values
  ('00000000-0000-4000-8000-00000000a001', 'X', 'a1a1a1a1-0000-0000-0000-000000000100', current_date) $$,
  '42501', null, 'motorista não insere direto em tabela do app (só RPC)');
select throws_ok($$ update public.app_motorista_paradas set status = 'entregue' $$, '42501', null,
  'motorista não altera direto parada (só RPC)');
select throws_ok($$ select * from public.app_motorista_perfis $$, '42501', null,
  'perfil (dado pessoal) não é legível direto nem pelo próprio motorista');
select throws_ok($$ select * from public.app_motorista_contas_bancarias $$, '42501', null,
  'conta bancária não é legível direto');
select throws_ok($$ select * from public.app_motorista_operacoes $$, '42501', null,
  'registro de idempotência não é legível');
select throws_ok($$ select public.app_motorista_publicar_rota('a1a1a1a1-0000-0000-0000-000000000100', '{}'::jsonb) $$,
  '42501', null, 'motorista não executa RPC interna');

reset role;
select is((select count(*)::int from public.motoristas_agregados where nome = 'hack'), 0,
  'o update do motorista em tabela do TMS não alterou nenhuma linha');
select pg_temp.como('b2b2b2b2-0000-0000-0000-000000000100');
set local role authenticated;
select results_eq($$ select codigo from public.app_motorista_rotas $$, $$ values ('R100-B') $$,
  'motorista B vê só a própria rota');
select is((select count(*)::int from public.app_motorista_volumes), 0, 'motorista B não vê volume do A');

-- ---------------------------------------------------------------------------
-- 5) Outros portais
-- ---------------------------------------------------------------------------
reset role;
select pg_temp.como('c1c1c1c1-0000-0000-0000-000000000100');
set local role authenticated;
select is((select count(*)::int from public.app_motorista_rotas), 0, 'portal do cliente não vê rotas do app');
select throws_ok($$ select public.app_motorista_contexto() $$, '42501', null, 'portal do cliente não executa RPC do motorista');

reset role;
select pg_temp.como('d1d1d1d1-0000-0000-0000-000000000100');
set local role authenticated;
select is((select count(*)::int from public.app_motorista_rotas), 0, 'interno sem tms.ver (WMS) não vê rotas do app');

reset role;
select pg_temp.como('adadadad-0000-0000-0000-000000000100');
set local role authenticated;
select is((select count(*)::int from public.app_motorista_rotas where codigo like 'R100-%'), 2, 'interno com tms.ver vê as rotas do tenant');
select throws_ok($$ select * from public.app_motorista_perfis $$, '42501', null,
  'nem o admin lê perfil direto: dado pessoal só por ler_dado_sensivel');
select ok((select count(*) from public.ler_dado_sensivel('app_motorista_perfis')) >= 2,
  'admin (rh.ver) lê perfis pela leitura auditada');
select throws_ok($$ select public.app_motorista_contexto() $$, '42501', null, 'interno não executa RPC do motorista');

reset role;
select ok(exists (select 1 from public.audit_log where action = 'lgpd.leitura' and entity_table = 'app_motorista_perfis'),
  'leitura de perfis grava audit_log');

select pg_temp.como('e1e1e1e1-0000-0000-0000-000000000100');
set local role authenticated;
select throws_ok($$ select * from public.ler_dado_sensivel('app_motorista_contas_bancarias') $$, '42501', null,
  'operação TMS (sem financeiro.ver) não lê contas bancárias');

-- ---------------------------------------------------------------------------
-- 6) anon
-- ---------------------------------------------------------------------------
reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
select throws_ok($$ select * from public.app_motorista_rotas $$, '42501', null, 'anon não lê tabela do app');
select throws_ok($$ select public.app_motorista_contexto() $$, '42501', null, 'anon não executa RPC do app');

reset role;
select is_empty($$ select p.proname from pg_proc p where p.pronamespace = 'public'::regnamespace
  and p.proname like 'app\_motorista\_%' and has_function_privilege('anon', p.oid, 'execute') $$,
  'nenhuma função do app é executável por anon');
select is_empty($$ select p.proname from pg_proc p where p.pronamespace = 'public'::regnamespace
  and p.proname in ('app_motorista_eu', 'app_motorista_idem_reservar', 'app_motorista_vincular_arquivos',
    'app_motorista_abrir_chamado_interno', 'app_motorista_login_resolver', 'app_motorista_login_registrar',
    'app_motorista_gps_garantir_particoes', 'app_motorista_gps_expurgar', 'app_motorista_notificar')
  and has_function_privilege('authenticated', p.oid, 'execute') $$,
  'funções internas do app não são executáveis por authenticated');

select * from finish();
rollback;
