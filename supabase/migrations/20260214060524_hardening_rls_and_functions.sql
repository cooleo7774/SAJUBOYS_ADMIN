-- Supabase advisor hardening:
-- 1) lock function search_path
-- 2) optimize auth.uid() usage in RLS policies
-- 3) move citext extension out of public schema when possible

create schema if not exists extensions;

do $$
begin
  if exists (
    select 1
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'citext'
      and n.nspname = 'public'
  ) then
    alter extension citext set schema extensions;
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.enforce_order_region_policy()
returns trigger
language plpgsql
set search_path = public, pg_temp
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

create or replace function public.apply_wallet_transaction()
returns trigger
language plpgsql
set search_path = public, pg_temp
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

create or replace function public.prevent_wallet_transaction_mutation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'wallet_transactions_are_immutable';
end;
$$;

create or replace function public.validate_reading_insert()
returns trigger
language plpgsql
set search_path = public, pg_temp
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

create or replace function public.validate_share_card_insert()
returns trigger
language plpgsql
set search_path = public, pg_temp
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

create or replace function public.prevent_user_email_change()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_setting('app.bypass_user_email_guard', true) = '1' then
    return new;
  end if;

  if new.email is distinct from old.email then
    raise exception 'email_must_be_updated_via_auth_provider';
  end if;
  return new;
end;
$$;

drop policy if exists users_select_own on public.users;
create policy users_select_own
  on public.users
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists users_update_own on public.users;
create policy users_update_own
  on public.users
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own
  on public.profiles
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists wallets_select_own on public.wallets;
create policy wallets_select_own
  on public.wallets
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists wallet_transactions_select_own on public.wallet_transactions;
create policy wallet_transactions_select_own
  on public.wallet_transactions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists orders_select_own on public.orders;
create policy orders_select_own
  on public.orders
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists readings_select_own on public.readings;
create policy readings_select_own
  on public.readings
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists share_cards_select_own on public.share_cards;
create policy share_cards_select_own
  on public.share_cards
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists share_cards_delete_own on public.share_cards;
create policy share_cards_delete_own
  on public.share_cards
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists audit_events_select_own on public.audit_events;
create policy audit_events_select_own
  on public.audit_events
  for select
  to authenticated
  using ((select auth.uid()) = user_id);;
