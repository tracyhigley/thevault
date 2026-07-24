-- Per-project task checklist. Tasks live on the project itself (jsonb,
-- same pattern as `log`) — lightweight, deliberately outside the daily
-- engine. `onTaskList` controls whether a task surfaces on the
-- Project Tasks page; it is a visibility flag, not a "done" flag —
-- finishing a task means removing it, same spirit as everywhere else
-- in the app (checking it off just says "pull this into view").
alter table projects add column if not exists tasks jsonb not null default '[]'::jsonb;
