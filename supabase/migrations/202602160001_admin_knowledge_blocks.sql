-- Step 2: Knowledge block system
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

create index if not exists admin_knowledge_blocks_category_status_updated_idx
  on public.admin_knowledge_blocks (category, status, updated_at desc);

create index if not exists admin_knowledge_blocks_tags_gin_idx
  on public.admin_knowledge_blocks
  using gin (tags);

create index if not exists admin_project_knowledge_project_idx
  on public.admin_project_knowledge (project_id, attached_at desc);

create index if not exists admin_project_knowledge_block_idx
  on public.admin_project_knowledge (knowledge_block_id);

drop trigger if exists trg_admin_knowledge_blocks_updated_at on public.admin_knowledge_blocks;
create trigger trg_admin_knowledge_blocks_updated_at
before update on public.admin_knowledge_blocks
for each row
execute function public.tg_set_updated_at();

drop trigger if exists trg_admin_project_knowledge_updated_at on public.admin_project_knowledge;
create trigger trg_admin_project_knowledge_updated_at
before update on public.admin_project_knowledge
for each row
execute function public.tg_set_updated_at();
