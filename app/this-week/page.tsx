// This Week — a fixed Sun–Sat planning table, not tied to any particular
// calendar week. Two sections:
//
// 1. "This Week's Writing Project(s)" — multi-select over The Library's
//    under-construction projects, shown as PROJECT/TASKS cards.
// 2. The day grid — each day can have more than one building checked
//    (multi-select). Within a checked building that has projects under
//    construction, a dropdown picks ONE project to feature that day; its
//    PROJECT/TASKS card shows once picked (tasks = whatever's checked onto
//    the Project Tasks page for that project — see lib/projects.ts). A
//    building with nothing under construction shows its open Maint Tasks
//    instead. Also, on the first day of the week a building is scheduled,
//    its Maint Tasks show underneath the featured project too, so open
//    chores don't get buried behind a whole week of "under construction."
//
// Everything is color-coded to each building's settings.buildings color.

import { getBuildings } from "@/lib/categories";
import {
  getProjects,
  getWeekBuildings,
  getWeekDayProjects,
  getWeekWritingProjectIds,
} from "@/lib/projects";
import { getItemsByBox } from "@/lib/data";
import { DAY_HINTS, DAY_KEYS, DAY_LABELS } from "@/lib/week-days";
import { WeekDayBuildingsPicker } from "@/components/week-day-buildings-picker";
import { WeekDayBuildingBlock } from "@/components/week-day-building-block";
import { WeekWritingProjectsSection } from "@/components/week-writing-projects-section";

// Matches settings.buildings' auto-derived key for "The Library" — same
// hardcode-the-key convention as RESERVOIR_BUILDING_KEY in lib/actions.ts.
// If Tracy ever renames/rekeys that building, update this to match.
const LIBRARY_BUILDING_KEY = "THE_LIBRARY";

export default async function ThisWeekPage() {
  const [buildings, projects, weekBuildings, weekDayProjects, weekWritingProjectIds, counterItems] =
    await Promise.all([
      getBuildings(),
      getProjects(),
      getWeekBuildings(),
      getWeekDayProjects(),
      getWeekWritingProjectIds(),
      getItemsByBox("COUNTER"),
    ]);

  const buildingByKey = new Map(buildings.map((b) => [b.key, b]));

  // Under-construction projects, grouped by building — same "under
  // construction" definition as the Master Project Plans / Under
  // Construction pages (phase === "building"). Ordered the same way as the
  // Under Construction page: manual activeOrder first, else newest first.
  // "tasks" here is every checklist item checked onto the Project Tasks
  // page (t.onTaskList) — not just the first one, and never a done task:
  // onTaskList and done are mutually exclusive (see lib/project-phases.ts),
  // so finishing a task there already drops it from this list.
  const underConstructionByBuilding = new Map<
    string,
    { id: string; title: string; tasks: { id: string; text: string }[] }[]
  >();
  const activeSorted = projects
    .filter((p) => p.phase === "building")
    .sort((a, b) => {
      if (a.activeOrder != null && b.activeOrder != null) {
        return a.activeOrder - b.activeOrder;
      }
      if (a.activeOrder != null) return -1;
      if (b.activeOrder != null) return 1;
      return (b.modifiedAt ?? "").localeCompare(a.modifiedAt ?? "");
    });
  for (const p of activeSorted) {
    const list = underConstructionByBuilding.get(p.building) ?? [];
    list.push({
      id: p.id,
      title: p.title,
      tasks: p.tasks
        .filter((t) => t.onTaskList)
        .map((t) => ({ id: t.id, text: t.text })),
    });
    underConstructionByBuilding.set(p.building, list);
  }

  // Open Maint Tasks, grouped by area — same filter Maint Tasks itself uses
  // (excludes Project-Task-linked items, Today custom blocks, and done
  // items), for the "nothing under construction" fallback per building,
  // and for the first-scheduled-day showcase below. Also excludes the
  // auto-populated Daily Reservoir habit defaults (Drink water, Lift
  // weights, etc. — see ensureDailyReservoirDefaults in lib/actions.ts):
  // those show up fresh every day regardless, so they don't belong in a
  // weekly maint-tasks catch-up list. This exclusion is specific to This
  // Week — the Maint Tasks page itself still shows them.
  const openMaintTasks = counterItems.filter(
    (it) =>
      !it.sourceTaskId &&
      it.tag !== "CUSTOM_BLOCK" &&
      it.state !== "done" &&
      !it.tag?.startsWith("DAILY_RESERVOIR:"),
  );
  const maintTasksByBuilding = new Map<
    string,
    { id: string; title: string; minutes: number | null }[]
  >();
  for (const it of openMaintTasks) {
    if (!it.area) continue;
    const list = maintTasksByBuilding.get(it.area) ?? [];
    list.push({ id: it.id, title: it.title, minutes: it.minutes ?? null });
    maintTasksByBuilding.set(it.area, list);
  }

  // First day of the week (Sun→Sat) each building is scheduled at all —
  // that's the one day its Maint Tasks show alongside a featured project.
  const firstDayForBuilding = new Map<string, (typeof DAY_KEYS)[number]>();
  for (const day of DAY_KEYS) {
    for (const key of weekBuildings[day] ?? []) {
      if (!firstDayForBuilding.has(key)) firstDayForBuilding.set(key, day);
    }
  }

  const libraryProjects =
    underConstructionByBuilding.get(LIBRARY_BUILDING_KEY) ?? [];
  const libraryColor = buildingByKey.get(LIBRARY_BUILDING_KEY)?.color;

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-10">
      <div className="eyebrow">— This Week —</div>
      <h1 className="serif-h mt-2 text-[34px] leading-tight md:text-[44px]">
        A building a day.
      </h1>
      <p className="mt-2 text-[16px] leading-relaxed text-ink-dim">
        Check off one or more buildings for each day. Pick a project under
        construction there to feature it, or catch up on maint tasks if
        nothing's building.
      </p>

      <div className="mt-8 rounded-sm border border-paper-line bg-paper-panel/40 px-4 py-5 md:px-6">
        <div className="eyebrow">— This Week&apos;s Writing Project(s) —</div>
        <div className="mt-4">
          <WeekWritingProjectsSection
            projects={libraryProjects}
            initialSelectedIds={weekWritingProjectIds}
            color={libraryColor}
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-sm border border-paper-line">
        {DAY_KEYS.map((day, i) => {
          const selectedKeys = weekBuildings[day] ?? [];
          const dayProjectPicks = weekDayProjects[day] ?? {};

          return (
            <div
              key={day}
              className={
                "flex flex-col gap-4 border-paper-line bg-paper-panel/40 px-4 py-5 md:px-6" +
                (i > 0 ? " border-t" : "")
              }
            >
              <div className="serif-h text-[22px] text-ink">
                {DAY_LABELS[day]}{" "}
                <span className="text-[15px] font-sans font-normal text-ink-mute">
                  ({DAY_HINTS[day]})
                </span>
              </div>

              <WeekDayBuildingsPicker
                day={day}
                buildings={buildings}
                initialSelected={selectedKeys}
              />

              {selectedKeys.length > 0 && (
                <div className="mt-1 space-y-3">
                  {buildings
                    .filter((b) => selectedKeys.includes(b.key))
                    .map((b) => (
                      <WeekDayBuildingBlock
                        key={b.key}
                        day={day}
                        buildingKey={b.key}
                        buildingLabel={b.label}
                        buildingColor={b.color}
                        underConstruction={
                          underConstructionByBuilding.get(b.key) ?? []
                        }
                        maintTasks={maintTasksByBuilding.get(b.key) ?? []}
                        initialProjectId={dayProjectPicks[b.key] ?? null}
                        isFirstScheduledDay={
                          firstDayForBuilding.get(b.key) === day
                        }
                      />
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
