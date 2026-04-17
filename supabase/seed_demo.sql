begin;

with nutritionist_auth as (
  select id, email from auth.users where email = 'nutri.demo@nexoforma.local'
)
insert into public.profiles (id, username, email, full_name, role, status)
select na.id, 'nutricionista', na.email, 'Nutricionista Nutricionista', 'nutritionist', 'active' from nutritionist_auth na
on conflict (id) do update set username=excluded.username,email=excluded.email,full_name=excluded.full_name,role=excluded.role,status=excluded.status;

with nutritionist_auth as (
  select id from auth.users where email = 'nutri.demo@nexoforma.local'
)
insert into public.nutritionists (user_id, alias, clinic_name, client_token_quota_total, created_by_admin, activated_at)
select na.id, null, 'Clínica Demo NexoForma', 5, false, now() from nutritionist_auth na
on conflict (user_id) do update set alias=excluded.alias,clinic_name=excluded.clinic_name,client_token_quota_total=excluded.client_token_quota_total,created_by_admin=excluded.created_by_admin,activated_at=excluded.activated_at;

with client_auth as (
  select id, email from auth.users where email = 'cliente.demo@nexoforma.local'
)
insert into public.profiles (id, username, email, full_name, role, status)
select ca.id, 'clientecliente', ca.email, 'Cliente Cliente', 'client', 'active' from client_auth ca
on conflict (id) do update set username=excluded.username,email=excluded.email,full_name=excluded.full_name,role=excluded.role,status=excluded.status;

with client_auth as (
  select id from auth.users where email = 'cliente.demo@nexoforma.local'
), nutritionist_auth as (
  select id from auth.users where email = 'nutri.demo@nexoforma.local'
)
insert into public.clients (user_id, nutritionist_user_id, blocked_by_nutritionist_status)
select ca.id, na.id, false from client_auth ca cross join nutritionist_auth na
on conflict (user_id) do update set nutritionist_user_id=excluded.nutritionist_user_id,blocked_by_nutritionist_status=excluded.blocked_by_nutritionist_status;

with client_auth as (
  select id from auth.users where email = 'cliente.demo@nexoforma.local'
)
insert into public.client_profiles (client_user_id, first_name, last_name, age, sex, height_cm, reference_weight_kg, target_weight_kg, profile_completed_at)
select ca.id, 'Pablo', 'Aguado', 26, 'male', 180, 107.00, 85.00, now() from client_auth ca
on conflict (client_user_id) do update set first_name=excluded.first_name,last_name=excluded.last_name,age=excluded.age,sex=excluded.sex,height_cm=excluded.height_cm,reference_weight_kg=excluded.reference_weight_kg,target_weight_kg=excluded.target_weight_kg,profile_completed_at=excluded.profile_completed_at;

with client_auth as (
  select id from auth.users where email = 'cliente.demo@nexoforma.local'
)
insert into public.onboarding_state (client_user_id, first_login_started_at, skipped, profile_completed, completed_at)
select ca.id, now() - interval '45 days', true, true, now() - interval '45 days' from client_auth ca
on conflict (client_user_id) do update set first_login_started_at=excluded.first_login_started_at, skipped=excluded.skipped, profile_completed=excluded.profile_completed, completed_at=excluded.completed_at;

delete from public.daily_entries where client_user_id = (select id from auth.users where email = 'cliente.demo@nexoforma.local');
delete from public.measurement_entries where client_user_id = (select id from auth.users where email = 'cliente.demo@nexoforma.local');
delete from public.measurement_requests where client_user_id = (select id from auth.users where email = 'cliente.demo@nexoforma.local');

with client_auth as (
  select id from auth.users where email = 'cliente.demo@nexoforma.local'
), series as (
  select generate_series(current_date - interval '45 days', current_date, interval '1 day')::date as entry_date
), demo as (
  select ca.id as client_user_id, s.entry_date,
    case when s.entry_date <= current_date - interval '30 days' then round((107.0 + (random() * 1.8))::numeric, 2)
         when s.entry_date <= current_date - interval '18 days' then round((105.5 + (random() * 1.5))::numeric, 2)
         else round((103.2 + (random() * 1.2))::numeric, 2) end as weight_kg,
    case when s.entry_date <= current_date - interval '30 days' then round((2200 + random() * 1800)::numeric, 2)
         when s.entry_date <= current_date - interval '18 days' then round((4500 + random() * 2500)::numeric, 2)
         else round((7000 + random() * 3000)::numeric, 2) end as steps,
    case when extract(doy from s.entry_date)::int % 9 = 0 then 'Semana irregular, poco descanso.'
         when extract(doy from s.entry_date)::int % 7 = 0 then 'Mejor adherencia y mejores sensaciones.'
         when extract(doy from s.entry_date)::int % 5 = 0 then 'Buen día en alimentación y movimiento.'
         else null end as comment
  from client_auth ca cross join series s
  where s.entry_date not in (current_date - interval '33 days', current_date - interval '32 days', current_date - interval '31 days')
)
insert into public.daily_entries (client_user_id, entry_date, weight_kg, steps, comment)
select client_user_id, entry_date, weight_kg, steps, comment from demo;

with client_auth as (
  select id from auth.users where email = 'cliente.demo@nexoforma.local'
), measure_dates as (
  select * from (values (current_date - interval '42 days'), (current_date - interval '28 days'), (current_date - interval '14 days'), (current_date - interval '3 days')) as t(d)
), demo_measures as (
  select ca.id as client_user_id, md.d::date as entry_date,
    case when md.d::date = (current_date - interval '42 days')::date then 106.80 when md.d::date = (current_date - interval '28 days')::date then 105.70 when md.d::date = (current_date - interval '14 days')::date then 104.20 else 103.40 end as weight_kg,
    case when md.d::date = (current_date - interval '42 days')::date then 104.00 when md.d::date = (current_date - interval '28 days')::date then 101.80 when md.d::date = (current_date - interval '14 days')::date then 99.40 else 97.80 end as waist_cm,
    case when md.d::date = (current_date - interval '42 days')::date then 110.00 when md.d::date = (current_date - interval '28 days')::date then 108.80 when md.d::date = (current_date - interval '14 days')::date then 107.10 else 105.90 end as hip_cm,
    case when md.d::date = (current_date - interval '42 days')::date then 64.00 when md.d::date = (current_date - interval '28 days')::date then 63.40 when md.d::date = (current_date - interval '14 days')::date then 62.90 else 62.10 end as thigh_relaxed_cm,
    case when md.d::date = (current_date - interval '42 days')::date then 34.20 when md.d::date = (current_date - interval '28 days')::date then 34.00 when md.d::date = (current_date - interval '14 days')::date then 33.80 else 33.60 end as biceps_normal_cm,
    case when md.d::date = (current_date - interval '42 days')::date then 36.00 when md.d::date = (current_date - interval '28 days')::date then 35.70 when md.d::date = (current_date - interval '14 days')::date then 35.30 else 35.10 end as biceps_flexed_cm,
    case when md.d::date = (current_date - interval '42 days')::date then 112.00 when md.d::date = (current_date - interval '28 days')::date then 110.80 when md.d::date = (current_date - interval '14 days')::date then 109.10 else 107.80 end as chest_cm,
    case when md.d::date = (current_date - interval '42 days')::date then 'Inicio con malas sensaciones y poca constancia.' when md.d::date = (current_date - interval '28 days')::date then 'Se empieza a ver mejor control.' when md.d::date = (current_date - interval '14 days')::date then 'Mejora visible en cintura y adherencia.' else 'Muy cerca de consolidar una buena dinámica.' end as comment
  from client_auth ca cross join measure_dates md
)
insert into public.measurement_entries (client_user_id, entry_date, weight_kg, waist_cm, hip_cm, thigh_relaxed_cm, biceps_normal_cm, biceps_flexed_cm, chest_cm, comment)
select client_user_id, entry_date, weight_kg, waist_cm, hip_cm, thigh_relaxed_cm, biceps_normal_cm, biceps_flexed_cm, chest_cm, comment from demo_measures;

with client_auth as (
  select id from auth.users where email = 'cliente.demo@nexoforma.local'
), nutritionist_auth as (
  select id from auth.users where email = 'nutri.demo@nexoforma.local'
)
insert into public.measurement_requests (client_user_id, nutritionist_user_id, requested_at, weight_status, weight_completed_at, measurements_status, measurements_completed_at)
select ca.id, na.id, now() - interval '20 days', 'completed', now() - interval '19 days', 'completed', now() - interval '14 days' from client_auth ca cross join nutritionist_auth na
union all
select ca.id, na.id, now() - interval '2 days', 'pending', null, 'pending', null from client_auth ca cross join nutritionist_auth na;

commit;
