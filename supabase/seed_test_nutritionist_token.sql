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
  null,
  now() + interval '7 days'
)
on conflict (token) do update
set
  token_type = excluded.token_type,
  status = excluded.status,
  expires_at = excluded.expires_at;