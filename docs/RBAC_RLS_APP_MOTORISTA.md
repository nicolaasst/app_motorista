# RBAC e RLS — app do motorista no Supabase compartilhado

Status: **desenho para validação — nada aplicado no banco.** O SQL abaixo é ilustrativo, para
revisão; a migration real será escrita depois da aprovação.

## 1. Estado atual (lido do banco em 2026-09-25)

- **540 policies em 184 tabelas**, todas baseadas no claim `tenant_id` do JWT. Padrão:
  - SELECT: `tenant_id = (auth.jwt()->>'tenant_id')::uuid OR auth.jwt()->>'portal' = 'interno'`
  - INSERT/UPDATE: `tenant_id = (auth.jwt()->>'tenant_id')::uuid`
  - exceções: `roles`, `permissions`, `role_permissions` (qualquer `authenticated` lê).
- `authenticated` tem `SELECT, INSERT, UPDATE` em 179 tabelas; `anon` não tem nada.
- Claims vêm de `public.custom_access_token_hook` (lê `public.users` + `roles`): injeta
  `tenant_id`, `portal` e `user_role` se o usuário tem tenant e está `ativo`.
- `users.portal` tem CHECK (`interno`, `portal-cliente`); o trigger `users_valida_portal_tenant`
  exige `interno` ⇔ tenant `plataforma`.
- Papel `motorista_terceiro`: existe, `portal = interno`, **zero permissões**, nenhum usuário.
- Caminhos que poderiam contornar a RLS, verificados: a única view (`etiquetas_canceladores`)
  é `security_invoker` (a RLS vale); a única função `security definer` executável por
  `authenticated` é `ler_dado_sensivel`, que exige o claim `tenant_id` e uma permissão; a
  publicação `supabase_realtime` está vazia; não há buckets de Storage. Ou seja, sem o claim
  `tenant_id`, não sobra caminho aberto no schema atual.
- RPCs do TMS usadas como referência: `atendimento_*` (usam o `tenant_id` do JWT),
  `proximo_codigo(prefixo)` (idem), `ler_dado_sensivel(tabela)` (leitura auditada, LGPD),
  `admin_vincular_usuario(...)` (só `service_role`).

## 2. O problema a resolver

O motorista pertence ao tenant **plataforma** (`NEXUSLOG`), o mesmo das tabelas de TMS,
financeiro, fiscal, RH etc. Se o JWT do motorista trouxer `tenant_id = NEXUSLOG`, a
cláusula `tenant_id = jwt.tenant_id` das 540 policies existentes vale para ele, e ele **lê e
escreve em todas as tabelas do tenant plataforma** (títulos a pagar, saúde de colaboradores,
certificados digitais...). Trocar só o portal não resolve: a cláusula de tenant continua
valendo, independentemente do portal.

Alternativas avaliadas:

| alternativa | efeito | veredito |
|---|---|---|
| Alterar as 540 policies para excluir `portal = 'app-motorista'` | toca 184 tabelas do TMS; toda tabela nova do TMS precisa lembrar da exclusão (se esquecer, abre) | ❌ frágil (fail-open) |
| Tenant próprio para motoristas | quebra as FKs com `motoristas_agregados`/`rotas_roteirizador` (outro tenant) | ❌ |
| **Motorista não recebe o claim `tenant_id`**; recebe `app_motorista_tenant_id` | as 540 policies e todas as RPCs do TMS que leem `jwt.tenant_id` **negam por padrão**, sem alteração; tabelas novas do TMS continuam seguras sem lembrar do app | ✅ **escolhida (fail-closed)** |

## 3. Claims do JWT

| claim | interno / portal-cliente (sem mudança) | app-motorista |
|---|---|---|
| `tenant_id` | uuid do tenant | **ausente** |
| `portal` | `interno` / `portal-cliente` | `app-motorista` |
| `user_role` | código do papel | `motorista_terceiro` |
| `app_motorista_tenant_id` | ausente | uuid do tenant plataforma |

O hook só emite os claims de motorista se, além de `users.ativo`, o papel for
`motorista_terceiro` **e** o `app_motorista_perfis.situacao_cadastro = 'ativo'`. Caso
contrário, o motorista não recebe claim nenhum: o app o trata como `user_not_registered`
(estado que já existe no `AuthContext`).

```sql
-- trecho a acrescentar em public.custom_access_token_hook (ilustrativo)
if v_portal = 'app-motorista' then
  claims := claims - 'tenant_id';
  if v_tenant_id is not null and coalesce(v_ativo, false)
     and v_role_code = 'motorista_terceiro'
     and exists (select 1 from public.app_motorista_perfis p
                 where p.user_id = (event->>'user_id')::uuid
                   and p.situacao_cadastro = 'ativo' and p.deleted_at is null) then
    claims := jsonb_set(claims, '{portal}', to_jsonb('app-motorista'::text));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(v_role_code));
    claims := jsonb_set(claims, '{app_motorista_tenant_id}', to_jsonb(v_tenant_id::text));
  end if;
  return jsonb_set(event, '{claims}', claims);
end if;
-- ... fluxo atual inalterado para interno / portal-cliente
```

Pré-requisito: confirmar qual hook está ativo na configuração do Auth — a função SQL ou a
Edge Function `auth-hook-claims` (OQ-01). A mudança tem que ir para o hook que estiver ativo.

## 4. Mudanças em objetos compartilhados com o TMS

Todas pequenas e aditivas. É a lista completa do que o app altera fora do prefixo
`app_motorista_`:

| objeto | mudança | risco para o TMS |
|---|---|---|
| `users_portal_check` | aceitar `'app-motorista'` | nenhum (aditivo) |
| `users_valida_portal_tenant()` | `app-motorista` só em tenant `plataforma`; `app-motorista` ⇔ papel `motorista_terceiro` (nos dois sentidos: fecha a brecha de hoje, em que o papel pode ser vinculado com `interno`) | baixo: só rejeita combinações inválidas |
| `custom_access_token_hook` (ou `auth-hook-claims`) | ramo `app-motorista` (§3); ramos atuais inalterados | médio: é o login de todo mundo → coberto por teste pgTAP dos três portais |
| `roles` (`motorista_terceiro`) | `portal` passa de `interno` para `app-motorista` | nenhum (sem usuários) |
| `mensagens_ticket_autor_tipo_check` | aceitar `'motorista'` | nenhum (aditivo); telas do TMS que exibem autor precisam de um rótulo para esse valor |
| `proximo_codigo` | nova sobrecarga `proximo_codigo(p_tenant uuid, p_prefixo text)`, **sem** `grant` para `authenticated` (uso interno das RPCs `security definer`); a versão atual passa a delegar a ela | nenhum (mesmo comportamento) |
| `leitura_auditada` | 3 linhas novas (§6) | nenhum |

**Nenhuma das 540 policies existentes é alterada.**

## 5. Policies e grants das tabelas `app_motorista_*`

### 5.1 Grants

- `authenticated`: **somente `SELECT`** nas tabelas do app (nenhum `INSERT/UPDATE/DELETE`).
  Toda escrita do motorista passa por RPC `security definer` (§5.4): valida a máquina de
  estados, calcula no servidor hash/geofence/IP e aplica idempotência.
- `anon`: nada. `service_role`: tudo (Edge Functions).
- Tabelas sensíveis (`perfis`, `contas_bancarias`, `documentos_pessoais`): o motorista lê a
  própria linha; usuários internos **não** têm policy de SELECT direta — leem por
  `ler_dado_sensivel()` (§6).

### 5.2 Funções auxiliares (`stable`, `security definer`, `search_path = ''`)

```sql
-- tenant do motorista logado; null para qualquer outro portal
create function public.app_motorista_tenant() returns uuid
language sql stable as $$
  select case when auth.jwt()->>'portal' = 'app-motorista'
              then (auth.jwt()->>'app_motorista_tenant_id')::uuid end $$;

-- usuário interno do mesmo tenant com a permissão pedida
create function public.app_motorista_interno_pode(p_permissao text) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.jwt()->>'portal' = 'interno' and exists (
    select 1 from public.role_permissions rp
      join public.roles r on r.id = rp.role_id
      join public.permissions p on p.id = rp.permission_id
     where r.code = auth.jwt()->>'user_role' and p.code = p_permissao) $$;
```

### 5.3 Modelo de policy (duas policies de SELECT por tabela, nada mais)

```sql
alter table public.app_motorista_rotas enable row level security;

create policy app_motorista_proprio_select on public.app_motorista_rotas
  for select to authenticated
  using (tenant_id = (select public.app_motorista_tenant())
         and motorista_id = (select auth.uid())
         and deleted_at is null);

create policy app_motorista_interno_select on public.app_motorista_rotas
  for select to authenticated
  using (tenant_id = ((select auth.jwt())->>'tenant_id')::uuid
         and (select public.app_motorista_interno_pode('tms.ver')));
```

`(select ...)` em volta das funções segue o padrão `initplan` que o TMS já adotou
(`b9_c_rls_initplan_indices_fk`). Índice `(tenant_id, motorista_id)` em toda tabela com
`motorista_id`.

### 5.4 Matriz de acesso

Permissões internas: **só vocabulário existente**, nenhuma permissão nova.

| tabela | motorista (portal `app-motorista`) | interno — leitura | interno — escrita (via RPC) |
|---|---|---|---|
| `perfis` | própria linha | `ler_dado_sensivel` + `rh.ver` | vincular/ativar/suspender: `rh.editar` |
| `preferencias` | própria | — | — |
| `rotas`, `paradas`, `volumes` | próprias | `tms.ver` | publicar/replanejar rota: `tms.operar` |
| `comprovantes`, `insucessos`, `checklists` | próprios | `tms.ver` | — (fato do motorista, imutável) |
| `gps_pontos` | próprios | `tms.ver` ou `torre.ver` | — |
| `alertas_via` | próprios | `tms.ver` ou `torre.ver` | — |
| `notificacoes` | próprias | — | geradas por trigger/RPC do sistema |
| `faq` | do tenant | `atendimento.ver` | `atendimento.registrar` |
| `documentos_pessoais` | próprios | `ler_dado_sensivel` + `rh.ver` | validar documento: `rh.editar` |
| `contas_bancarias` | próprias | `ler_dado_sensivel` + `financeiro.ver` | aprovar/rejeitar troca: `financeiro.aprovar` |
| `recibos`, `recibo_itens`, `recibo_rotas` | próprios | `financeiro.ver` | emitir: `financeiro.lancar`; marcar pago: `financeiro.conciliar` |
| `chamados` | próprios | `atendimento.ver` | responder: `atendimento.registrar` (RPCs `atendimento_*` do TMS) |
| `emergencias` | próprias | `torre.ver` ou `tms.ver` | reconhecer/encerrar: `tms.operar` |
| `operacoes` | — (só RPC) | — | — |

**`motorista_terceiro` continua sem linhas em `role_permissions`.** O acesso do motorista não
depende de permissão: vem de portal + dono da linha. As permissões do vocabulário
(`tms.ver`, `financeiro.aprovar`...) controlam telas internas, e nenhuma delas deve valer para o
motorista. Isso atende à regra "não inventar vocabulário" e mantém o motorista fora de qualquer
`ler_dado_sensivel` (que exige permissão).

### 5.5 RPCs do motorista (escrita)

Todas `security definer`, `set search_path = ''`, `grant execute to authenticated`. Primeira
linha de cada uma: `v_tenant := public.app_motorista_tenant(); if v_tenant is null then raise
insufficient_privilege`. As que recebem `p_chave uuid` consultam/gravam
`app_motorista_operacoes` (idempotência).

| RPC | substitui (Base44) | regras no servidor |
|---|---|---|
| `app_motorista_contexto()` | `getDriver()` / `DriverProfile.list()` | perfil + preferências do próprio motorista (substitui o `profiles[0]` com fallback `seed-driver-lucas`) |
| `app_motorista_meu_veiculo(p_rota_id)` | `Vehicle.list()` | só o veículo da rota do próprio motorista |
| `app_motorista_iniciar_rota(p_chave, p_rota_id, p_itens, p_odometro, p_foto_id)` | `VehicleChecklist.create` + `Route.update` + `Vehicle.update` | status `planejada → em_operacao`; checklist `pre`; item crítico reprovado bloqueia; hodômetro do TMS só sobe |
| `app_motorista_status_parada(p_chave, p_parada_id, p_status, p_em)` | `Stop.update` | `nao_iniciada → em_rota → em_atendimento` |
| `app_motorista_bipar_volume(p_chave, p_parada_id, p_codigo, p_lido_em)` | `Volume.update/updateMany` | código fora da parada → `divergente` |
| `app_motorista_confirmar_entrega(p_chave, p_parada_id, recebedor..., p_assinatura_id, p_fotos uuid[], p_lat, p_lng, p_precisao, p_entregue_em, p_dispositivo)` | `DeliveryProof.create` + `Stop.update` | SHA-256 da assinatura, distância e geofence calculados aqui; parada `→ entregue` na mesma transação |
| `app_motorista_registrar_insucesso(p_chave, p_parada_id, p_motivo, ..., p_devolver_volumes)` | `FailureReport.create` + `Stop.update` + `Volume.updateMany` | idem, atômico |
| `app_motorista_registrar_gps(p_rota_id, p_pontos jsonb)` | `Route.update({gps_track})` | `insert ... on conflict do nothing`; rota tem que estar `em_operacao`; lote ≤ 500 pontos |
| `app_motorista_atualizar_polyline(p_rota_id, p_polyline)` | `Route.update({polyline})` | |
| `app_motorista_concluir_rota(p_chave, p_rota_id)` | `Route.update({status:'concluida'})` | todas as paradas em estado final |
| `app_motorista_encerrar_turno(p_chave, p_rota_id, p_itens, p_odometro, p_foto_id)` | `VehicleChecklist.create` + `Route.update` + `Vehicle.update` | checklist `retorno`; odômetro final ≥ inicial |
| `app_motorista_reportar_alerta_via(p_chave, ...)` | `RoadHazardReport` (sem tela ainda) | |
| `app_motorista_acionar_emergencia(p_chave, p_tipo, p_lat, p_lng, p_precisao, p_acionada_em, p_rota_id)` | categoria `emergencia` de `Ticket` | fluxo próprio (arquitetura §8) |
| `app_motorista_abrir_chamado(p_chave, p_categoria, p_assunto, p_descricao, p_rota_id, p_recibo_id)` | `Ticket.create` | insere em `tickets_atendimento` + `mensagens_ticket` (`autor_tipo='motorista'`) + `app_motorista_chamados`; mesmos limites de `atendimento_abrir_chamado` (140/4000); `emergencia` rejeitada |
| `app_motorista_meus_chamados()` / `app_motorista_mensagens_chamado(p_codigo)` | `Ticket.filter` | só chamados vinculados ao motorista |
| `app_motorista_responder_chamado(p_codigo, p_texto, p_documento_id)` | — | só em chamado próprio e não encerrado |
| `app_motorista_solicitar_exclusao_conta()` | `Ticket.create` (LGPD) | abre chamado padronizado |
| `app_motorista_marcar_notificacao_lida(p_id)` | `Notification.update` | |
| `app_motorista_atualizar_perfil(p_telefone, p_email_pessoal, p_endereco, p_contato_emergencia)` | `DriverProfile.update` | **só estes campos**; nome/CPF/CNH mudam via central (OQ-10) |
| `app_motorista_definir_avatar(p_documento_id)` | `DriverProfile.update({avatar_url})` | documento tem que ser do próprio motorista |
| `app_motorista_atualizar_preferencias(p jsonb)` | `DriverPreferences.update` | lista fechada de chaves |
| `app_motorista_solicitar_troca_conta(...)` | `BankAccount` (`pending_change`) | cria conta `pendente_aprovacao`; a atual continua `ativa` até aprovação |
| `app_motorista_assinar_recibo(p_chave, p_recibo_id, p_assinatura_id, p_lat, p_lng)` | `Receipt.update` | só `pendente_assinatura` e dentro do prazo; hash = SHA-256 do JSON canônico (recibo + itens + id da assinatura); IP de `request.headers` |
| `app_motorista_contestar_recibo(p_chave, p_recibo_id, p_motivo)` | — | `→ em_contestacao` + chamado `pagamento` |

### 5.6 RPCs internas (TMS)

| RPC | permissão | efeito |
|---|---|---|
| `app_motorista_vincular_motorista(p_email, p_motorista_agregado_id, p_cpf, p_matricula, ...)` | `rh.editar` | cria/atualiza `users` (portal `app-motorista`, papel `motorista_terceiro`) + `app_motorista_perfis`; alternativa com permissão a `admin_vincular_usuario` (restrita a `service_role`) |
| `app_motorista_situacao_motorista(p_user_id, p_situacao)` | `rh.editar` | ativar/suspender (vale no próximo refresh do token, ≤ 1 h — OQ-11) |
| `app_motorista_publicar_rota(p_rota_roteirizador_id, p_motorista_user_id, p_data, ...)` | `tms.operar` | materializa `rotas` + `paradas` + `volumes` a partir da rota planejada (OQ-04) |
| `app_motorista_emitir_recibo(...)` | `financeiro.lancar` | cria recibo + itens + rotas; status `pendente_assinatura` |
| `app_motorista_decidir_troca_conta(p_conta_id, p_aprovar)` | `financeiro.aprovar` | |
| `app_motorista_tratar_emergencia(p_id, p_status, p_notas)` | `tms.operar` | reconhecer / em atendimento / encerrar / falso alarme |

## 6. Dados pessoais (LGPD)

Reaproveita o mecanismo do TMS (`leitura_auditada` + `ler_dado_sensivel`, que grava
`audit_log` a cada leitura):

| tabela | permissão | filtro |
|---|---|---|
| `app_motorista_perfis` | `rh.ver` | `true` |
| `app_motorista_documentos_pessoais` | `rh.ver` | `true` |
| `app_motorista_contas_bancarias` | `financeiro.ver` | `t.situacao in ('ativa','pendente_aprovacao')` |

Ajuste necessário: `ler_dado_sensivel` filtra `t.deleted_at is null` e `t.tenant_id`; as três
tabelas têm as duas colunas, então funcionam sem mudança na função.
Exclusão de conta (LGPD): chamado padronizado → a central anonimiza por RPC (fora do escopo
desta fase; OQ-12).

## 7. Armazenamento (R2 + `documents`)

- Chave: `{tenant_id}/app-motorista/{motorista_id}/{entity_table}/{uuid}.{ext}` — atende ao
  CHECK `documents_r2_key_do_tenant` (prefixo do tenant, sem `..`).
- O motorista não escreve em `documents` direto (não tem `tenant_id` no JWT, e a policy de
  INSERT do TMS nega). Upload e download passam por Edge Functions (arquitetura §6) com
  `service_role`, que validam o dono antes de assinar a URL.
- Tipos aceitos: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`; limite de 10 MB
  por arquivo (OQ-13).

## 8. Plano de testes (pgTAP) — critério de aceite do RLS

Em `supabase/tests/app_motorista_rls.test.sql`, com JWTs simulados por
`set local request.jwt.claims`:

1. **Isolamento do TMS:** para cada uma das 184 tabelas `public` que existem hoje, um motorista
   (claims `portal=app-motorista`, sem `tenant_id`) vê **0 linhas** e não consegue
   `INSERT`/`UPDATE`. Gerado por laço sobre `pg_tables`, para cobrir também tabelas futuras.
2. Motorista A não vê linhas do motorista B em nenhuma das 20 tabelas `app_motorista_*`.
3. Motorista não tem `INSERT`/`UPDATE`/`DELETE` direto em nenhuma tabela do app.
4. Usuário `portal-cliente` vê 0 linhas das tabelas do app.
5. Usuário `interno` sem `tms.ver` vê 0 linhas de `rotas`; com `tms.ver` vê as do tenant.
6. Interno lê `perfis`/`contas_bancarias` só via `ler_dado_sensivel`, e cada leitura grava
   `audit_log`.
7. `users_valida_portal_tenant` rejeita `motorista_terceiro` + `interno`, `app-motorista` em
   tenant `cliente` e `app-motorista` com papel diferente de `motorista_terceiro`.
8. Hook: gera os claims certos para os três portais; motorista `suspenso` não recebe claim.
9. RPC com a mesma `p_chave` duas vezes → uma linha, mesmo resultado.
10. RPC com `parada_id` de outro motorista → `insufficient_privilege`.
11. `assinar_recibo` rejeita status ≠ `pendente_assinatura` e prazo vencido; o hash
    independe do que o cliente envia.
12. `anon` não executa nenhuma RPC `app_motorista_*` nem lê nenhuma tabela do app.
