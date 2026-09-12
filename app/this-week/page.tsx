// This Week — a fixed Sun–Sat planning table, not tied to any particular
// calendar week. For each day, pick a building; once picked, the row shows
// every project currently "under construction" in that building (phase ===
// "building") along with the first task on that project's checklist, so a
// glance down the table says what this week's building focus touches.

import { getBuildings } from "@/lib/categories";
import {
  getProjects,
  getWeekBuildings,
  getWeekWritingProjectIds,
} from "@/lib/projects";
import { DAY_KEYS, DAY_LABELS } from "@/lib/week-days";
import { WeekBuildingPicker } from "@/components/week-building-picker";
import { WeekWritingProjectsSection } from "@/components/week-writing-projects-section";

// Matches settings.buildings' auto-derived key for "The Library" — same
// hardcode-the-key convention as GYMNASIUM_BUILDING_KEY in lib/actions.ts.
// If Tracy ever renames/rekeys that building, update this to match.
const LIBRARY_BUILDING_KEY = "THE_LIBRARY";

export default async function ThisWeekPage() {
  const [buildings, projects, weekBuildings, weekWritingProjectIds] =
    await Promise.all([
      getBuildings(),
      getProjects(),
      getWeekBuildings(),
      getWeekWritingProjectIds(),
    ]);

  const buildingByKey = new Map(buildings.map((b) => [b.key, b]));

  // Under-construction projects, grouped by building — same "under
  // construction" definition as the Master Project Plans / Under
  // Construction pages (phase === "building"). Ordered the same way as the
  // Under Construction page: manual activeOrder first, else newest first.
  const underConstructionByBuilding = new Map<
    string,
    { id: string; title: string; firstTask: string | null }[]
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
      firstTask: p.tasks[0]?.text ?? null,
    });
    underConstructionByBuilding.set(p.building, list);
  }

  const libraryProjects =
    underConstructionByBuilding.get(LIBRARY_BUILDING_KEY) ?? [];

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 md:px-10">
      <div className="eyebrow">— This Week —</div>
      <h1 className="serif-h mt-2 text-[28px] leading-tight md:text-[36px]">
        A building a day.
      </h1>
      <p className="mt-1 text-[13px] text-ink-dim">
        Pick a building for each day. If it has projects under construction,
        their first task shows up right here.
      </p>

      <div className="mt-8 rounded-sm border border-paper-line bg-paper-panel/40 px-4 py-4 md:px-6">
        <div className="eyebrow">— This Week&apos;s Writing Project(s) —</div>
        <div className="mt-3">
          <WeekWritingProjectsSection
            projects={libraryProjects}
            initialSelectedIds={weekWritingProjectIds}
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-sm border border-paper-line">
        {DAY_KEYS.map((day, i) => {
          const chosenKey = weekBuildings[day] ?? null;
          const chosen = chosenKey ? buildingByKey.get(chosenKey) : undefined;
          const projectsForDay = chosenKey
            ? (underConstructionByBuilding.get(chosenKey) ?? [])
            : [];

          return (
            <div
              key={day}
              className={
                "flex flex-col gap-3 border-paper-line bg-paper-panel/40 px-4 py-4 sm:flex-row sm:items-start sm:gap-6 md:px-6" +
                (i > 0 ? " border-t" : "")
              }
            >
              <div className="serif-h shrink-0 pt-1.5 text-[16px] text-ink sm:w-[130px]">
                {DAY_LABELS[day]}
              </div>

              <div className="min-w-0 flex-1">
                <div className="max-w-[280px]">
                  <WeekBuildingPicker
                    day={day}
                    buildings={buildings}
                    initial={chosenKey}
                  />
                </div>

                {chosenKey ? (
                  projectsForDay.length > 0 ? (
                    <div className="mt-3 space-y-2.5">
                      {projectsForDay.map((p) => (
                        <div
                          key={p.id}
                          className="rounded-sm border border-paper-line/60 bg-paper-bg/30 px-3 py-2"
                        >
                          <div className="font-mono text-[10px] tracking-[0.14em] text-brass">
                            PROJECT: <span className="text-ink">{p.title}</span>
                          </div>
                          <div className="mt-1 font-mono text-[10px] tracking-[0.14em] text-ink-mute">
                            FIRST TASK:{" "}
                            <span className="text-ink-dim">
                              {p.firstTask ?? "(no tasks yet)"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-[12px] text-ink-mute">
                      Nothing under construction in {chosen?.label ?? "this building"}{" "}
                      right now.
                    </p>
                  )
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
