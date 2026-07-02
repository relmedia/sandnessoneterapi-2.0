-- Privacy-friendly, first-party web analytics stored in Supabase.
-- Pageviews are inserted by the public website through a server-side API route
-- using the service-role key. No cookies and no PII: visitors are identified by
-- a salted hash of IP + user agent that rotates daily.
-- Run this once in the Supabase SQL editor (re-runnable / idempotent).

create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  path text not null,
  referrer text, -- external referrer hostname, null = direct / internal
  visitor_hash text not null, -- salted daily-rotating anonymous visitor id
  session_id uuid not null, -- per browser-session id (sessionStorage)
  country text, -- ISO 3166-1 alpha-2 code from the hosting platform's geo headers
  city text,
  created_at timestamptz not null default now()
);

alter table public.page_views add column if not exists country text;
alter table public.page_views add column if not exists city text;

create index if not exists page_views_created_at_idx on public.page_views (created_at);
create index if not exists page_views_path_idx on public.page_views (path);

-- RLS: no public access. Inserts happen through the service role (bypasses
-- RLS); the dashboard reads through the authenticated role.
alter table public.page_views enable row level security;

drop policy if exists page_views_auth_select on public.page_views;
create policy page_views_auth_select on public.page_views
  for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Aggregate helpers used by the dashboard (RPC).
-- ---------------------------------------------------------------------------

create or replace function public.analytics_summary(from_ts timestamptz, to_ts timestamptz)
returns table (pageviews bigint, visitors bigint, sessions bigint, engaged_sessions bigint)
language sql
stable
as $$
  with in_range as (
    select visitor_hash, session_id
    from public.page_views
    where created_at >= from_ts and created_at < to_ts
  ),
  session_counts as (
    select session_id, count(*) as views
    from in_range
    group by session_id
  )
  select
    (select count(*) from in_range) as pageviews,
    (select count(distinct visitor_hash) from in_range) as visitors,
    (select count(*) from session_counts) as sessions,
    (select count(*) from session_counts where views > 1) as engaged_sessions;
$$;

create or replace function public.analytics_daily(from_ts timestamptz, to_ts timestamptz)
returns table (day date, pageviews bigint, visitors bigint)
language sql
stable
as $$
  select
    (created_at at time zone 'Europe/Oslo')::date as day,
    count(*) as pageviews,
    count(distinct visitor_hash) as visitors
  from public.page_views
  where created_at >= from_ts and created_at < to_ts
  group by 1
  order by 1;
$$;

create or replace function public.analytics_top_pages(from_ts timestamptz, to_ts timestamptz, max_rows int default 5)
returns table (path text, views bigint, visitors bigint)
language sql
stable
as $$
  select path, count(*) as views, count(distinct visitor_hash) as visitors
  from public.page_views
  where created_at >= from_ts and created_at < to_ts
  group by path
  order by views desc
  limit max_rows;
$$;

create or replace function public.analytics_referrers(from_ts timestamptz, to_ts timestamptz)
returns table (referrer text, visitors bigint, views bigint)
language sql
stable
as $$
  select referrer, count(distinct visitor_hash) as visitors, count(*) as views
  from public.page_views
  where created_at >= from_ts and created_at < to_ts
  group by referrer
  order by visitors desc
  limit 50;
$$;

create or replace function public.analytics_countries(from_ts timestamptz, to_ts timestamptz, max_rows int default 6)
returns table (country text, visitors bigint, views bigint)
language sql
stable
as $$
  select country, count(distinct visitor_hash) as visitors, count(*) as views
  from public.page_views
  where created_at >= from_ts and created_at < to_ts and country is not null
  group by country
  order by visitors desc
  limit max_rows;
$$;

create or replace function public.analytics_cities(from_ts timestamptz, to_ts timestamptz, max_rows int default 6)
returns table (city text, country text, visitors bigint, views bigint)
language sql
stable
as $$
  select city, country, count(distinct visitor_hash) as visitors, count(*) as views
  from public.page_views
  where created_at >= from_ts and created_at < to_ts and city is not null
  group by city, country
  order by visitors desc
  limit max_rows;
$$;

create or replace function public.analytics_realtime(window_minutes int default 30)
returns table (minute timestamptz, visitors bigint)
language sql
stable
as $$
  select date_trunc('minute', created_at) as minute, count(distinct visitor_hash) as visitors
  from public.page_views
  where created_at >= now() - make_interval(mins => window_minutes)
  group by 1
  order by 1;
$$;

-- Only the dashboard (authenticated) and server-side jobs may call these.
revoke all on function public.analytics_summary(timestamptz, timestamptz) from public, anon;
revoke all on function public.analytics_daily(timestamptz, timestamptz) from public, anon;
revoke all on function public.analytics_top_pages(timestamptz, timestamptz, int) from public, anon;
revoke all on function public.analytics_referrers(timestamptz, timestamptz) from public, anon;
revoke all on function public.analytics_countries(timestamptz, timestamptz, int) from public, anon;
revoke all on function public.analytics_cities(timestamptz, timestamptz, int) from public, anon;
revoke all on function public.analytics_realtime(int) from public, anon;

grant execute on function public.analytics_summary(timestamptz, timestamptz) to authenticated, service_role;
grant execute on function public.analytics_daily(timestamptz, timestamptz) to authenticated, service_role;
grant execute on function public.analytics_top_pages(timestamptz, timestamptz, int) to authenticated, service_role;
grant execute on function public.analytics_referrers(timestamptz, timestamptz) to authenticated, service_role;
grant execute on function public.analytics_countries(timestamptz, timestamptz, int) to authenticated, service_role;
grant execute on function public.analytics_cities(timestamptz, timestamptz, int) to authenticated, service_role;
grant execute on function public.analytics_realtime(int) to authenticated, service_role;
