-- Book orders with manual Vipps payment (Vippsnummer).
-- Run once in the Supabase SQL editor (re-runnable / idempotent).

alter table public.books
  add column if not exists order_online boolean not null default false;

-- Enable online ordering for books that already have a price set.
update public.books
set order_online = true
where price is not null and price > 0;

create table if not exists public.book_orders (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references public.books (id) on delete set null,
  book_slug text not null,
  book_title text not null,
  book_price integer not null,
  shipping_fee integer not null default 69,
  name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  address_line1 text not null,
  postal_code text not null,
  city text not null,
  message text,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'cancelled')),
  amount_paid numeric,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  cancelled_at timestamptz
);

create index if not exists book_orders_status_idx on public.book_orders (status);
create index if not exists book_orders_book_slug_idx on public.book_orders (book_slug);

alter table public.book_orders enable row level security;

drop policy if exists book_orders_auth_all on public.book_orders;
create policy book_orders_auth_all on public.book_orders
  for all to authenticated using (true) with check (true);
