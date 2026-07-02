-- One-click admin confirm links for booking requests.
-- Run once in the Supabase SQL editor.

alter table public.booking_requests
  add column if not exists confirm_token uuid not null default gen_random_uuid(),
  add column if not exists confirmed_at timestamptz;

create unique index if not exists booking_requests_confirm_token_idx
  on public.booking_requests (confirm_token);

-- Backfill confirm_token for any rows created before this migration.
update public.booking_requests
set confirm_token = gen_random_uuid()
where confirm_token is null;
