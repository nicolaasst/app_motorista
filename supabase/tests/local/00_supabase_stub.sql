-- Stub mínimo do ambiente Supabase para rodar as migrations do TMS + do app num
-- Postgres puro (sem Docker). Reproduz só o que as migrations e os testes usam:
-- papéis, schema auth (users, uid(), jwt(), role()), schema extensions com
-- pgcrypto e os privilégios padrão que o Supabase concede em `public`.
-- NÃO é aplicado no projeto hospedado — só em banco local de teste.

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin noinherit bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then create role supabase_auth_admin nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then create role authenticator login noinherit; end if;
end $$;
grant anon, authenticated, service_role to authenticator;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists pgtap with schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;
alter database postgres set search_path = "$user", public, extensions;
set search_path = "$user", public, extensions;

create schema if not exists auth;
grant usage on schema auth to anon, authenticated, service_role, supabase_auth_admin;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  encrypted_password text,
  raw_app_meta_data jsonb default '{}'::jsonb,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
create or replace function auth.role() returns text language sql stable as $$
  select coalesce(auth.jwt() ->> 'role', 'anon') $$;
grant execute on all functions in schema auth to anon, authenticated, service_role, supabase_auth_admin;

-- Privilégios padrão que o Supabase aplica ao schema public.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

-- Tabela de histórico de migrations (a CLI do Supabase usa o mesmo formato).
create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (version text primary key, name text, statements text[]);
