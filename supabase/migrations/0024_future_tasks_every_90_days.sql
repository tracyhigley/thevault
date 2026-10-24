-- Future Tasks: add an "every 90 days" repeat (a fixed day count, unlike
-- quarterly which returns to the same day of the month).
alter table future_tasks drop constraint if exists future_tasks_repeat_check;
alter table future_tasks add constraint future_tasks_repeat_check
  check (repeat in ('none','weekly','biweekly','monthly','quarterly','every90days','semiannual','yearly'));
