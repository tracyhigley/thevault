// Client-safe project vocabulary — phases, labels, and shared types.
// Deliberately free of server imports so client components (phase stepper,
// log editor) can use it without dragging server-only code into the bundle.

export type ProjectPhase = "idea" | "planning" | "building" | "complete";

export const PHASES: { key: ProjectPhase; label: string }[] = [
  { key: "idea", label: "Idea" },
  { key: "planning", label: "Planning" },
  { key: "building", label: "Under construction" },
  { key: "complete", label: "Complete" },
];

export function phaseLabel(phase: ProjectPhase): string {
  return PHASES.find((p) => p.key === phase)?.label ?? phase;
}

export type ProjectLogEntry = {
  date: string; // YYYY-MM-DD
  text: string;
};

// A single checklist item on a project. `onTaskList` decides whether it
// currently surfaces on the Project Tasks page — it is a visibility flag,
// not completion. There's no separate "done" state: finishing a task means
// removing it (from either the project's checklist or the Project Tasks
// page, which just unchecks it here).
export type ProjectTask = {
  id: string;
  text: string;
  onTaskList: boolean;
  done: boolean; // finished via the Project Tasks page — shows struck through here
  createdAt: string; // ISO timestamp
};
