-- Master Plan: long-horizon "building projects" grouped into buildings
-- (life domains configured in settings, like boxes). Projects carry a
-- values statement, a definition of done, systems brainstorming, and a
-- dated log. Deliberately decoupled from the daily engine — nothing here
-- touches items, today_order, or the schedule.

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references vaults(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  building text not null,
  title text not null,
  phase text not null default 'idea'
    check (phase in ('idea', 'planning', 'building', 'complete')),
  why text,
  done_looks_like text,
  sketch text,
  systems text,
  log jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  modified_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table projects enable row level security;

drop policy if exists "projects: vault members" on projects;

create policy "projects: vault members" on projects for all
  using (exists (
    select 1 from vault_members vm
    where vm.vault_id = projects.vault_id and vm.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from vault_members vm
    where vm.vault_id = projects.vault_id and vm.user_id = auth.uid()
  ));

create index if not exists projects_vault_idx
  on projects (vault_id) where deleted_at is null;

-- Buildings live in settings JSONB like boxes/documents/energies —
-- user-configured, no defaults.
alter table settings add column if not exists buildings jsonb;
