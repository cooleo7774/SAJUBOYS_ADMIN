-- SAJUBOYS_ADMIN knowledge studio schema draft
-- This schema is for admin operations and version lifecycle.

create table if not exists public.admin_projects (
  id uuid primary key default gen_random_uuid(),
  project_key text not null unique,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  goal text not null default '',
  tone text not null default '',
  context_text text not null default '',
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
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.admin_projects (id) on delete cascade,
  knowledge_version text not null unique,
  status text not null check (status in ('draft', 'published', 'archived')),
  release_note text,
  snapshot_json jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists admin_projects_status_updated_idx
  on public.admin_projects (status, updated_at desc);

create index if not exists admin_project_examples_project_kind_idx
  on public.admin_project_examples (project_id, kind, updated_at desc);

create index if not exists admin_project_versions_project_status_created_idx
  on public.admin_project_versions (project_id, status, created_at desc);
