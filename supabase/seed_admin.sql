-- Paso 1: crea el usuario admin en Authentication > Users > Add user.
-- Paso 2: sustituye los valores de email, username y full_name y ejecuta este script.

with admin_user as (
  select id, email
  from auth.users
  where email = 'admin@nexoforma.local'
  limit 1
)
insert into public.profiles (
  id,
  username,
  email,
  full_name,
  role
)
select
  id,
  'admin',
  email,
  'Administrador NexoForma',
  'admin'
from admin_user
on conflict (id) do update
set
  username = excluded.username,
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  updated_at = now();
