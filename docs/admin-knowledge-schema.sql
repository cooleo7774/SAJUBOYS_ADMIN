-- SAJUBOYS_ADMIN schema draft (rework)
-- Last updated: 2026-02-16

create table if not exists public.admin_projects (
  id uuid primary key default gen_random_uuid(),
  project_key text not null unique,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  language text not null default 'ko',
  product_type text not null default 'full_reading' check (product_type in ('daily_fortune', 'compatibility', 'full_reading')),
  prompt_template text not null default '',
  tone_profile jsonb not null default '{}'::jsonb,
  goal text not null default '',
  tone text not null default '',
  context_text text not null default '',
  metadata_json jsonb not null default '{}'::jsonb,
  current_knowledge_version text,
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

create table if not exists public.admin_knowledge_blocks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (
    category in (
      'cheon_gan',
      'ji_ji',
      'ohaeng',
      'sib_i_unseong',
      'sibseong',
      'sinsal',
      'compatibility_principle',
      'fortune_principle',
      'tongbyeon',
      'interpretation_guide',
      'custom'
    )
  ),
  content_md text not null,
  tags text[] not null default '{}',
  source text,
  priority integer not null default 100,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_project_knowledge (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.admin_projects (id) on delete cascade,
  knowledge_block_id uuid not null references public.admin_knowledge_blocks (id) on delete cascade,
  attached_at timestamptz not null default timezone('utc', now()),
  attached_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (project_id, knowledge_block_id)
);

create table if not exists public.admin_generation_history (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.admin_projects (id) on delete cascade,
  product_type text not null check (product_type in ('daily_fortune', 'compatibility', 'full_reading')),
  user_input_json jsonb not null default '{}'::jsonb,
  saju_chart_json jsonb not null default '{}'::jsonb,
  prompt_text text not null,
  output_text text not null,
  llm_model text,
  llm_meta_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default timezone('utc', now())
);

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

-- RLS baseline (see supabase/migrations/202602160005_admin_rls_policies.sql)
-- - enable row level security on all admin_* tables
-- - policy condition: public.sb_is_admin_user()
