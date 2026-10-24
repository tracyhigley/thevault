-- Future Tasks: to-dos that belong to a later date (or "someday"). On a
-- task's day the morning job copies it into Field Notes (a DROP item) and
-- posts a Slack alert. One-off tasks are then marked sent (done_at); a
-- repeating task moves to its next date after today instead.
create table if not exists future_tasks (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references vaults(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  -- null = someday: stays on the page, never sent on its own
  due_on date,
  repeat text not null default 'none'
    check (repeat in ('none','weekly','biweekly','monthly','quarterly','semiannual','yearly')),
  -- day of month from the first date, so monthly repeats return to the 31st
  anchor_day smallint check (anchor_day between 1 and 31),
  link text check (link is null or char_length(link) <= 500),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  -- one-off tasks: when it was sent to Field Notes (shown in the Sent list)
  done_at timestamptz,
  done_by uuid references auth.users(id) on delete set null,
  -- repeating tasks: when it was last sent
  last_done_at timestamptz,
  -- the date it was last sent to Field Notes (guards against doubles)
  sent_on date,
  -- the Field Note it last became
  last_item_id uuid references items(id) on delete set null,
  constraint future_tasks_repeat_needs_date check (repeat = 'none' or due_on is not null)
);

create index if not exists future_tasks_vault_due_idx
  on future_tasks (vault_id, due_on) where done_at is null;

alter table future_tasks enable row level security;

drop policy if exists "future_tasks: vault members" on future_tasks;
create policy "future_tasks: vault members" on future_tasks for all
  using (public.is_vault_member(vault_id))
  with check (public.is_vault_member(vault_id));
