export type ItemState = "upcoming" | "active" | "done" | "skipped" | "overrun";

// Energies are user-defined per blueprint (settings.energies), so this is a
// loose string. Each energy carries a destination — see lib/categories.ts.
export type Energy = string;

export type CounterStation = "DROP" | "DOCKET" | "ATM" | "COUNTER";

// The four counter-station keys are reserved for daily-action surfaces;
// every other box key is user-defined via settings.boxes / settings.documents.
// `string & {}` keeps the literal-completion hint without forcing a closed
// union — so any user key like "GROCERIES" types fine.
export type BoxKey =
  | "DROP"
  | "DOCKET"
  | "ATM"
  | "COUNTER"
  | (string & {});

export type Item = {
  id: string;
  box: BoxKey;
  title: string;
  area?: string | null;
  minutes?: number | null;
  urgent: boolean;
  must: boolean;
  should: boolean;
  todayOrder?: number | null;
  atmOrder?: number | null;
  // Set only on the linked Today item created when a Project Task is
  // pulled onto today's plan (see addProjectTaskToToday). Lets pages that
  // list "Maint Tasks" specifically exclude these — they should surface
  // only on the Today docket, not duplicate onto Maint Tasks.
  sourceTaskId?: string | null;
  energy?: Energy | null;
  category?: string | null;
  potential?: 1 | 2 | 3 | 4 | 5 | null;
  person?: string | null;
  tag?: string | null;
  notes?: string | null;
  body?: string | null;

  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
  state?: ItemState | null;
  pinned: boolean;

  createdAt: string;
  modifiedAt: string;
  deletedAt?: string | null;
};

export type DayInputs = {
  date: string;
  hoursAvailable: number;
  creative: 1 | 2 | 3 | 4 | 5;
  probSolv: 1 | 2 | 3 | 4 | 5;
  tieBreak: "CREATIVE" | "PROB-SOLV";
  endOfDay: string;
};

export type Settings = {
  stressorAnchorMinutes: number;
  defaultEndOfDay: string;
  defaultHours: number;
  captureToken: string | null;
};

export const DEFAULT_SETTINGS: Settings = {
  stressorAnchorMinutes: 91,
  defaultEndOfDay: "16:30",
  defaultHours: 7,
  captureToken: null,
};
