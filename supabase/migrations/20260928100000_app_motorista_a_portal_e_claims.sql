-- App Motorista, lote A — portal `app-motorista` e claims do JWT.
--
-- Único lote do app que altera objetos do TMS. Tudo aditivo; os fluxos atuais
-- de `interno` e `portal-cliente` ficam idênticos (coberto pelos pgTAP do TMS).
-- Desenho completo: docs/RBAC_RLS_APP_MOTORISTA.md.
--
-- Por que o motorista NÃO recebe a claim `tenant_id`:
--   o motorista pertence ao tenant plataforma, o mesmo das tabelas de TMS,
--   financeiro, fiscal e RH. Todas as policies do TMS liberam
--   `tenant_id = jwt.tenant_id`; com essa claim ele leria o tenant inteiro.
--   Sem ela, toda policy e toda RPC do TMS nega por padrão (fail-closed), e
--   tabelas novas do TMS continuam seguras sem precisar lembrar do app.
--   O tenant do motorista vai numa claim própria, `app_motorista_tenant_id`,
--   que só as policies/RPCs `app_motorista_*` leem.
--
-- Mudanças em objetos do TMS (lista completa):
--   1. users/roles: CHECK de portal aceita 'app-motorista';
--   2. users_valida_portal_tenant(): 'app-motorista' só no tenant plataforma e
--      sempre com o perfil motorista_terceiro (nos dois sentidos) — fecha a
--      brecha de hoje, em que motorista_terceiro podia ser vinculado ao
--      portal interno e ganhar leitura entre tenants; o trigger passa a
--      disparar também em mudança de role_id;
--   3. roles.motorista_terceiro: portal 'interno' → 'app-motorista'
--      (sem usuários hoje; perfil reservado para o app desde a B0.6);
--   4. custom_access_token_hook: ramo novo para 'app-motorista'.
--
-- Sem bloco `do $$`; corpo de função com $fn$.

-- 1) portal 'app-motorista' ---------------------------------------------------
alter table public.users drop constraint users_portal_check;
alter table public.users add constraint users_portal_check
  check (portal in ('interno', 'portal-cliente', 'app-motorista'));

alter table public.roles drop constraint roles_portal_check;
alter table public.roles add constraint roles_portal_check
  check (portal in ('interno', 'portal-cliente', 'app-motorista'));

-- 2) validação portal × tenant × perfil ----------------------------------------
create or replace function public.users_valida_portal_tenant()
returns trigger
language plpgsql
set search_path = public
as $fn$
declare
  v_tipo text;
  v_role_code text;
begin
  select tipo into v_tipo from public.tenants where id = new.tenant_id;
  select code into v_role_code from public.roles where id = new.role_id;

  if new.portal = 'interno' and v_tipo is distinct from 'plataforma' then
    raise exception 'portal interno só para usuários do tenant plataforma (tenant % é %)', new.tenant_id, v_tipo
      using errcode = 'check_violation';
  end if;
  if new.portal = 'portal-cliente' and v_tipo = 'plataforma' then
    raise exception 'usuário do tenant plataforma usa o portal interno'
      using errcode = 'check_violation';
  end if;
  -- App Motorista: motoristas são do tenant plataforma e só entram pelo app.
  if new.portal = 'app-motorista' and v_tipo is distinct from 'plataforma' then
    raise exception 'portal app-motorista só para usuários do tenant plataforma (tenant % é %)', new.tenant_id, v_tipo
      using errcode = 'check_violation';
  end if;
  if new.portal = 'app-motorista' and v_role_code is distinct from 'motorista_terceiro' then
    raise exception 'portal app-motorista exige o perfil motorista_terceiro'
      using errcode = 'check_violation';
  end if;
  if v_role_code = 'motorista_terceiro' and new.portal is distinct from 'app-motorista' then
    raise exception 'perfil motorista_terceiro só entra pelo portal app-motorista'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$fn$;

revoke execute on function public.users_valida_portal_tenant() from public;

drop trigger users_valida_portal_tenant on public.users;
create trigger users_valida_portal_tenant
  before insert or update of portal, tenant_id, role_id on public.users
  for each row execute function public.users_valida_portal_tenant();

-- 3) perfil do motorista ---------------------------------------------------------
update public.roles
set portal = 'app-motorista',
    descricao = 'Motorista do App Motorista: acesso só às próprias rotas, entregas e recibos (portal app-motorista)'
where code = 'motorista_terceiro';

-- 4) claims -----------------------------------------------------------------------
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = public
as $fn$
declare
  claims jsonb;
  v_tenant_id uuid;
  v_portal text;
  v_role_code text;
  v_ativo boolean;
begin
  select u.tenant_id, u.portal, u.ativo, r.code
    into v_tenant_id, v_portal, v_ativo, v_role_code
  from public.users u
  left join public.roles r on r.id = u.role_id
  where u.id = (event->>'user_id')::uuid;

  claims := event->'claims';

  -- App Motorista: nunca recebe `tenant_id` (ver cabeçalho). Suspender o
  -- motorista = users.ativo false → sem claims → o app mostra "não cadastrado".
  if v_portal = 'app-motorista' then
    claims := claims - 'tenant_id' - 'portal' - 'user_role' - 'app_motorista_tenant_id';
    if v_tenant_id is not null and coalesce(v_ativo, false) and v_role_code = 'motorista_terceiro' then
      claims := jsonb_set(claims, '{portal}', to_jsonb('app-motorista'::text));
      claims := jsonb_set(claims, '{user_role}', to_jsonb(v_role_code));
      claims := jsonb_set(claims, '{app_motorista_tenant_id}', to_jsonb(v_tenant_id::text));
    end if;
    return jsonb_set(event, '{claims}', claims);
  end if;

  -- Usuário sem perfil (ainda não vinculado a um tenant) ou inativo: não injeta
  -- claims de tenant — RLS de toda tabela de negócio nega tudo por padrão sem elas.
  if v_tenant_id is not null and coalesce(v_ativo, false) then
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(v_tenant_id::text));
    claims := jsonb_set(claims, '{portal}', to_jsonb(v_portal));
    if v_role_code is not null then
      claims := jsonb_set(claims, '{user_role}', to_jsonb(v_role_code));
    end if;
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$fn$;

grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
