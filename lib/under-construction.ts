// The Today page's "Currently Under Construction" list — shared with the
// /build wizard's Time Left step so both count the same tasks. A task that's
// checked (onTaskList) on its Project Plan is what puts it on Today now;
// there's no separate "+ TODAY" pull anymore.
//
// Which projects: only those in the "building" (Under Construction) phase,
// from these buildings, always listed in this order (Tracy's choice,
// 2026-10-24): Library, Press, Mercantile, Support Center, then Wellness
// Center, Grounds, Port, Family Lodge. Within a
// building, projects keep their saved task-group order, then oldest first.
// Each shows up to UNDER_CONSTRUCTION_TASK_LIMIT checked tasks — urgent
// first, then oldest.

import type { Project } from "./projects";

export const UNDER_CONSTRUCTION_TASK_LIMIT = 3;

// Display order matters: Today lists projects building by building in this order.
const UNDER_CONSTRUCTION_BUILDING_ORDER = [
  "THE_LIBRARY",
  "THE_PRESS",
  "THE_MERCANTILE",
  "THE_SUPPORT_CENTER",
  "THE_WELLNESS_CENTER",
  "THE_GROUNDS",
  "THE_PORT",
  "THE_FAMILY_LODGE",
];
const UNDER_CONSTRUCTION_BUILDINGS = new Set(UNDER_CONSTRUCTION_BUILDING_ORDER);
const buildingRank = (key: string) =>
  UNDER_CONSTRUCTION_BUILDING_ORDER.indexOf(key);

export type UnderConstructionTask = {
  taskId: string;
  text: string;
  minutes: number | null;
  sun: boolean; // ☀ chosen to work on today — only these count toward hours
};

export type UnderConstructionGroup = {
  projectId: string;
  projectTitle: string;
  building: string; // building key — Today shows its label before the title
  tasks: UnderConstructionTask[];
};

export function underConstructionGroups(
  projects: Project[],
  today: string, // YYYY-MM-DD — a task's ☀ only counts on the day it was set
): UnderConstructionGroup[] {
  return projects
    .filter(
      (p) =>
        p.phase === "building" && UNDER_CONSTRUCTION_BUILDINGS.has(p.building),
    )
    .sort((a, b) => {
      const byBuilding = buildingRank(a.building) - buildingRank(b.building);
      if (byBuilding !== 0) return byBuilding;
      if (a.taskGroupOrder != null && b.taskGroupOrder != null) {
        return a.taskGroupOrder - b.taskGroupOrder;
      }
      if (a.taskGroupOrder != null) return -1;
      if (b.taskGroupOrder != null) return 1;
      return a.createdAt.localeCompare(b.createdAt);
    })
    .map((p) => ({
      projectId: p.id,
      projectTitle: p.title,
      building: p.building,
      tasks: p.tasks
        .filter((t) => t.onTaskList)
        .sort(
          (a, b) =>
            Number(b.urgent) - Number(a.urgent) ||
            a.createdAt.localeCompare(b.createdAt),
        )
        .slice(0, UNDER_CONSTRUCTION_TASK_LIMIT)
        .map((t) => ({
          taskId: t.id,
          text: t.text,
          minutes: t.minutes,
          sun: t.todayDate === today,
        })),
    }));
}

// Minutes of the ☀-marked tasks only — the ones she's actually doing today.
export function underConstructionMinutes(
  groups: UnderConstructionGroup[],
): number {
  return groups.reduce(
    (sum, g) =>
      sum + g.tasks.reduce((s, t) => s + (t.sun ? (t.minutes ?? 0) : 0), 0),
    0,
  );
}
