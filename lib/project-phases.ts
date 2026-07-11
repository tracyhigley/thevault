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
