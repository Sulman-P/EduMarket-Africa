-- School resource marketplace: schema, privacy boundary, and RLS.
create extension if not exists "pgcrypto";

do $$ begin create type public.user_role as enum ('buyer', 'seller'); exception when duplicate_object then null; end $$;
do $$ begin create type public.curriculum as enum ('CBC', '8-4-4', 'IGCSE', 'Global'); exception when duplicate_object then null; end $$;
do $$ begin create type public.resource_kind as enum ('Exam', 'Lesson Plan', 'Notes'); exception when duplicate_object then null; end $$;
do $$ begin create type public.transaction_status as enum ('pending', 'completed', 'failed'); exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'buyer',
  country text,
  balance numeric(14,2) not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Existing Supabase projects often already have profiles. Preserve existing data and add only the fields this marketplace needs.
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists balance numeric(14,2) not null default 0;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- Do not rewrite an existing role column: it can be an application enum with policies/checks
-- that PostgreSQL cannot automatically migrate. Seller checks below use role::text and work
-- with either this project's enum or a pre-existing text/enum column.
alter table public.profiles add column if not exists role public.user_role not null default 'buyer';

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(title) between 3 and 180),
  description text not null check (char_length(description) between 20 and 10000),
  curriculum public.curriculum not null,
  grade_level text not null,
  subject text not null,
  resource_type public.resource_kind not null,
  price_kes numeric(12,2) check (price_kes is null or price_kes >= 0),
  price_usd numeric(12,2) check (price_usd is null or price_usd >= 0),
  -- Store a private Supabase Storage object key, never a public bucket URL.
  file_url text not null,
  preview_urls text[] not null default '{}',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resources_has_price check (price_kes is not null or price_usd is not null)
);

-- Adopt an existing resources table without deleting or rewriting its data.
alter table public.resources add column if not exists seller_id uuid references public.profiles(id) on delete restrict;
alter table public.resources add column if not exists title text;
alter table public.resources add column if not exists description text;
alter table public.resources add column if not exists curriculum public.curriculum;
alter table public.resources add column if not exists grade_level text;
alter table public.resources add column if not exists subject text;
alter table public.resources add column if not exists resource_type public.resource_kind;
alter table public.resources add column if not exists price_kes numeric(12,2);
alter table public.resources add column if not exists price_usd numeric(12,2);
alter table public.resources add column if not exists file_url text;
alter table public.resources add column if not exists preview_urls text[] not null default '{}';
alter table public.resources add column if not exists is_published boolean not null default false;
alter table public.resources add column if not exists created_at timestamptz not null default now();
alter table public.resources add column if not exists updated_at timestamptz not null default now();

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  resource_id uuid not null references public.resources(id) on delete restrict,
  megapay_reference text unique,
  amount numeric(12,2) not null check (amount >= 0),
  currency char(3) not null check (currency in ('KES', 'USD')),
  status public.transaction_status not null default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint completed_transaction_has_completed_at check (
    (status = 'completed' and completed_at is not null) or status <> 'completed'
  )
);

-- Adopt an existing transactions table without changing its existing column types.
alter table public.transactions add column if not exists buyer_id uuid references public.profiles(id) on delete restrict;
alter table public.transactions add column if not exists resource_id uuid references public.resources(id) on delete restrict;
alter table public.transactions add column if not exists megapay_reference text;
alter table public.transactions add column if not exists amount numeric(12,2);
alter table public.transactions add column if not exists currency char(3);
alter table public.transactions add column if not exists status public.transaction_status not null default 'pending';
alter table public.transactions add column if not exists created_at timestamptz not null default now();
alter table public.transactions add column if not exists completed_at timestamptz;

create index if not exists resources_catalogue_idx on public.resources (curriculum, grade_level, subject, created_at desc)
  where is_published;
create index if not exists resources_seller_idx on public.resources (seller_id, created_at desc);
create index if not exists transactions_buyer_status_idx on public.transactions (buyer_id, status, resource_id);
create unique index if not exists one_pending_checkout_per_resource on public.transactions (buyer_id, resource_id)
  where status = 'pending';

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists marketplace_profiles_updated_at on public.profiles;
create trigger marketplace_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists marketplace_resources_updated_at on public.resources;
create trigger marketplace_resources_updated_at before update on public.resources
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, country)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'country')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists marketplace_on_auth_user_created on auth.users;
create trigger marketplace_on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.resources enable row level security;
alter table public.transactions enable row level security;

-- Profiles: role and balance are controlled by trusted server/admin workflows.
create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "update own non-sensitive profile fields" on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid())
             and balance = (select balance from public.profiles where id = auth.uid()));

-- Base resources never serve as the unauthenticated catalogue. The public view below is used instead.
create policy "seller reads own resources" on public.resources for select to authenticated using (seller_id = auth.uid());
create policy "buyer reads purchased resource" on public.resources for select to authenticated using (
  exists (
    select 1 from public.transactions t
    where t.resource_id = resources.id and t.buyer_id = auth.uid() and t.status = 'completed'
  )
);
create policy "seller inserts own resources" on public.resources for insert to authenticated with check (
  seller_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text = 'seller')
);
create policy "seller updates own resources" on public.resources for update to authenticated
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text = 'seller'));
create policy "seller deletes own resources" on public.resources for delete to authenticated using (seller_id = auth.uid());

create policy "buyer reads own transactions" on public.transactions for select to authenticated using (buyer_id = auth.uid());
-- No client insert/update policy: checkout and webhooks use the service-role Edge Function.

-- A deliberately file-free public catalogue. security_invoker=false lets the view expose only these safe columns.
create or replace view public.resource_catalogue with (security_invoker = false) as
select id, seller_id, title, description, curriculum, grade_level, subject, resource_type,
       price_kes, price_usd, preview_urls, created_at
from public.resources
where is_published;

revoke all on public.resources, public.transactions, public.profiles from anon;
grant select on public.resource_catalogue to anon, authenticated;
grant select, insert, update, delete on public.resources to authenticated;
grant select on public.transactions, public.profiles to authenticated;
grant update (full_name, country) on public.profiles to authenticated;

-- Call from a server/Edge Function only after proving the requester owns a completed purchase.
create or replace function public.can_download_resource(p_resource_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.transactions t
    where t.resource_id = p_resource_id and t.buyer_id = auth.uid() and t.status = 'completed'
  );
$$;
revoke all on function public.can_download_resource(uuid) from public;
grant execute on function public.can_download_resource(uuid) to authenticated;
