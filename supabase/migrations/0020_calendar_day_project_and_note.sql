-- Calendar: each day now carries its own building, an optional project inside
-- that building, and an optional free-text note alongside it
-- (e.g. building = The Wellness Center, note = "Dr B 3 pm").
--
-- Week-level building assignments are retired from the UI: a day no longer
-- inherits from its week. To keep everything already planned, every existing
-- week assignment is first copied down onto the days of that week that don't
-- already have their own row. calendar_week_assignments.box_key is left in
-- place but is no longer read (the week row still carries the week note).

alter table calendar_day_overrides
  add column if not exists project_id uuid references projects(id) on delete set null,
  add column if not exists note text;

-- Materialise week -> day so no existing plan goes blank.
insert into calendar_day_overrides (vault_id, date, box_key)
select w.vault_id, (w.week_start + g.n)::date, w.box_key
from calendar_week_assignments w
cross join generate_series(0, 6) as g(n)
where w.box_key is not null
on conflict (vault_id, date) do nothing;

-- The old "explicitly off, even though the week has a project" rows carry no
-- information now that days don't inherit.
delete from calendar_day_overrides
where box_key is null and project_id is null and note is null;
