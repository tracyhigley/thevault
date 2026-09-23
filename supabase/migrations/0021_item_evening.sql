-- Today page: flag a task as "do this in the evening" so it's left out of
-- the "when to switch to Maint Tasks" hours calculation.
alter table items
add column if not exists evening boolean not null default false;
