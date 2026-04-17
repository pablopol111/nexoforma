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
  now() + interval '30 days'
)
on conflict (token) do nothing;
