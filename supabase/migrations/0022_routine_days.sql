-- Routine score-logging: one row per day holding the keys of the routine
-- checklist items checked off that day (see lib/routine.ts for the fixed
-- item list and points). A day with no row = not logged, and is left out
-- of the 7- and 30-day averages.
create table if not exists routine_days (
  vault_id uuid not null references vaults(id) on delete cascade,
  date date not null,
  checked text[] not null default '{}',
  created_at timestamptz not null default now(),
  modified_at timestamptz not null default now(),
  primary key (vault_id, date)
);

alter table routine_days enable row level security;

drop policy if exists "routine_days: vault members" on routine_days;
create policy "routine_days: vault members" on routine_days for all
  using (public.is_vault_member(vault_id))
  with check (public.is_vault_member(vault_id));
