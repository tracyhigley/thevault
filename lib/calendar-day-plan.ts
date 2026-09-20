// Client-safe rules for what a single calendar day holds: a building, an
// optional project inside it, and an optional free-text note that stands in
// for the project ("Dr B 3 pm"). Shared by the server action (which enforces
// them) and the calendar UI (which uses them for optimistic updates and to
// build the project dropdown).

import type { ProjectPhase } from "@/lib/project-phases";

export type DayPlan = {
  boxKey: string | null;
  projectId: string | null;
  note: string | null;
};

export const DAY_NOTE_MAX = 200;

export const EMPTY_DAY_PLAN: DayPlan = {
  boxKey: null,
  projectId: null,
  note: null,
};

// Trim the note and enforce the invariants: a project only makes sense inside
// a building, and typed text replaces the project rather than sitting beside it.
export function normalizeDayPlan(plan: DayPlan): DayPlan {
  const note = plan.note?.trim() ?? "";
  const boxKey = plan.boxKey && plan.boxKey !== "" ? plan.boxKey : null;
  const projectId =
    boxKey && note === "" && plan.projectId ? plan.projectId : null;
  return { boxKey, projectId, note: note === "" ? null : note };
}

export function isEmptyDayPlan(plan: DayPlan): boolean {
  const p = normalizeDayPlan(plan);
  return p.boxKey === null && p.projectId === null && p.note === null;
}

// What the day's dropdown needs to know about a project.
export type CalendarProjectOption = {
  id: string;
  title: string;
  building: string;
  phase: ProjectPhase;
};

const PICKABLE_PHASES: ReadonlySet<ProjectPhase> = new Set<ProjectPhase>([
  "planning",
  "building", // "Under construction" in the UI
]);

// Projects offered for a day in `boxKey`: that building's Under construction
// and Planning projects (construction first). A project the day already
// points at stays in the list even if it has since moved to another phase, so
// a past day never shows a blank where it used to name a project.
export function projectsForBuilding(
  projects: CalendarProjectOption[],
  boxKey: string | null,
  keepId: string | null,
): CalendarProjectOption[] {
  if (!boxKey) return [];
  return projects
    .filter(
      (p) =>
        p.building === boxKey &&
        (PICKABLE_PHASES.has(p.phase) || p.id === keepId),
    )
    .sort((a, b) => {
      const rank = (p: CalendarProjectOption) =>
        p.phase === "building" ? 0 : p.phase === "planning" ? 1 : 2;
      return rank(a) - rank(b) || a.title.localeCompare(b.title);
    });
}
