-- Scale primitives for high traffic:
-- - API idempotency keys
-- - Async reading job queue
-- - Event outbox

do $$
begin
  if not exists (select 1 from pg_type where typname = 'job_status') then
    create type public.job_status as enum (
      'pending',
      'running',
      'succeeded',
      'failed',
      'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'outbox_status') then
    create type public.outbox_status as enum (
      'pending',
      'processing',
      'sent',
      'failed',
      'dead_letter'
    );
  end if;
end
$$;

create table if not exists public.api_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  scope text not null check (char_length(scope) between 2 and 100),
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 200),
  request_hash text not null check (char_length(request_hash) between 16 and 128),
  status public.job_status not null default 'pending',
  response_code integer check (response_code between 100 and 599),
  response_json jsonb,
  last_error text,
  expires_at timestamptz not null default (timezone('utc', now()) + interval '24 hours'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint api_idempotency_final_state_check check (
    (status in ('succeeded', 'failed') and response_code is not null)
    or (status in ('pending', 'running', 'cancelled') and response_code is null)
  )
);

create table if not exists public.reading_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  category public.reading_category not null,
  mode public.reading_mode not null default 'soft',
  status public.job_status not null default 'pending',
  priority smallint not null default 100 check (priority between 1 and 1000),
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 5 check (max_attempts between 1 and 20),
  reading_id uuid references public.readings (id) on delete set null,
  payload_json jsonb not null default '{}'::jsonb,
  result_json jsonb,
  error_code text,
  error_message text,
  scheduled_at timestamptz not null default timezone('utc', now()),
  available_at timestamptz not null default timezone('utc', now()),
  lease_until timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  worker_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint reading_jobs_lifecycle_check check (
    (status = 'pending' and started_at is null and finished_at is null)
    or (status = 'running' and started_at is not null and finished_at is null)
    or (status in ('succeeded', 'failed', 'cancelled') and finished_at is not null)
  )
);

create table if not exists public.event_outbox (
  id bigint generated always as identity primary key,
  aggregate_type text not null check (char_length(aggregate_type) between 2 and 60),
  aggregate_id uuid,
  event_name text not null check (char_length(event_name) between 2 and 100),
  status public.outbox_status not null default 'pending',
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 25 check (max_attempts between 1 and 100),
  next_retry_at timestamptz not null default timezone('utc', now()),
  payload_json jsonb not null default '{}'::jsonb,
  last_error text,
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists api_idempotency_scope_key_user_unique_idx
  on public.api_idempotency_keys (
    scope,
    idempotency_key,
    coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create index if not exists api_idempotency_expires_idx
  on public.api_idempotency_keys (expires_at);

create index if not exists reading_jobs_poll_idx
  on public.reading_jobs (status, available_at, priority, created_at)
  where status in ('pending', 'failed');

create unique index if not exists reading_jobs_reading_unique_idx
  on public.reading_jobs (reading_id)
  where reading_id is not null;

create index if not exists reading_jobs_user_created_idx
  on public.reading_jobs (user_id, created_at desc);

create index if not exists event_outbox_dispatch_idx
  on public.event_outbox (status, next_retry_at, id)
  where status in ('pending', 'failed');

drop trigger if exists trg_api_idempotency_set_updated_at on public.api_idempotency_keys;
create trigger trg_api_idempotency_set_updated_at
before update on public.api_idempotency_keys
for each row execute function public.set_updated_at();

drop trigger if exists trg_reading_jobs_set_updated_at on public.reading_jobs;
create trigger trg_reading_jobs_set_updated_at
before update on public.reading_jobs
for each row execute function public.set_updated_at();

drop trigger if exists trg_event_outbox_set_updated_at on public.event_outbox;
create trigger trg_event_outbox_set_updated_at
before update on public.event_outbox
for each row execute function public.set_updated_at();

alter table public.api_idempotency_keys enable row level security;
alter table public.reading_jobs enable row level security;
alter table public.event_outbox enable row level security;

drop policy if exists api_idempotency_select_own on public.api_idempotency_keys;
create policy api_idempotency_select_own
  on public.api_idempotency_keys
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists reading_jobs_select_own on public.reading_jobs;
create policy reading_jobs_select_own
  on public.reading_jobs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
;
