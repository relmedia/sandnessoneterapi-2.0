-- Row Level Security for the website content tables.
-- Run this once in the Supabase SQL editor (re-runnable / idempotent).
--
-- Goal:
--   * Anyone (anon key, used by the public website) can READ content.
--   * Only logged-in dashboard users (authenticated) can WRITE content.

do $$
declare
  t text;
begin
  foreach t in array array['settings', 'services', 'courses', 'pages', 'books', 'articles']
  loop
    execute format('alter table public.%I enable row level security;', t);

    execute format('drop policy if exists %I on public.%I;', t || '_public_read', t);
    execute format(
      'create policy %I on public.%I for select using (true);',
      t || '_public_read', t
    );

    execute format('drop policy if exists %I on public.%I;', t || '_auth_write', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true);',
      t || '_auth_write', t
    );
  end loop;
end $$;
