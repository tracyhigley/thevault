-- Project Tasks "Add to Today" needs a real Item so the task shows up on
-- the actual Today docket — otherwise today_order has nowhere to live (see
-- 0016_master_plan's note that Projects are deliberately decoupled from the
-- daily engine). These two columns are the one narrow, intentional bridge:
-- nullable, and only ever set on Items created via the Project Tasks page
-- — regular Admin Tasks rows never touch them.
alter table items
  add column if not exists source_project_id uuid references projects(id) on delete set null,
  add column if not exists source_task_id text;

-- One live Today item per project task — keeps "Add to Today" from ever
-- creating a duplicate if it's clicked twice in a row.
create unique index if not exists items_source_task_unique
  on items (source_project_id, source_task_id)
  where deleted_at is null and source_task_id is not null;
