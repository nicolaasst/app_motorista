-- App Motorista × TMS — POD para o embarcador (só com pedido ligado) e emergências na Torre.
begin;
create extension if not exists pgtap with schema extensions;

select plan(24);

insert into auth.users (id, email) values
  ('a1a1a1a1-0000-0000-0000-000000000104', 'mot.a104@teste.local'),
  ('adadadad-0000-0000-0000-000000000104', 'admin.104@teste.local');
insert into public.users (id, tenant_id, role_id, nome, email, portal, ativo) values
  ('adadadad-0000-0000-0000-000000000104', '00000000-0000-4000-8000-00000000a001', (select id from public.roles where code = 'admin_tenant'), 'Admin 104', 'admin.104@teste.local', 'interno', true);
-- ordens de rastreio do embarcador com o mesmo código dos pedidos (cópia de uma ordem do seed)
insert into public.ordens_rastreio
  select (jsonb_populate_record(null::public.ordens_rastreio, to_jsonb(o) || jsonb_build_object('tenant_id', '10000000-0000-0000-0000-00000000000a', 'codigo', c.cod, 'status', 'em_rota', 'pod_assinado', null, 'motivo_falha', null))).*
    from (select * from public.ordens_rastreio limit 1) o, (values ('NX-98214-BR'), ('NX-98215-BR')) c(cod);

create function pg_temp.como(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', (public.custom_access_token_hook(jsonb_build_object(
    'user_id', p_user, 'claims', jsonb_build_object('sub', p_user, 'role', 'authenticated'))) -> 'claims')::text, true);
end $$;
create function pg_temp.arquivo(p_id uuid, p_motorista uuid, p_tipo text) returns uuid language sql as $$
  insert into public.documents (id, tenant_id, r2_key, mime_type, size_bytes, uploaded_by)
  values (p_id, '00000000-0000-4000-8000-00000000a001', '00000000-0000-4000-8000-00000000a001/app-motorista/' || p_motorista || '/' || p_id || '.png', 'image/png', 1234, p_motorista);
  insert into public.app_motorista_arquivos (documento_id, tenant_id, motorista_id, tipo, sha256, mime_type, tamanho_bytes)
  values (p_id, '00000000-0000-4000-8000-00000000a001', p_motorista, p_tipo, repeat('ab', 32), 'image/png', 1234);
  select p_id;
$$;

select pg_temp.como('adadadad-0000-0000-0000-000000000104');
set local role authenticated;
select lives_ok($$ select public.app_motorista_vincular_motorista('mot.a104@teste.local', 'Ana Motorista', '123.456.789-04', 'MAT104') $$, 'motorista com acesso ao app');
select lives_ok($$ select public.app_motorista_publicar_rota('a1a1a1a1-0000-0000-0000-000000000104', '{
  "codigo": "R104", "data": "2026-10-06",
  "paradas": [
    {"sequencia": 1, "destinatario_nome": "Cliente Um", "endereco": "Rua A, 1", "cidade": "São Paulo", "uf": "SP", "lat": -23.5505, "lng": -46.6333,
     "pedido_tenant_id": "10000000-0000-0000-0000-00000000000a", "pedido_id": "NX-98214-BR", "volumes": [{"codigo_volume": "V1", "nf_numero": "1001"}]},
    {"sequencia": 2, "destinatario_nome": "Cliente Dois", "lat": -23.56, "lng": -46.64, "pedido_tenant_id": "10000000-0000-0000-0000-00000000000a", "pedido_id": "NX-98215-BR"},
    {"sequencia": 3, "destinatario_nome": "Sem pedido", "lat": -23.57, "lng": -46.65}
  ]}'::jsonb) $$, 'rota publicada com duas paradas ligadas a pedidos e uma sem pedido');
reset role;
create temp table ids as
  select p1.id as p1, p2.id as p2, p3.id as p3, r.id as rota
    from public.app_motorista_rotas r
    join public.app_motorista_paradas p1 on p1.rota_id = r.id and p1.sequencia = 1
    join public.app_motorista_paradas p2 on p2.rota_id = r.id and p2.sequencia = 2
    join public.app_motorista_paradas p3 on p3.rota_id = r.id and p3.sequencia = 3
   where r.codigo = 'R104';
grant select on ids to authenticated;
select pg_temp.arquivo('d0000000-0000-0000-0000-000000000104', 'a1a1a1a1-0000-0000-0000-000000000104', 'assinatura_entrega');
select pg_temp.arquivo('d0000000-0000-0000-0000-000000000105', 'a1a1a1a1-0000-0000-0000-000000000104', 'assinatura_entrega');

select pg_temp.como('a1a1a1a1-0000-0000-0000-000000000104');
set local role authenticated;
select lives_ok($$ select public.app_motorista_iniciar_rota('c0000000-0000-0000-0000-000000000140', (select rota from ids),
  '[{"key":"pneus","label":"Pneus","ok":true}]'::jsonb, 1000) $$, 'motorista inicia a rota');
select is((public.app_motorista_confirmar_entrega('c0000000-0000-0000-0000-000000000141', (select p1 from ids),
  '{"nome":"Carlos","documento":"123","tipo":"proprio_destinatario"}'::jsonb, 'd0000000-0000-0000-0000-000000000104', null,
  -23.5506, -46.6334, 8, now() - interval '1 minute')) ->> 'status', 'entregue', 'entrega da parada ligada ao pedido');
reset role;
select is((select recebedor_nome || '|' || hash_sha256 || '|' || status || '|' || motorista_responsavel from public.comprovantes_entrega
  where tenant_id = '10000000-0000-0000-0000-00000000000a' and codigo = 'NX-98214-BR'), 'Carlos|' || repeat('ab', 32) || '|concluido|Ana Motorista',
  'comprovante aparece para o embarcador, com recebedor, hash e motorista');
select is((select status || '|' || pod_assinado::text from public.ordens_rastreio where tenant_id = '10000000-0000-0000-0000-00000000000a' and codigo = 'NX-98214-BR'), 'concluido|true',
  'ordem de rastreio do embarcador concluída com POD assinado');

select pg_temp.como('a1a1a1a1-0000-0000-0000-000000000104');
set local role authenticated;
select is((public.app_motorista_registrar_insucesso('c0000000-0000-0000-0000-000000000142', (select p2 from ids),
  'cliente_ausente', 'Ninguém atendeu', null, '[]'::jsonb, -23.56, -46.64, 10, now(), false)) ->> 'status', 'falha', 'insucesso na parada ligada ao pedido');
reset role;
select is((select status || '|' || motivo_falha from public.ordens_rastreio where tenant_id = '10000000-0000-0000-0000-00000000000a' and codigo = 'NX-98215-BR'), 'tentativa_falha|Cliente Ausente',
  'ordem de rastreio mostra a tentativa falha e o motivo');
select is((select count(*)::int from public.ocorrencias where tenant_id = '00000000-0000-4000-8000-00000000a001' and cliente_tenant_id = '10000000-0000-0000-0000-00000000000a' and pedido_id = 'NX-98215-BR' and tipo = 'insucesso'), 1,
  'ocorrência do insucesso fica ligada ao pedido e ao embarcador');
select pg_temp.como('a1a1a1a1-0000-0000-0000-000000000104');
set local role authenticated;
select is((public.app_motorista_confirmar_entrega('c0000000-0000-0000-0000-000000000143', (select p3 from ids),
  '{"nome":"Dona Maria","tipo":"vizinho"}'::jsonb, 'd0000000-0000-0000-0000-000000000105', null,
  -23.5701, -46.6501, 8, now())) ->> 'status', 'entregue', 'entrega da parada sem pedido');
reset role;
select is((select count(*)::int from public.comprovantes_entrega where recebedor_nome = 'Dona Maria'), 0, 'sem pedido ligado, nada é projetado para nenhum embarcador');

-- Emergência ------------------------------------------------------------------------------------------------------
select pg_temp.como('a1a1a1a1-0000-0000-0000-000000000104');
set local role authenticated;
select is((public.app_motorista_acionar_emergencia('c0000000-0000-0000-0000-000000000144', 'pane_local_risco', -23.55, -46.63, 10, now(), (select rota from ids))) ->> 'status',
  'aberta', 'motorista aciona a emergência');
select throws_ok($$ select * from public.app_motorista_emergencias_abertas() $$, '42501', null, 'motorista não lê a lista da Torre');
reset role;
select pg_temp.como('adadadad-0000-0000-0000-000000000104');
set local role authenticated;
select is((select count(*)::int from public.app_motorista_emergencias_abertas() where motorista_nome = 'Ana Motorista' and rota_codigo = 'R104' and tipo = 'pane_local_risco'), 1,
  'a Torre enxerga a emergência aberta, com motorista e rota');
select lives_ok($$ select public.app_motorista_tratar_emergencia((select id from public.app_motorista_emergencias limit 1), 'encerrada', 'Atendida pela central') $$, 'operação encerra a emergência');
select is((select count(*)::int from public.app_motorista_emergencias_abertas()), 0, 'emergência encerrada sai da lista da Torre');
reset role;

-- Leituras para as telas do TMS e recibo numerado pelo servidor --------------------------------------------------
select pg_temp.como('adadadad-0000-0000-0000-000000000104');
set local role authenticated;
select is((select situacao from public.app_motorista_acessos(array['f0104000-0000-0000-0000-000000000001']::uuid[])), null, 'motorista sem cadastro ligado não tem acesso listado');
select is((select raio_geofence_m from public.app_motorista_config_ler()), 150, 'configuração devolve os padrões quando o tenant não salvou nada');
select lives_ok($$ select public.app_motorista_salvar_config(200, 45, 365, '0800-111-2222', null) $$, 'operação salva a configuração do app');
select is((select raio_geofence_m || '|' || dias_documento_vencendo || '|' || telefone_central from public.app_motorista_config_ler()), '200|45|0800-111-2222', 'e a lê de volta');
select lives_ok($$ select public.app_motorista_salvar_faq(null, 'Pagamento', 'Quando recebo?', 'Até o quinto dia útil.', 1) $$, 'FAQ criada pelo atendimento');
select is((select count(*)::int from public.app_motorista_faq_lista() where pergunta = 'Quando recebo?'), 1, 'FAQ listada para a central');
select isnt(public.app_motorista_emitir_recibo('a1a1a1a1-0000-0000-0000-000000000104', '{"periodo_inicio":"2026-10-01","periodo_fim":"2026-10-15","quinzena":1,
  "itens":[{"grupo":"ganho","rotulo":"Fretes","valor":1000},{"grupo":"desconto","rotulo":"Adiantamento","valor":200}]}'::jsonb), null, 'recibo emitido sem código informado');
select is((select codigo ~ '^RC-[0-9]{4}-[0-9]{5}$' and liquido = 800 from public.app_motorista_recibos_lista('pendente_assinatura') limit 1), true, 'recibo numerado pelo servidor, líquido 800, na lista do financeiro');
reset role;

select * from finish();
rollback;
