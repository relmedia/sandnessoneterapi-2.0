-- Resend / transactional email settings (dashboard-managed, not public).
-- Run once in the Supabase SQL editor.

create table if not exists public.email_settings (
  id text primary key default 'singleton',
  resend_api_key text,
  email_from text,
  booking_admin_email text,
  updated_at timestamptz not null default now()
);

insert into public.email_settings (id)
values ('singleton')
on conflict (id) do nothing;

alter table public.email_settings enable row level security;

drop policy if exists email_settings_auth on public.email_settings;
create policy email_settings_auth on public.email_settings
  for all
  to authenticated
  using (true)
  with check (true);
