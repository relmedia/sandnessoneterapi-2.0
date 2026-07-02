-- Booking system tables: availability days managed in the dashboard, and
-- booking requests submitted from the public website.
-- Run this once in the Supabase SQL editor (re-runnable / idempotent).

create table if not exists public.availability_days (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  is_closed boolean not null default false,
  slots text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  service text not null,
  date date not null,
  time text not null,
  message text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  cancel_token uuid not null unique default gen_random_uuid(),
  confirm_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz
);

create index if not exists booking_requests_date_idx on public.booking_requests (date);
create index if not exists booking_requests_status_idx on public.booking_requests (status);

-- RLS: these tables contain personal data and must NOT be publicly readable.
-- The public website talks to them exclusively through server-side API routes
-- that use the service-role key (bypasses RLS). The dashboard uses the
-- authenticated role.
alter table public.availability_days enable row level security;
alter table public.booking_requests enable row level security;

drop policy if exists availability_days_auth_all on public.availability_days;
create policy availability_days_auth_all on public.availability_days
  for all to authenticated using (true) with check (true);

drop policy if exists booking_requests_auth_all on public.booking_requests;
create policy booking_requests_auth_all on public.booking_requests
  for all to authenticated using (true) with check (true);
