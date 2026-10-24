// The Today page's "Currently Under Construction" list — shared with the
// /build wizard's Time Left step so both count the same tasks. A task that's
// checked (onTaskList) on its Project Plan is what puts it on Today now;
// there's no separate "+ TODAY" pull anymore.
//
// Which projects: only those in the "building" (Under Construction) phase,
// and only from The Support Center, Library, Press, and Mercantile. Each
// shows up to UNDER_CONSTRUCTION_TASK_LIMIT checked tasks — urgent first, then oldest.

import type { Project } from "./projects";

export const UNDER_CONSTRUCTION_TASK_LIMIT = 3;

const UNDER_CONSTRUCTION_BUILDINGS = new Set([
  "THE_SUPPORT_CENTER",
  "THE_LIBRARY",
  "THE_PRESS",
  "THE_MERCANTILE",
]);

export type UnderConstructionTask = {
  taskId: string;
  text: string;
  minutes: number | null;
};

export type UnderConstructionGroup = {
  projectId: string;
  projectTitle: string;
  building: string; // building key — Today shows its label before the title
  tasks: UnderConstructionTask[];
};

export function underConstructionGroups(
  projects: Project[],
): UnderConstructionGroup[] {
  return projects
    .filter(
      (p) =>
        p.phase === "building" && UNDER_CONSTRUCTION_BUILDINGS.has(p.building),
    )
    .sort((a, b) => {
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
        .map((t) => ({ taskId: t.id, text: t.text, minutes: t.minutes })),
    }));
}

export function underConstructionMinutes(
  groups: UnderConstructionGroup[],
): number {
  return groups.reduce(
    (sum, g) => sum + g.tasks.reduce((s, t) => s + (t.minutes ?? 0), 0),
    0,
  );
}
