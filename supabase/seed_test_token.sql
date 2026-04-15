insert into public.access_tokens (code, role, active)
values ('NEXO-NUTRI-2026', 'nutritionist', true)
on conflict (code) do nothing;
