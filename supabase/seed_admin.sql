insert into public.profiles (
  id,
  username,
  email,
  full_name,
  role,
  status
)
select
  au.id,
  'admin',
  au.email,
  'Administrador NexoForma',
  'admin',
  'active'
from auth.users au
where au.email = 'admin@nexoforma.local'
on conflict (id) do update
set username = excluded.username,
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    status = excluded.status;
