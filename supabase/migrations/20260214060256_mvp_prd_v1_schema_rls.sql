-- SAJU-Boys MVP v1 schema + RLS draft
-- Source: docs/SAJU_BOYS_MVP_PRD_V1.md

create extension if not exists pgcrypto;
create extension if not exists citext;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_type') then
    create type public.profile_type as enum ('self', 'idol');
  end if;

  if not exists (select 1 from pg_type where typname = 'wallet_txn_type') then
    create type public.wallet_txn_type as enum ('credit', 'debit', 'refund');
  end if;

  if not exists (select 1 from pg_type where typname = 'order_provider') then
    create type public.order_provider as enum ('paypal');
  end if;

  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum (
      'created',
      'approved',
      'captured',
      'failed',
      'refunded',
      'blocked_region'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'reading_category') then
    create type public.reading_category as enum ('saju', 'match', 'fortune');
  end if;

  if not exists (select 1 from pg_type where typname = 'reading_mode') then
    create type public.reading_mode as enum ('soft', 'nofilter');
  end if;

  if not exists (select 1 from pg_type where typname = 'confidence_level') then
    create type public.confidence_level as enum ('high', 'medium', 'low');
  end if;

  if not exists (select 1 from pg_type where typname = 'share_card_size') then
    create type public.share_card_size as enum ('feed_1080x1350', 'story_1080x1920');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email citext not null unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type public.profile_type not null,
  name text not null check (char_length(name) between 1 and 80),
  group_name text,
  birth_date date,
  birth_time_known boolean not null default false,
  birth_time time,
  birth_place text,
  gender_identity text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_birth_time_known_check check (
    (birth_time_known and birth_time is not null)
    or ((not birth_time_known) and birth_time is null)
  )
);

create table if not exists public.wallets (
  user_id uuid primary key references public.users (id) on delete cascade,
  balance_bp integer not null default 0 check (balance_bp >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type public.wallet_txn_type not null,
  amount_bp integer not null check (amount_bp > 0),
  reason text not null check (char_length(reason) between 2 and 100),
  reference_type text,
  reference_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider public.order_provider not null default 'paypal',
  external_order_id text not null unique,
  amount_usd numeric(10, 2) not null check (amount_usd > 0),
  bp_amount integer not null check (bp_amount >= 0),
  bonus_bp integer not null default 0 check (bonus_bp >= 0),
  status public.order_status not null default 'created',
  country_code text,
  region_blocked boolean not null default false,
  block_reason text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint orders_country_code_uppercase_check check (
    country_code is null
    or (
      char_length(country_code) = 2
      and country_code = upper(country_code)
    )
  ),
  constraint orders_kr_capture_block_check check (
    country_code is distinct from 'KR' or status not in ('approved', 'captured')
  )
);

create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  category public.reading_category not null,
  mode public.reading_mode not null default 'soft',
  input_profile_ids uuid[] not null,
  confidence public.confidence_level not null,
  estimated_mode boolean not null default false,
  canonical_input_hash text,
  result_json jsonb not null default '{}'::jsonb,
  parent_reading_id uuid references public.readings (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint readings_profile_count_check check (
    (category = 'saju' and coalesce(array_length(input_profile_ids, 1), 0) = 1)
    or (category = 'match' and coalesce(array_length(input_profile_ids, 1), 0) = 2)
    or (category = 'fortune' and coalesce(array_length(input_profile_ids, 1), 0) = 1)
  ),
  constraint readings_nofilter_parent_check check (
    (mode = 'soft' and parent_reading_id is null)
    or (mode = 'nofilter' and parent_reading_id is not null)
  )
);

create table if not exists public.share_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  reading_id uuid not null references public.readings (id) on delete cascade,
  size public.share_card_size not null,
  file_path text not null,
  file_format text not null default 'webp',
  file_size_bytes integer not null check (file_size_bytes between 1 and 409600),
  summary_lines text[] not null default '{}'::text[],
  vibe_tags text[] not null default '{}'::text[],
  created_at timestamptz not null default timezone('utc', now()),
  constraint share_cards_file_format_check check (lower(file_format) = 'webp'),
  constraint share_cards_summary_lines_count_check check (
    coalesce(array_length(summary_lines, 1), 0) between 0 and 3
  ),
  constraint share_cards_vibe_tags_count_check check (
    coalesce(array_length(vibe_tags, 1), 0) between 0 and 3
  ),
  unique (reading_id, size)
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  event_name text not null check (char_length(event_name) between 2 and 100),
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists profiles_user_type_created_idx
  on public.profiles (user_id, type, created_at desc);

create index if not exists wallet_transactions_user_created_idx
  on public.wallet_transactions (user_id, created_at desc);

create index if not exists wallet_transactions_reference_idx
  on public.wallet_transactions (reference_type, reference_id);

create unique index if not exists wallet_transactions_reference_unique_idx
  on public.wallet_transactions (reference_type, reference_id, type)
  where reference_type is not null and reference_id is not null;

create index if not exists orders_user_created_idx
  on public.orders (user_id, created_at desc);

create index if not exists orders_status_created_idx
  on public.orders (status, created_at desc);

create index if not exists readings_user_category_created_idx
  on public.readings (user_id, category, created_at desc);

create index if not exists readings_category_mode_hash_idx
  on public.readings (category, mode, canonical_input_hash)
  where canonical_input_hash is not null;

create unique index if not exists readings_nofilter_parent_unique_idx
  on public.readings (parent_reading_id)
  where parent_reading_id is not null;

create index if not exists share_cards_user_created_idx
  on public.share_cards (user_id, created_at desc);

create index if not exists audit_events_user_created_idx
  on public.audit_events (user_id, created_at desc);

create index if not exists audit_events_name_created_idx
  on public.audit_events (event_name, created_at desc);

create or replace function public.sync_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.bypass_user_email_guard', '1', true);

  insert into public.users (id, email, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', null),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', null)
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        updated_at = timezone('utc', now());

  insert into public.wallets (user_id, balance_bp)
  values (new.id, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_auth_user_sync on auth.users;
create trigger trg_auth_user_sync
after insert or update of email, raw_user_meta_data
on auth.users
for each row execute function public.sync_auth_user();

create or replace function public.enforce_order_region_policy()
returns trigger
language plpgsql
as $$
begin
  if new.country_code is not null then
    new.country_code := upper(trim(new.country_code));
  end if;

  if new.country_code = 'KR' then
    new.region_blocked := true;
    new.status := 'blocked_region';
    if new.block_reason is null then
      new.block_reason := 'purchases_not_available_in_region';
    end if;
  else
    new.region_blocked := false;
    if new.block_reason = 'purchases_not_available_in_region' then
      new.block_reason := null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_orders_region_policy on public.orders;
create trigger trg_orders_region_policy
before insert or update on public.orders
for each row execute function public.enforce_order_region_policy();

create or replace function public.apply_wallet_transaction()
returns trigger
language plpgsql
as $$
begin
  insert into public.wallets (user_id, balance_bp)
  values (new.user_id, 0)
  on conflict (user_id) do nothing;

  if new.type in ('credit', 'refund') then
    update public.wallets
      set balance_bp = balance_bp + new.amount_bp
    where user_id = new.user_id;
  elsif new.type = 'debit' then
    update public.wallets
      set balance_bp = balance_bp - new.amount_bp
    where user_id = new.user_id
      and balance_bp >= new.amount_bp;

    if not found then
      raise exception 'insufficient_bias_points';
    end if;
  else
    raise exception 'unsupported_wallet_txn_type';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_wallet_transactions_apply on public.wallet_transactions;
create trigger trg_wallet_transactions_apply
before insert on public.wallet_transactions
for each row execute function public.apply_wallet_transaction();

create or replace function public.prevent_wallet_transaction_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'wallet_transactions_are_immutable';
end;
$$;

drop trigger if exists trg_wallet_transactions_immutable on public.wallet_transactions;
create trigger trg_wallet_transactions_immutable
before update or delete on public.wallet_transactions
for each row execute function public.prevent_wallet_transaction_mutation();

create or replace function public.validate_reading_insert()
returns trigger
language plpgsql
as $$
declare
  profile_id uuid;
  profile_type_value public.profile_type;
  self_profile_count integer := 0;
  idol_profile_count integer := 0;
  parent_user_id uuid;
  parent_mode public.reading_mode;
  parent_category public.reading_category;
begin
  foreach profile_id in array new.input_profile_ids loop
    select p.type
      into profile_type_value
    from public.profiles p
    where p.id = profile_id
      and p.user_id = new.user_id;

    if profile_type_value is null then
      raise exception 'input_profile_ids includes profile not owned by user';
    end if;

    if profile_type_value = 'self' then
      self_profile_count := self_profile_count + 1;
    elsif profile_type_value = 'idol' then
      idol_profile_count := idol_profile_count + 1;
    end if;
  end loop;

  if new.category in ('saju', 'fortune') then
    if self_profile_count <> 1 or idol_profile_count <> 0 then
      raise exception 'saju_and_fortune_require_exactly_one_self_profile';
    end if;
  elsif new.category = 'match' then
    if new.input_profile_ids[1] = new.input_profile_ids[2] then
      raise exception 'match_requires_distinct_self_and_idol_profiles';
    end if;
    if self_profile_count <> 1 or idol_profile_count <> 1 then
      raise exception 'match_requires_one_self_and_one_idol_profile';
    end if;
  end if;

  if new.mode = 'nofilter' then
    select r.user_id, r.mode, r.category
      into parent_user_id, parent_mode, parent_category
    from public.readings r
    where r.id = new.parent_reading_id;

    if parent_user_id is null then
      raise exception 'parent_reading_id not found';
    end if;
    if parent_user_id <> new.user_id then
      raise exception 'nofilter parent reading must belong to same user';
    end if;
    if parent_mode <> 'soft' then
      raise exception 'nofilter parent reading must be soft mode';
    end if;
    if parent_category <> new.category then
      raise exception 'nofilter parent reading category mismatch';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_readings_validate on public.readings;
create trigger trg_readings_validate
before insert or update on public.readings
for each row execute function public.validate_reading_insert();

create or replace function public.validate_share_card_insert()
returns trigger
language plpgsql
as $$
declare
  reading_owner uuid;
begin
  select user_id into reading_owner
  from public.readings
  where id = new.reading_id;

  if reading_owner is null then
    raise exception 'reading_id not found';
  end if;

  if reading_owner <> new.user_id then
    raise exception 'share card user_id must match reading owner';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_share_cards_validate on public.share_cards;
create trigger trg_share_cards_validate
before insert or update on public.share_cards
for each row execute function public.validate_share_card_insert();

drop trigger if exists trg_users_set_updated_at on public.users;
create trigger trg_users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create or replace function public.prevent_user_email_change()
returns trigger
language plpgsql
as $$
begin
  if current_setting('app.bypass_user_email_guard', true) = '1' then
    return new;
  end if;

  if new.email is distinct from old.email then
    raise exception 'email_must_be_UPDATED_via_auth_provider';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_users_prevent_email_change on public.users;
create trigger trg_users_prevent_email_change
before update on public.users
for each row execute function public.prevent_user_email_change();

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_wallets_set_updated_at on public.wallets;
create trigger trg_wallets_set_updated_at
before update on public.wallets
for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_set_updated_at on public.orders;
create trigger trg_orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.orders enable row level security;
alter table public.readings enable row level security;
alter table public.share_cards enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists users_select_own on public.users;
create policy users_select_own
  on public.users
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists users_update_own on public.users;
create policy users_update_own
  on public.users
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own
  on public.profiles
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists wallets_select_own on public.wallets;
create policy wallets_select_own
  on public.wallets
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists wallet_transactions_select_own on public.wallet_transactions;
create policy wallet_transactions_select_own
  on public.wallet_transactions
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists orders_select_own on public.orders;
create policy orders_select_own
  on public.orders
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists orders_insert_own on public.orders;
-- No authenticated write policy for orders.
-- Inserts/updates are expected through server-side code (service role) only.

drop policy if exists readings_select_own on public.readings;
create policy readings_select_own
  on public.readings
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists readings_insert_own on public.readings;
-- No authenticated write policy for readings.
-- Reading generation and upgrades should be server-authoritative.

drop policy if exists share_cards_select_own on public.share_cards;
create policy share_cards_select_own
  on public.share_cards
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists share_cards_insert_own on public.share_cards;
-- No authenticated write policy for share_cards.
-- Share card creation is expected through server-side pipeline.

drop policy if exists share_cards_delete_own on public.share_cards;
create policy share_cards_delete_own
  on public.share_cards
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists audit_events_select_own on public.audit_events;
create policy audit_events_select_own
  on public.audit_events
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists audit_events_insert_own on public.audit_events;
-- No authenticated write policy for audit_events.
-- Event writes are expected through trusted backend pathways.
;
