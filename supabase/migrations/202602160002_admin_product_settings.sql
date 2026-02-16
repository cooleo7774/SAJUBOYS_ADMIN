-- Step 3: Product structure refactor
-- Created at: 2026-02-16

alter table if exists public.admin_projects
  add column if not exists product_type text not null default 'full_reading' check (
    product_type in ('daily_fortune', 'compatibility', 'full_reading')
  ),
  add column if not exists prompt_template text not null default '',
  add column if not exists tone_profile jsonb not null default '{}'::jsonb;

create index if not exists admin_projects_product_type_updated_idx
  on public.admin_projects (product_type, updated_at desc);
