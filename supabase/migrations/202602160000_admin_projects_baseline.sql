-- Step 1 baseline: admin project tables
-- Created at: 2026-02-16

create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.admin_projects (
  id uuid primary key default gen_random_uuid(),
  project_key text not null unique,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  language text not null default 'ko',
  goal text not null default '',
  tone text not null default '',
  context_text text not null default '',
  current_knowledge_version text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_project_guardrails (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.admin_projects (id) on delete cascade,
  kind text not null check (kind in ('must', 'avoid')),
  content text not null,
  priority integer not null default 100,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_project_examples (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.admin_projects (id) on delete cascade,
  label text not null,
  kind text not null check (kind in ('good', 'bad')),
  user_prompt text not null,
  expected_output text not null,
  language text not null default 'ko',
  priority integer not null default 100,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.admin_projects (id) on delete cascade,
  version text not null,
  context_text text not null default '',
  metadata_json jsonb not null default '{}'::jsonb,
  release_note text not null default '',
  created_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  unique (project_id, version)
);

create index if not exists admin_projects_status_updated_idx
  on public.admin_projects (status, updated_at desc);

create index if not exists admin_project_guardrails_project_idx
  on public.admin_project_guardrails (project_id, priority);

create index if not exists admin_project_examples_project_idx
  on public.admin_project_examples (project_id, created_at desc);

create index if not exists admin_project_versions_project_created_idx
  on public.admin_project_versions (project_id, created_at desc);

drop trigger if exists trg_admin_projects_updated_at on public.admin_projects;
create trigger trg_admin_projects_updated_at
before update on public.admin_projects
for each row
execute function public.tg_set_updated_at();

drop trigger if exists trg_admin_project_guardrails_updated_at on public.admin_project_guardrails;
create trigger trg_admin_project_guardrails_updated_at
before update on public.admin_project_guardrails
for each row
execute function public.tg_set_updated_at();

drop trigger if exists trg_admin_project_examples_updated_at on public.admin_project_examples;
create trigger trg_admin_project_examples_updated_at
before update on public.admin_project_examples
for each row
execute function public.tg_set_updated_at();
