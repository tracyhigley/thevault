-- Project Plan page: Priority (1-3) and Days to Build (1-3) dropdowns.
alter table projects
add column if not exists priority smallint check (priority between 1 and 3),
add column if not exists days_to_build smallint check (days_to_build between 1 and 3);
