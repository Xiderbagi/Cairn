-- Cairn initial schema: one business per user, with row-level security on everything.
-- Safe to run more than once.

create table if not exists public.business_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  province text not null default 'ON'
    check (province in ('AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT')),
  tax_year int not null default 2026 check (tax_year between 2020 and 2035),
  gst_registered boolean not null default true,
  gst_method text not null default 'regular' check (gst_method in ('regular', 'quick')),
  supply_type text not null default 'services' check (supply_type in ('services', 'goods')),
  tax_mode text not null default 'brackets' check (tax_mode in ('brackets', 'flat')),
  flat_rate numeric(5,2) not null default 20 check (flat_rate between 0 and 60),
  other_income numeric(12,2) not null default 0 check (other_income >= 0),
  home jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  date date not null,
  description text not null check (char_length(description) between 1 and 200),
  amount numeric(12,2) not null check (amount >= 0),
  sales_tax numeric(12,2) not null default 0 check (sales_tax >= 0),
  category text, -- T2125 expense line, null for income
  business_use_pct int not null default 100 check (business_use_pct between 0 and 100),
  receipt_path text, -- object path in the receipts bucket
  created_at timestamptz not null default now(),
  check ((type = 'income' and category is null) or (type = 'expense' and category is not null))
);
create index if not exists transactions_user_date on public.transactions (user_id, date desc);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  description text not null check (char_length(description) between 1 and 200),
  cca_class text not null check (cca_class in ('50', '8', '10', '10.1', '12', '46')),
  cost numeric(12,2) not null check (cost >= 0),
  year_acquired int not null check (year_acquired between 1990 and 2035),
  business_use_pct int not null default 100 check (business_use_pct between 0 and 100),
  created_at timestamptz not null default now()
);
create index if not exists assets_user on public.assets (user_id);

alter table public.business_settings enable row level security;
alter table public.transactions enable row level security;
alter table public.assets enable row level security;

drop policy if exists "own settings" on public.business_settings;
create policy "own settings" on public.business_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own transactions" on public.transactions;
create policy "own transactions" on public.transactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own assets" on public.assets;
create policy "own assets" on public.assets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
