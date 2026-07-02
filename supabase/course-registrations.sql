-- Course registrations: signup requests submitted from the public website
-- ("Meld deg på" on course pages). No online payment – Terje confirms and
-- handles payment manually.
-- Run this once in the Supabase SQL editor (re-runnable / idempotent).

create table if not exists public.course_registrations (
  id uuid primary key default gen_random_uuid(),
  course_id uuid,
  course_title text not null,
  course_slug text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  session_label text,
  message text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);

create index if not exists course_registrations_course_idx on public.course_registrations (course_slug);
create index if not exists course_registrations_status_idx on public.course_registrations (status);

-- RLS: contains personal data and must NOT be publicly readable. The public
-- website inserts exclusively through a server-side API route that uses the
-- service-role key (bypasses RLS). The dashboard uses the authenticated role.
alter table public.course_registrations enable row level security;

drop policy if exists course_registrations_auth_all on public.course_registrations;
create policy course_registrations_auth_all on public.course_registrations
  for all to authenticated using (true) with check (true);
