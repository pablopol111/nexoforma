-- NexoForma base schema
-- Ejecutar en el editor SQL de Supabase

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  full_name text not null,
  role text not null check (role in ('admin', 'nutritionist', 'client')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create table if not exists public.access_tokens (
  id bigint generated always as identity primary key,
  code text not null unique,
  role text not null check (role in ('nutritionist', 'client', 'admin')),
  active boolean not null default true,
  used_by uuid null references auth.users (id) on delete set null,
  used_at timestamptz null,
  created_at timestamptz not null default now()
);

alter table public.access_tokens enable row level security;

-- Sin políticas públicas: solo service role puede operar sobre access_tokens.

comment on table public.profiles is 'Perfiles de usuario de NexoForma';
comment on table public.access_tokens is 'Tokens de acceso para altas controladas';
