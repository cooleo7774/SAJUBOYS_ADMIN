-- Step 5: Deployment snapshot timeline
-- Created at: 2026-02-16

create table if not exists public.admin_deployments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.admin_projects (id) on delete cascade,
  version text not null,
  release_note text not null default '',
  snapshot_json jsonb not null default '{}'::jsonb,
  deployed_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  unique (project_id, version)
);

create index if not exists admin_deployments_project_created_idx
  on public.admin_deployments (project_id, created_at desc);
