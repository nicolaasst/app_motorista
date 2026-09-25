-- App Motorista, lote E — apoio ao login por CPF/matrícula e à recuperação de
-- senha (Edge Function app-motorista-login). Corrige o B-01: antes, o app
-- baixava o cadastro de TODOS os motoristas para o aparelho, sem login, só para
-- achar o e-mail pelo CPF.
--
-- As duas funções são executáveis só por service_role (a Edge Function). O
-- e-mail resolvido nunca volta para o aparelho. Tentativas ficam registradas
-- pelo SHA-256 de contexto + identificador (nunca o CPF em claro), com limite
-- por contexto — 'login', 'envio_codigo', 'verificacao_codigo' — de 5 falhas por
-- identificador e 20 por IP a cada 15 minutos. Contextos separados: um ataque
-- de senha que bloqueia o login não bloqueia a recuperação (o caminho legítimo).
--
-- Sem bloco `do $$`; corpo de função com $fn$.

alter table public.app_motorista_tentativas_login
  add column contexto text not null default 'login' check (contexto in ('login', 'envio_codigo', 'verificacao_codigo'));

create or replace function public.app_motorista_login_chave(p_identificador text, p_contexto text)
returns text
language sql
immutable
set search_path = ''
as $fn$
  select encode(sha256(convert_to(p_contexto || '|' ||
    case when btrim(p_identificador) like '%@%' then lower(btrim(p_identificador))
         else upper(regexp_replace(btrim(p_identificador), '[^0-9A-Za-z]', '', 'g')) end, 'UTF8')), 'hex');
$fn$;

-- Resolve CPF, matrícula ou e-mail → e-mail de login de um motorista ATIVO.
-- `bloqueado` = limite de tentativas atingido (a Edge Function responde 429).
create or replace function public.app_motorista_login_resolver(p_identificador text, p_ip inet, p_contexto text default 'login')
returns table (email text, bloqueado boolean)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_chave text := public.app_motorista_login_chave(p_identificador, p_contexto);
  v_digitos text := regexp_replace(coalesce(p_identificador, ''), '\D', '', 'g');
  v_bruto text := btrim(coalesce(p_identificador, ''));
begin
  if p_contexto not in ('login', 'envio_codigo', 'verificacao_codigo') then
    raise exception 'contexto inválido' using errcode = '22023';
  end if;
  if (select count(*) from public.app_motorista_tentativas_login t
       where t.chave = v_chave and not t.sucesso and t.created_at > now() - interval '15 minutes') >= 5
     or (p_ip is not null and (select count(*) from public.app_motorista_tentativas_login t
       where t.ip = p_ip and t.contexto = p_contexto and not t.sucesso
         and t.created_at > now() - interval '15 minutes') >= 20) then
    return query select null::text, true;
    return;
  end if;

  return query
  select lower(u.email), false
  from public.app_motorista_perfis p
  join public.users u on u.id = p.user_id
  where p.situacao_cadastro = 'ativo' and p.deleted_at is null
    and u.ativo and u.portal = 'app-motorista'
    and case
          when v_bruto like '%@%' then lower(u.email) = lower(v_bruto)
          when (length(v_digitos) = 11 and v_digitos = v_bruto) or v_bruto ~ '^[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}$'
            then p.cpf = v_digitos
          else upper(p.matricula) = upper(v_bruto)
        end
  limit 1;
  if not found then
    return query select null::text, false;
  end if;
end;
$fn$;

create or replace function public.app_motorista_login_registrar(p_identificador text, p_ip inet, p_sucesso boolean,
  p_contexto text default 'login')
returns void
language sql
security definer
set search_path = ''
as $fn$
  insert into public.app_motorista_tentativas_login (chave, ip, sucesso, contexto)
  values (public.app_motorista_login_chave(p_identificador, p_contexto), p_ip, p_sucesso, p_contexto);
  -- limpeza oportunista: nada com mais de 1 dia é útil para o limite
  delete from public.app_motorista_tentativas_login where created_at < now() - interval '1 day';
$fn$;

revoke all on function public.app_motorista_login_chave(text, text) from public, anon, authenticated;
revoke all on function public.app_motorista_login_resolver(text, inet, text) from public, anon, authenticated;
revoke all on function public.app_motorista_login_registrar(text, inet, boolean, text) from public, anon, authenticated;
grant execute on function public.app_motorista_login_resolver(text, inet, text) to service_role;
grant execute on function public.app_motorista_login_registrar(text, inet, boolean, text) to service_role;
