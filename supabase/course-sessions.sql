-- Multiple course dates ("sessions") per course, managed in the dashboard.
-- Each entry is { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" | null }.
-- start_date/end_date on courses keep mirroring the first session.
-- Run this once in the Supabase SQL editor (re-runnable / idempotent).

alter table public.courses
  add column if not exists sessions jsonb not null default '[]'::jsonb;

-- Which course date the visitor signed up for.
alter table if exists public.course_registrations
  add column if not exists session_label text;
