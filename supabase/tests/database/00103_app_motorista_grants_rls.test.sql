-- App Motorista — RLS e grants por tabela (escrita só por RPC; dado pessoal sem leitura direta).
-- Complementa o 00100 (isolamento por comportamento) e o 00032 do TMS (auditoria do catálogo): aqui cada tabela é
-- nomeada, para que a cobertura pgTAP por tabela (scripts/check-pgtap-coverage.mjs do TMS) seja comportamento, não só catálogo.
begin;
create extension if not exists pgtap with schema extensions;

select plan(44);

create function pg_temp.checa(p_tabela text, p_leitura boolean) returns setof text language plpgsql as $$
begin
  return next ok((select c.relrowsecurity from pg_class c where c.oid = ('public.' || p_tabela)::regclass), p_tabela || ': RLS ligada');
  return next ok(not has_table_privilege('anon', 'public.' || p_tabela, 'select, insert, update, delete'), p_tabela || ': anon sem privilégio');
  return next ok(not has_table_privilege('authenticated', 'public.' || p_tabela, 'insert')
    and not has_table_privilege('authenticated', 'public.' || p_tabela, 'update')
    and not has_table_privilege('authenticated', 'public.' || p_tabela, 'delete'), p_tabela || ': authenticated só lê (escrita por RPC)');
  return next is(has_table_privilege('authenticated', 'public.' || p_tabela, 'select'), p_leitura,
    p_tabela || case when p_leitura then ': leitura própria por RLS' else ': dado pessoal sem leitura direta' end);
end $$;

select * from pg_temp.checa('app_motorista_alertas_via', true);
select * from pg_temp.checa('app_motorista_config', true);
select * from pg_temp.checa('app_motorista_documentos_pessoais', false);
select * from pg_temp.checa('app_motorista_emergencias', true);
select * from pg_temp.checa('app_motorista_faq', true);
select * from pg_temp.checa('app_motorista_gps_pontos', true);
select * from pg_temp.checa('app_motorista_insucessos', true);
select * from pg_temp.checa('app_motorista_preferencias', true);
select * from pg_temp.checa('app_motorista_recibo_itens', true);
select * from pg_temp.checa('app_motorista_recibo_rotas', true);
select * from pg_temp.checa('app_motorista_tentativas_login', false);

select * from finish();
rollback;
