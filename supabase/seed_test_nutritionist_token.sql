insert into public.access_tokens (
  token,
  token_type,
  status,
  created_by_user_id,
  expires_at
)
values (
  'NEXO-NUTRI-TEST-001',
  'nutritionist_invite',
  'available',
  (
    select id
    from public.profiles
    where role = 'admin'
    order by created_at asc
    limit 1
  ),
  now() + interval '7 days'
)
on conflict (token) do update
set
  token_type = excluded.token_type,
  status = excluded.status,
  expires_at = excluded.expires_at,
  used_at = null,
  assigned_to_nutritionist = null,
  assigned_to_client = null;
