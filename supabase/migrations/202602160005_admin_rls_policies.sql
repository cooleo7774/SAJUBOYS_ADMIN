-- Step 2~5: RLS policies for admin tables
-- Created at: 2026-02-16

create or replace function public.sb_is_admin_user()
returns boolean
language sql
stable
as $$
  select (
    auth.role() = 'service_role'
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
  );
$$;

alter table if exists public.admin_projects enable row level security;
alter table if exists public.admin_project_guardrails enable row level security;
alter table if exists public.admin_project_examples enable row level security;
alter table if exists public.admin_project_versions enable row level security;
alter table if exists public.admin_knowledge_blocks enable row level security;
alter table if exists public.admin_project_knowledge enable row level security;
alter table if exists public.admin_generation_history enable row level security;
alter table if exists public.admin_deployments enable row level security;

drop policy if exists admin_projects_all on public.admin_projects;
create policy admin_projects_all on public.admin_projects
  for all to authenticated
  using (public.sb_is_admin_user())
  with check (public.sb_is_admin_user());

drop policy if exists admin_project_guardrails_all on public.admin_project_guardrails;
create policy admin_project_guardrails_all on public.admin_project_guardrails
  for all to authenticated
  using (public.sb_is_admin_user())
  with check (public.sb_is_admin_user());

drop policy if exists admin_project_examples_all on public.admin_project_examples;
create policy admin_project_examples_all on public.admin_project_examples
  for all to authenticated
  using (public.sb_is_admin_user())
  with check (public.sb_is_admin_user());

drop policy if exists admin_project_versions_all on public.admin_project_versions;
create policy admin_project_versions_all on public.admin_project_versions
  for all to authenticated
  using (public.sb_is_admin_user())
  with check (public.sb_is_admin_user());

drop policy if exists admin_knowledge_blocks_all on public.admin_knowledge_blocks;
create policy admin_knowledge_blocks_all on public.admin_knowledge_blocks
  for all to authenticated
  using (public.sb_is_admin_user())
  with check (public.sb_is_admin_user());

drop policy if exists admin_project_knowledge_all on public.admin_project_knowledge;
create policy admin_project_knowledge_all on public.admin_project_knowledge
  for all to authenticated
  using (public.sb_is_admin_user())
  with check (public.sb_is_admin_user());

drop policy if exists admin_generation_history_all on public.admin_generation_history;
create policy admin_generation_history_all on public.admin_generation_history
  for all to authenticated
  using (public.sb_is_admin_user())
  with check (public.sb_is_admin_user());

drop policy if exists admin_deployments_all on public.admin_deployments;
create policy admin_deployments_all on public.admin_deployments
  for all to authenticated
  using (public.sb_is_admin_user())
  with check (public.sb_is_admin_user());
