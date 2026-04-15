create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'nutritionist', 'client')),
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.nutritionists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete cascade,
  clinic_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.access_tokens (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  assigned_to_nutritionist uuid references public.nutritionists(id) on delete set null,
  status text not null default 'available' check (status in ('available', 'assigned', 'revoked')),
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  profile_user_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.client_profiles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  reference_weight numeric(6,2),
  target_weight numeric(6,2),
  height_cm numeric(6,2),
  created_at timestamptz not null default now()
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  client_profile_id uuid not null references public.client_profiles(id) on delete cascade,
  entry_date date not null,
  weight numeric(6,2) not null,
  steps integer not null default 0,
  comment text,
  created_at timestamptz not null default now(),
  unique (client_profile_id, entry_date)
);

alter table public.profiles enable row level security;
alter table public.nutritionists enable row level security;
alter table public.access_tokens enable row level security;
alter table public.clients enable row level security;
alter table public.client_profiles enable row level security;
alter table public.entries enable row level security;

create policy if not exists "profiles self read"
  on public.profiles for select
  using (auth.uid() = id);

create policy if not exists "profiles self update"
  on public.profiles for update
  using (auth.uid() = id);
