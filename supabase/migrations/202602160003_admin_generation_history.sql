-- Step 4: Generation pipeline history
-- Created at: 2026-02-16

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

create index if not exists admin_generation_history_project_created_idx
  on public.admin_generation_history (project_id, created_at desc);

create index if not exists admin_generation_history_product_created_idx
  on public.admin_generation_history (product_type, created_at desc);
