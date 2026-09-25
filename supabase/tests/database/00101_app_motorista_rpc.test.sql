-- App Motorista — RPCs: fluxo da rota, idempotência, prova de entrega, chamados,
-- emergência, recibo, perfil, operação interna e login.
begin;
create extension if not exists pgtap with schema extensions;

select plan(70);

-- ---------------------------------------------------------------------------
-- Cenário (como postgres)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('a1a1a1a1-0000-0000-0000-000000000101', 'mot.a101@teste.local'),
  ('b2b2b2b2-0000-0000-0000-000000000101', 'mot.b101@teste.local'),
  ('adadadad-0000-0000-0000-000000000101', 'admin.101@teste.local'),
  ('e1e1e1e1-0000-0000-0000-000000000101', 'tms.101@teste.local');
insert into public.users (id, tenant_id, role_id, nome, email, portal, ativo) values
  ('adadadad-0000-0000-0000-000000000101', '00000000-0000-4000-8000-00000000a001',
    (select id from public.roles where code = 'admin_tenant'), 'Admin 101', 'admin.101@teste.local', 'interno', true),
  ('e1e1e1e1-0000-0000-0000-000000000101', '00000000-0000-4000-8000-00000000a001',
    (select id from public.roles where code = 'operacao_tms'), 'TMS 101', 'tms.101@teste.local', 'interno', true);

create function pg_temp.como(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', (public.custom_access_token_hook(jsonb_build_object(
    'user_id', p_user, 'claims', jsonb_build_object('sub', p_user, 'role', 'authenticated'))) -> 'claims')::text, true);
end $$;

-- Simula a Edge Function app-motorista-arquivos (service_role): documents + arquivos com hash.
create function pg_temp.arquivo(p_id uuid, p_motorista uuid, p_tipo text) returns uuid language sql as $$
  insert into public.documents (id, tenant_id, r2_key, mime_type, size_bytes, uploaded_by)
  values (p_id, '00000000-0000-4000-8000-00000000a001',
    '00000000-0000-4000-8000-00000000a001/app-motorista/' || p_motorista || '/' || p_id || '.png', 'image/png', 1234, p_motorista);
  insert into public.app_motorista_arquivos (documento_id, tenant_id, motorista_id, tipo, sha256, mime_type, tamanho_bytes)
  values (p_id, '00000000-0000-4000-8000-00000000a001', p_motorista, p_tipo, repeat('ab', 32), 'image/png', 1234);
  select p_id;
$$;

-- ---------------------------------------------------------------------------
-- 1) Operação interna: vincular motoristas e publicar rota
-- ---------------------------------------------------------------------------
select pg_temp.como('adadadad-0000-0000-0000-000000000101');
set local role authenticated;
select is(public.app_motorista_vincular_motorista('mot.a101@teste.local', 'Ana Motorista', '123.456.789-01', 'MAT101'),
  'a1a1a1a1-0000-0000-0000-000000000101'::uuid, 'admin (rh.editar) vincula a motorista A');
select lives_ok($$ select public.app_motorista_vincular_motorista('mot.b101@teste.local', 'Beto Motorista', '98765432100', 'MAT102') $$,
  'admin vincula o motorista B');
select throws_ok($$ select public.app_motorista_vincular_motorista('naoexiste@teste.local', 'X', '11111111111') $$,
  'P0002', null, 'vincular exige conta existente no Auth');
select lives_ok($$ select public.app_motorista_salvar_config(150, 30, 180, '0800-000-0000', null) $$, 'admin salva configuração do app');
select lives_ok($$ select public.app_motorista_publicar_rota('a1a1a1a1-0000-0000-0000-000000000101', '{
  "codigo": "R101", "data": "2026-09-28", "tms_veiculo_id": "vei-1", "turno": "integral",
  "paradas": [
    {"sequencia": 1, "destinatario_nome": "Mercado Um", "lat": -23.550520, "lng": -46.633308,
     "volumes": [{"codigo_volume": "V1", "nf_numero": "100"}, {"codigo_volume": "V2", "nf_numero": "100"}]},
    {"sequencia": 2, "destinatario_nome": "Clínica Dois", "lat": -23.560000, "lng": -46.640000,
     "volumes": [{"codigo_volume": "V3", "nf_numero": "200"}]},
    {"sequencia": 3, "destinatario_nome": "Casa Três", "lat": -23.570000, "lng": -46.650000}
  ]}'::jsonb) $$, 'admin (tms.operar) publica rota com paradas e volumes');
select lives_ok($$ select public.app_motorista_publicar_rota('b2b2b2b2-0000-0000-0000-000000000101', '{
  "codigo": "R102", "data": "2026-09-28", "paradas": [{"sequencia": 1, "destinatario_nome": "Destino B"}]}'::jsonb) $$,
  'publica rota do motorista B');

reset role;
select pg_temp.como('e1e1e1e1-0000-0000-0000-000000000101');
set local role authenticated;
select throws_ok($$ select public.app_motorista_vincular_motorista('mot.a101@teste.local', 'X', '12345678901') $$,
  '42501', null, 'operação TMS (sem rh.editar) não vincula motorista');

-- ---------------------------------------------------------------------------
-- 2) Motorista A: contexto, início da rota, idempotência
-- ---------------------------------------------------------------------------
reset role;
create temp table ids as
  select (select id from public.app_motorista_rotas where codigo = 'R101') as rota,
         (select id from public.app_motorista_paradas p where p.sequencia = 1 and p.rota_id = (select id from public.app_motorista_rotas where codigo = 'R101')) as p1,
         (select id from public.app_motorista_paradas p where p.sequencia = 2 and p.rota_id = (select id from public.app_motorista_rotas where codigo = 'R101')) as p2,
         (select id from public.app_motorista_paradas p where p.sequencia = 3 and p.rota_id = (select id from public.app_motorista_rotas where codigo = 'R101')) as p3,
         (select id from public.app_motorista_rotas where codigo = 'R102') as rota_b,
         (select hodometro_km from public.tms_veiculos where id = 'vei-1') as hodometro;
grant select on ids to authenticated;
select pg_temp.arquivo('d0000000-0000-0000-0000-000000000001', 'a1a1a1a1-0000-0000-0000-000000000101', 'assinatura_entrega');
select pg_temp.arquivo('d0000000-0000-0000-0000-000000000002', 'a1a1a1a1-0000-0000-0000-000000000101', 'foto_entrega');
select pg_temp.arquivo('d0000000-0000-0000-0000-000000000003', 'b2b2b2b2-0000-0000-0000-000000000101', 'assinatura_entrega');
select pg_temp.arquivo('d0000000-0000-0000-0000-000000000004', 'a1a1a1a1-0000-0000-0000-000000000101', 'assinatura_recibo');
select pg_temp.arquivo('d0000000-0000-0000-0000-000000000005', 'a1a1a1a1-0000-0000-0000-000000000101', 'assinatura_entrega');

select pg_temp.como('a1a1a1a1-0000-0000-0000-000000000101');
set local role authenticated;
select is(public.app_motorista_contexto() -> 'perfil' ->> 'nome_completo', 'Ana Motorista', 'contexto traz o perfil do motorista');
select is((public.app_motorista_contexto() -> 'config' ->> 'raio_geofence_m')::int, 150, 'contexto traz o raio do geofence');
select is(public.app_motorista_meu_veiculo() ->> 'placa', 'BRA-9X21', 'veículo da rota vem de tms_veiculos');

select throws_ok($$ select public.app_motorista_iniciar_rota('c0000000-0000-0000-0000-000000000001', (select rota from ids),
  '[{"key":"pneus","ok":true},{"key":"freios","ok":false}]'::jsonb, 150000) $$,
  '22023', null, 'checklist com item reprovado não inicia a rota');
select is((public.app_motorista_iniciar_rota('c0000000-0000-0000-0000-000000000002', (select rota from ids),
  '[{"key":"pneus","label":"Pneus","ok":true},{"key":"freios","label":"Freios","ok":true}]'::jsonb,
  (select hodometro + 100 from ids))) ->> 'status', 'em_operacao', 'checklist aprovado inicia a rota');
select is((public.app_motorista_iniciar_rota('c0000000-0000-0000-0000-000000000002', (select rota from ids),
  '[]'::jsonb, 1)) ->> 'status', 'em_operacao', 'reenvio com a mesma chave devolve o resultado gravado (sem revalidar)');
select is((select count(*)::int from public.app_motorista_checklists where rota_id = (select rota from ids)), 1,
  'reenvio não duplica o checklist');
reset role;
select is((select hodometro_km from public.tms_veiculos where id = 'vei-1'), (select hodometro + 100 from ids),
  'hodômetro do veículo no TMS avançou');
select pg_temp.como('a1a1a1a1-0000-0000-0000-000000000101');
set local role authenticated;
select throws_ok($$ select public.app_motorista_iniciar_rota('c0000000-0000-0000-0000-000000000003', (select rota from ids),
  '[{"key":"x","ok":true}]'::jsonb, 1) $$, '22023', null, 'rota já iniciada não reinicia');
select throws_ok($$ select public.app_motorista_iniciar_rota('c0000000-0000-0000-0000-000000000004', (select rota_b from ids),
  '[{"key":"x","ok":true}]'::jsonb, 1) $$, 'P0002', null, 'motorista A não mexe na rota do B');
select throws_ok($$ select public.app_motorista_confirmar_entrega('c0000000-0000-0000-0000-000000000026', (select p3 from ids),
  '{"nome":"Z","tipo":"vizinho"}'::jsonb, 'd0000000-0000-0000-0000-000000000005', null, null, null, null, now()) $$,
  '22023', null, 'nome de recebedor curto demais vira mensagem clara (22023), não erro de CHECK');
select throws_ok($$ select public.app_motorista_concluir_rota('c0000000-0000-0000-0000-000000000002', (select rota from ids)) $$,
  '22023', null, 'chave já usada por outra operação é recusada');

-- ---------------------------------------------------------------------------
-- 3) Bipagem
-- ---------------------------------------------------------------------------
select throws_ok($$ select public.app_motorista_bipar_volumes('c0000000-0000-0000-0000-000000000010', (select p1 from ids),
  array(select id from public.app_motorista_volumes where codigo_volume = 'V3')) $$,
  '22023', null, 'volume de outra parada é recusado');
select is((public.app_motorista_bipar_volumes('c0000000-0000-0000-0000-000000000011', (select p1 from ids),
  array(select id from public.app_motorista_volumes where parada_id = (select p1 from ids)))) ->> 'bipados', '2',
  'bipagem dos volumes da parada');
select is((select count(*)::int from public.app_motorista_volumes where parada_id = (select p1 from ids) and status_leitura = 'bipado'), 2,
  'volumes ficaram bipados');

-- ---------------------------------------------------------------------------
-- 4) Entrega: assinatura com hash do servidor, posição real, geofence
-- ---------------------------------------------------------------------------
select throws_ok($$ select public.app_motorista_confirmar_entrega('c0000000-0000-0000-0000-000000000020', (select p1 from ids),
  '{"nome":"Carlos","tipo":"proprio_destinatario"}'::jsonb, null, null, -23.5506, -46.6333, 8, now()) $$,
  '22023', null, 'entrega sem assinatura é recusada');
select throws_ok($$ select public.app_motorista_confirmar_entrega('c0000000-0000-0000-0000-000000000021', (select p1 from ids),
  '{"nome":"Carlos","tipo":"proprio_destinatario"}'::jsonb, 'd0000000-0000-0000-0000-000000000003', null, -23.5506, -46.6333, 8, now()) $$,
  '22023', null, 'assinatura enviada por outro motorista é recusada');
select throws_ok($$ select public.app_motorista_confirmar_entrega('c0000000-0000-0000-0000-000000000022', (select p1 from ids),
  '{"nome":"Carlos","tipo":"proprio_destinatario"}'::jsonb, 'd0000000-0000-0000-0000-000000000001', null, -23.5506, -46.6333, 8,
  now() + interval '1 hour') $$, '22023', null, 'horário do aparelho no futuro é recusado');

create temp table entrega as
  select public.app_motorista_confirmar_entrega('c0000000-0000-0000-0000-000000000023', (select p1 from ids),
    '{"nome":"Carlos","documento":"123","tipo":"proprio_destinatario","titular":true}'::jsonb,
    'd0000000-0000-0000-0000-000000000001', array['d0000000-0000-0000-0000-000000000002'::uuid],
    -23.550600, -46.633400, 8, now() - interval '2 minutes', '{"ua":"teste"}'::jsonb, 'Entregue na portaria') as r;
select is((select r ->> 'status' from entrega), 'entregue', 'entrega confirmada');
select is((select r ->> 'assinatura_sha256' from entrega), repeat('ab', 32), 'hash da assinatura vem do arquivo gravado no servidor');
select ok((select (r ->> 'distancia_parada_m')::numeric between 5 and 20 from entrega), 'distância calculada com a posição do aparelho');
select is((select r ->> 'dentro_geofence' from entrega), 'true', 'dentro do raio de 150 m');
select is((select status from public.app_motorista_paradas where id = (select p1 from ids)), 'entregue', 'parada virou entregue');
select is((public.app_motorista_confirmar_entrega('c0000000-0000-0000-0000-000000000023', (select p1 from ids),
    '{}'::jsonb, null, null, null, null, null, null)) ->> 'comprovante_id', (select r ->> 'comprovante_id' from entrega),
  'reenvio da fila (mesma chave) devolve o mesmo comprovante');
select is((select count(*)::int from public.app_motorista_comprovantes where parada_id = (select p1 from ids)), 1,
  'reenvio não duplica o comprovante (bug B-05)');
select throws_ok($$ select public.app_motorista_confirmar_entrega('c0000000-0000-0000-0000-000000000024', (select p1 from ids),
  '{"nome":"Outro","tipo":"vizinho"}'::jsonb, 'd0000000-0000-0000-0000-000000000005', null, -23.55, -46.63, 5, now()) $$,
  '22023', null, 'parada já entregue não recebe segunda entrega');
select throws_ok($$ select public.app_motorista_confirmar_entrega('c0000000-0000-0000-0000-000000000025', (select p2 from ids),
  '{"nome":"Xavier","tipo":"vizinho"}'::jsonb, 'd0000000-0000-0000-0000-000000000001', null, -23.56, -46.64, 5, now()) $$,
  '22023', null, 'assinatura já usada não é reaproveitada');

-- ---------------------------------------------------------------------------
-- 5) Insucesso, GPS, conclusão e fechamento do turno
-- ---------------------------------------------------------------------------
select is((public.app_motorista_registrar_insucesso('c0000000-0000-0000-0000-000000000030', (select p2 from ids),
  'cliente_ausente', 'Ninguém atendeu', null, '[]'::jsonb, -23.5700, -46.6600, 10, now(), true)) ->> 'dentro_geofence', 'false',
  'insucesso longe da parada fica fora do geofence (registrado, não bloqueado)');
select is((select status_devolucao from public.app_motorista_volumes where codigo_volume = 'V3'
  and rota_id = (select rota from ids)), 'devolver', 'volumes da parada com insucesso vão para devolução');

select is(public.app_motorista_registrar_gps((select rota from ids), jsonb_build_array(
  jsonb_build_object('t', now() - interval '1 minute', 'lat', -23.55, 'lng', -46.63, 'speed', 30),
  jsonb_build_object('t', now() - interval '30 seconds', 'lat', -23.551, 'lng', -46.631),
  jsonb_build_object('t', now() - interval '20 seconds', 'lat', 123, 'lng', -46.631))), 2,
  'GPS: pontos válidos gravados, ponto inválido descartado sem travar o lote');
select is(public.app_motorista_registrar_gps((select rota from ids), jsonb_build_array(
  jsonb_build_object('t', now() - interval '1 minute', 'lat', -23.55, 'lng', -46.63))), 0,
  'GPS: reenvio do mesmo ponto é ignorado');
select throws_ok($$ select public.app_motorista_registrar_gps((select rota_b from ids), '[]'::jsonb) $$, 'P0002', null,
  'GPS: rota de outro motorista é recusada');

select is((public.app_motorista_concluir_rota('c0000000-0000-0000-0000-000000000040', (select rota from ids))) ->> 'paradas_reagendadas', '1',
  'concluir rota reagenda a parada não atendida');
select throws_ok($$ select public.app_motorista_encerrar_turno('c0000000-0000-0000-0000-000000000041', (select rota from ids),
  '[{"key":"x","ok":true}]'::jsonb, 1) $$, '22023', null, 'odômetro final menor que o inicial é recusado');
select is((public.app_motorista_encerrar_turno('c0000000-0000-0000-0000-000000000042', (select rota from ids),
  '[{"key":"limpeza","ok":true}]'::jsonb, (select hodometro + 180 from ids))) ->> 'status', 'encerrada', 'turno encerrado');

-- ---------------------------------------------------------------------------
-- 6) Chamado vai para a Central do TMS; emergência tem fluxo próprio
-- ---------------------------------------------------------------------------
select matches((public.app_motorista_abrir_chamado('c0000000-0000-0000-0000-000000000050', 'mecanica', 'Pneu furado',
  'Pneu dianteiro furou na marginal', (select rota from ids))) ->> 'codigo', '^CH-[0-9]{4}-[0-9]{5}$',
  'chamado recebe código no padrão da Central (CH-AAAA-NNNNN)');
select throws_ok($$ select public.app_motorista_abrir_chamado('c0000000-0000-0000-0000-000000000051', 'emergencia', 'x', 'y') $$,
  '22023', null, 'emergência não é categoria de chamado');
select is((public.app_motorista_meus_chamados() -> 0 ->> 'status'), 'aberto', 'chamado aparece para o motorista como aberto');

reset role;
select is((select aberto_por_cargo || ' / ' || categoria_label || ' / ' || referencia_label from public.tickets_atendimento t
  join public.app_motorista_chamados c on c.tenant_id = t.tenant_id and c.ticket_codigo = t.codigo
  where c.motorista_id = 'a1a1a1a1-0000-0000-0000-000000000101'), 'Motorista / Mecânica / Veículo / Rota R101',
  'o chamado é um ticket do TMS, com os rótulos que a Central exibe');
select is((select autor_tipo from public.mensagens_ticket m join public.app_motorista_chamados c
  on c.tenant_id = m.tenant_id and c.ticket_codigo = m.ticket_codigo
  where c.motorista_id = 'a1a1a1a1-0000-0000-0000-000000000101'), 'cliente',
  'mensagem do motorista usa autor_tipo do enum da Central (cliente)');
select pg_temp.como('adadadad-0000-0000-0000-000000000101');
set local role authenticated;
select lives_ok($$ select public.atendimento_responder((select ticket_codigo from public.app_motorista_chamados
  where motorista_id = 'a1a1a1a1-0000-0000-0000-000000000101'), 'Guincho a caminho', null) $$,
  'a Central responde o chamado do motorista com a RPC do próprio TMS');
reset role;
select pg_temp.como('a1a1a1a1-0000-0000-0000-000000000101');
set local role authenticated;
select is((public.app_motorista_meus_chamados() -> 0 ->> 'resposta_central'), 'Guincho a caminho',
  'motorista vê a resposta da Central');

create temp table emerg as
  select public.app_motorista_acionar_emergencia('c0000000-0000-0000-0000-000000000060', 'acidente', -23.55, -46.63, 12, now()) as r;
select is((select r ->> 'status' from emerg), 'aberta', 'emergência acionada');
select is((select r ->> 'telefone_central' from emerg), '0800-000-0000', 'resposta traz o telefone da central');
select is((public.app_motorista_acionar_emergencia('c0000000-0000-0000-0000-000000000061', 'acidente', -23.56, -46.64, 5, now())) ->> 'emergencia_id',
  (select r ->> 'emergencia_id' from emerg), 'novo toque com emergência aberta reaproveita a mesma ocorrência');
select is(jsonb_array_length(public.app_motorista_meus_chamados()), 1, 'emergência não cria chamado');

-- ---------------------------------------------------------------------------
-- 7) Recibo: emitido pelo financeiro, assinado pelo motorista
-- ---------------------------------------------------------------------------
reset role;
select pg_temp.como('adadadad-0000-0000-0000-000000000101');
set local role authenticated;
create temp table recibo as select public.app_motorista_emitir_recibo('a1a1a1a1-0000-0000-0000-000000000101', jsonb_build_object(
  'codigo', 'RC-101', 'periodo_inicio', '2026-09-01', 'periodo_fim', '2026-09-15', 'quinzena', 1,
  'itens', jsonb_build_array(jsonb_build_object('grupo', 'ganho', 'rotulo', 'Entregas', 'valor', 1500),
                             jsonb_build_object('grupo', 'desconto', 'rotulo', 'Adiantamento', 'valor', 300)),
  'rotas', jsonb_build_array(jsonb_build_object('rota_id', (select rota from ids), 'data', '2026-09-28', 'paradas_concluidas', 1)))) as id;
reset role;
grant select on recibo to authenticated;
select pg_temp.como('a1a1a1a1-0000-0000-0000-000000000101');
set local role authenticated;
select is((select liquido from public.app_motorista_recibos where codigo = 'RC-101'), 1200.00::numeric(12,2),
  'líquido calculado a partir dos itens');
create temp table assinatura as select public.app_motorista_assinar_recibo('c0000000-0000-0000-0000-000000000070',
  (select id from recibo), 'd0000000-0000-0000-0000-000000000004', -23.55, -46.63) as r;
select is((select r ->> 'status' from assinatura), 'assinado', 'recibo assinado');
select matches((select r ->> 'assinatura_sha256' from assinatura), '^[0-9a-f]{64}$', 'hash SHA-256 calculado no servidor (bug B-03)');
select throws_ok($$ select public.app_motorista_assinar_recibo('c0000000-0000-0000-0000-000000000071',
  (select id from recibo), 'd0000000-0000-0000-0000-000000000004') $$, '22023', null, 'recibo assinado não é assinado de novo');
select ok((select count(*) from public.app_motorista_notificacoes where tipo = 'recibo') >= 1, 'emissão notificou o motorista');

reset role;
select pg_temp.como('b2b2b2b2-0000-0000-0000-000000000101');
set local role authenticated;
select is((select count(*)::int from public.app_motorista_recibos where codigo = 'RC-101'), 0, 'motorista B não vê o recibo do A');

-- ---------------------------------------------------------------------------
-- 8) Perfil e preferências
-- ---------------------------------------------------------------------------
select throws_ok($$ select public.app_motorista_atualizar_preferencias('{"tema":"dark","admin":true}'::jsonb) $$, '22023', null,
  'preferência desconhecida é recusada');
select is(public.app_motorista_atualizar_preferencias('{"tema":"dark"}'::jsonb) ->> 'tema', 'dark', 'preferência atualizada');
select throws_ok($$ select public.app_motorista_atualizar_perfil(null, 'nao-e-email', null, null) $$, '22023', null,
  'e-mail pessoal inválido é recusado');
select is(public.app_motorista_atualizar_perfil('(11) 98888-7777', null, null, '{"nome":"Maria"}'::jsonb) -> 'contato_emergencia' ->> 'nome',
  'Maria', 'motorista atualiza os campos permitidos');

-- ---------------------------------------------------------------------------
-- 9) Suspensão vale na hora
-- ---------------------------------------------------------------------------
reset role;
select pg_temp.como('adadadad-0000-0000-0000-000000000101');
set local role authenticated;
select lives_ok($$ select public.app_motorista_definir_situacao('b2b2b2b2-0000-0000-0000-000000000101', 'suspenso') $$,
  'admin suspende o motorista B');
reset role;
-- claims antigas (token ainda válido) não bastam: toda RPC confere o cadastro
select set_config('request.jwt.claims', json_build_object('sub', 'b2b2b2b2-0000-0000-0000-000000000101', 'role', 'authenticated',
  'portal', 'app-motorista', 'user_role', 'motorista_terceiro',
  'app_motorista_tenant_id', '00000000-0000-4000-8000-00000000a001')::text, true);
set local role authenticated;
select throws_ok($$ select public.app_motorista_contexto() $$, '42501', null, 'motorista suspenso é recusado mesmo com token antigo');

-- ---------------------------------------------------------------------------
-- 10) Login por CPF/matrícula (service_role, Edge Function)
-- ---------------------------------------------------------------------------
reset role;
set local role service_role;
select is((select email from public.app_motorista_login_resolver('123.456.789-01', '10.0.0.1')), 'mot.a101@teste.local',
  'login: CPF formatado resolve o e-mail');
select is((select email from public.app_motorista_login_resolver('mat101', '10.0.0.1')), 'mot.a101@teste.local',
  'login: matrícula (sem diferenciar maiúsculas) resolve o e-mail');
select is((select email from public.app_motorista_login_resolver('98765432100', '10.0.0.1')), null,
  'login: motorista suspenso não resolve');
select lives_ok($$ select public.app_motorista_login_registrar('00000000000', '10.0.0.9', false) from generate_series(1, 5) $$,
  'registra 5 falhas');
select is((select bloqueado from public.app_motorista_login_resolver('000.000.000-00', '10.0.0.2')), true,
  'login: identificador bloqueado após 5 falhas em 15 min');

select * from finish();
rollback;
