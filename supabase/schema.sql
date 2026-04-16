create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  email text not null,
  full_name text not null,
  role text not null check (role in ('admin', 'nutritionist', 'client')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_username_key on public.profiles (lower(username));
create unique index if not exists profiles_email_key on public.profiles (lower(email));

create table if not exists public.nutritionists (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  clinic_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  nutritionist_user_id uuid not null references public.nutritionists (user_id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_nutritionist_user_id_idx on public.clients (nutritionist_user_id);

create table if not exists public.client_profiles (
  client_user_id uuid primary key references public.clients (user_id) on delete cascade,
  age integer,
  height_cm numeric(5,2),
  gender text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  client_user_id uuid not null references public.clients (user_id) on delete cascade,
  recorded_by_user_id uuid not null references public.profiles (id) on delete cascade,
  weight_kg numeric(6,2) not null,
  body_fat_pct numeric(5,2),
  notes text,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists entries_client_user_id_idx on public.entries (client_user_id, recorded_at desc);

create table if not exists public.access_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  created_by_user_id uuid references public.profiles (id) on delete set null,
  status text not null default 'available' check (status in ('available', 'used', 'revoked')),
  created_at timestamptz not null default now(),
  token_type text not null check (token_type in ('nutritionist_invite', 'client_invite')),
  assigned_to_nutritionist uuid references public.nutritionists (user_id) on delete set null,
  assigned_to_client uuid references public.clients (user_id) on delete set null,
  expires_at timestamptz,
  used_at timestamptz
);

create index if not exists access_tokens_type_status_idx on public.access_tokens (token_type, status);
create index if not exists access_tokens_created_by_idx on public.access_tokens (created_by_user_id);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_nutritionists_updated_at
before update on public.nutritionists
for each row
execute function public.set_updated_at();

create trigger set_clients_updated_at
before update on public.clients
for each row
execute function public.set_updated_at();

create trigger set_client_profiles_updated_at
before update on public.client_profiles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.nutritionists enable row level security;
alter table public.clients enable row level security;
alter table public.client_profiles enable row level security;
alter table public.entries enable row level security;
alter table public.access_tokens enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "nutritionists_select_own_or_admin"
on public.nutritionists
for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

create policy "clients_select_client_or_linked_nutritionist_or_admin"
on public.clients
for select
to authenticated
using (
  auth.uid() = user_id
  or nutritionist_user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

create policy "client_profiles_select_client_or_linked_nutritionist_or_admin"
on public.client_profiles
for select
to authenticated
using (
  auth.uid() = client_user_id
  or exists (
    select 1
    from public.clients c
    where c.user_id = client_profiles.client_user_id
      and c.nutritionist_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

create policy "client_profiles_update_own"
on public.client_profiles
for update
to authenticated
using (auth.uid() = client_user_id)
with check (auth.uid() = client_user_id);

create policy "entries_select_client_or_linked_nutritionist_or_admin"
on public.entries
for select
to authenticated
using (
  auth.uid() = client_user_id
  or exists (
    select 1
    from public.clients c
    where c.user_id = entries.client_user_id
      and c.nutritionist_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

create policy "entries_insert_client_or_linked_nutritionist"
on public.entries
for insert
to authenticated
with check (
  auth.uid() = client_user_id
  or exists (
    select 1
    from public.clients c
    where c.user_id = entries.client_user_id
      and c.nutritionist_user_id = auth.uid()
  )
);

create policy "entries_update_client_or_linked_nutritionist"
on public.entries
for update
to authenticated
using (
  auth.uid() = client_user_id
  or exists (
    select 1
    from public.clients c
    where c.user_id = entries.client_user_id
      and c.nutritionist_user_id = auth.uid()
  )
)
with check (
  auth.uid() = client_user_id
  or exists (
    select 1
    from public.clients c
    where c.user_id = entries.client_user_id
      and c.nutritionist_user_id = auth.uid()
  )
);

create policy "access_tokens_select_creator_or_assigned_or_admin"
on public.access_tokens
for select
to authenticated
using (
  created_by_user_id = auth.uid()
  or assigned_to_nutritionist = auth.uid()
  or assigned_to_client = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);
