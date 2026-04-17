begin;

create extension if not exists pgcrypto;

drop table if exists public.pdf_exports cascade;
drop table if exists public.onboarding_state cascade;
drop table if exists public.measurement_requests cascade;
drop table if exists public.measurement_entries cascade;
drop table if exists public.daily_entries cascade;
drop table if exists public.client_profiles cascade;
drop table if exists public.clients cascade;
drop table if exists public.nutritionists cascade;
drop table if exists public.access_tokens cascade;
drop table if exists public.profiles cascade;

drop function if exists public.set_updated_at() cascade;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  email text not null,
  full_name text not null,
  role text not null check (role in ('admin', 'nutritionist', 'client')),
  status text not null default 'active' check (status in ('pending', 'active', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_username_key on public.profiles (lower(username));
create unique index profiles_email_key on public.profiles (lower(email));

create table public.nutritionists (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  alias text,
  clinic_name text,
  client_token_quota_total integer not null default 5 check (client_token_quota_total >= 0),
  created_by_admin boolean not null default false,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  nutritionist_user_id uuid not null references public.nutritionists(user_id) on delete restrict,
  blocked_by_nutritionist_status boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_nutritionist_user_id_idx on public.clients (nutritionist_user_id);

create table public.client_profiles (
  client_user_id uuid primary key references public.clients(user_id) on delete cascade,
  first_name text,
  last_name text,
  age integer check (age is null or age >= 0),
  sex text check (sex in ('male', 'female') or sex is null),
  height_cm numeric(6,2) check (height_cm is null or height_cm > 0),
  reference_weight_kg numeric(6,2) check (reference_weight_kg is null or reference_weight_kg > 0),
  target_weight_kg numeric(6,2) check (target_weight_kg is null or target_weight_kg > 0),
  profile_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  client_user_id uuid not null references public.clients(user_id) on delete cascade,
  entry_date date not null,
  weight_kg numeric(6,2) not null check (weight_kg > 0),
  steps numeric(12,2) not null default 0 check (steps >= 0),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index daily_entries_client_date_key on public.daily_entries (client_user_id, entry_date);
create index daily_entries_client_date_desc_idx on public.daily_entries (client_user_id, entry_date desc);

create table public.measurement_entries (
  id uuid primary key default gen_random_uuid(),
  client_user_id uuid not null references public.clients(user_id) on delete cascade,
  entry_date date not null,
  weight_kg numeric(6,2) check (weight_kg is null or weight_kg > 0),
  waist_cm numeric(6,2) check (waist_cm is null or waist_cm > 0),
  hip_cm numeric(6,2) check (hip_cm is null or hip_cm > 0),
  thigh_relaxed_cm numeric(6,2) check (thigh_relaxed_cm is null or thigh_relaxed_cm > 0),
  biceps_normal_cm numeric(6,2) check (biceps_normal_cm is null or biceps_normal_cm > 0),
  biceps_flexed_cm numeric(6,2) check (biceps_flexed_cm is null or biceps_flexed_cm > 0),
  chest_cm numeric(6,2) check (chest_cm is null or chest_cm > 0),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index measurement_entries_client_date_key on public.measurement_entries (client_user_id, entry_date);
create index measurement_entries_client_date_desc_idx on public.measurement_entries (client_user_id, entry_date desc);

create table public.access_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  token_type text not null check (token_type in ('nutritionist_invite', 'client_invite')),
  status text not null default 'available' check (status in ('available', 'used', 'revoked')),
  created_by_user_id uuid references public.profiles(id) on delete set null,
  assigned_to_nutritionist uuid references public.nutritionists(user_id) on delete set null,
  assigned_to_client uuid references public.clients(user_id) on delete set null,
  expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index access_tokens_type_status_idx on public.access_tokens (token_type, status);
create index access_tokens_created_by_idx on public.access_tokens (created_by_user_id);
create index access_tokens_assigned_nutritionist_idx on public.access_tokens (assigned_to_nutritionist);

create table public.measurement_requests (
  id uuid primary key default gen_random_uuid(),
  client_user_id uuid not null references public.clients(user_id) on delete cascade,
  nutritionist_user_id uuid not null references public.nutritionists(user_id) on delete cascade,
  requested_at timestamptz not null default now(),
  weight_status text not null default 'pending' check (weight_status in ('pending', 'completed')),
  weight_completed_at timestamptz,
  measurements_status text not null default 'pending' check (measurements_status in ('pending', 'completed')),
  measurements_completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.onboarding_state (
  client_user_id uuid primary key references public.clients(user_id) on delete cascade,
  first_login_started_at timestamptz,
  skipped boolean not null default false,
  profile_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pdf_exports (
  id uuid primary key default gen_random_uuid(),
  generated_by_user_id uuid not null references public.profiles(id) on delete cascade,
  client_user_id uuid not null references public.clients(user_id) on delete cascade,
  report_type text not null check (report_type in ('simple', 'detailed')),
  start_date date not null,
  end_date date not null,
  include_comments boolean not null default false,
  included_blocks jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_nutritionists_updated_at before update on public.nutritionists for each row execute function public.set_updated_at();
create trigger set_clients_updated_at before update on public.clients for each row execute function public.set_updated_at();
create trigger set_client_profiles_updated_at before update on public.client_profiles for each row execute function public.set_updated_at();
create trigger set_daily_entries_updated_at before update on public.daily_entries for each row execute function public.set_updated_at();
create trigger set_measurement_entries_updated_at before update on public.measurement_entries for each row execute function public.set_updated_at();
create trigger set_onboarding_state_updated_at before update on public.onboarding_state for each row execute function public.set_updated_at();

commit;
