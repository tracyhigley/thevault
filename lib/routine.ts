// Routine score-logging — the fixed checklist and its scoring rules.
//
// Every item is a plain checkbox worth a fixed number of points. Each
// group's points add up to exactly 100, so a group's score for a day is
// simply the sum of the points checked off in it (0–100). Scores count
// up through the day: at lunchtime, with only morning items possible,
// Food might read 30 out of 100.
//
// Checked items are stored per day in the `routine_days` table as a list
// of item keys. Keys must never change once in use — they're what past
// days were saved under. Renaming an item's label is fine.

export type RoutineSlot = "morning" | "lunch" | "evening";
export type RoutineGroup = "food" | "water" | "movement" | "restore";

export type RoutineItem = {
  key: string;
  group: RoutineGroup;
  slot: RoutineSlot;
  label: string;
  points: number;
};

export const ROUTINE_GROUPS: { key: RoutineGroup; label: string }[] = [
  { key: "food", label: "Food" },
  { key: "water", label: "Water" },
  { key: "movement", label: "Movement" },
  { key: "restore", label: "Restore" },
];

export const ROUTINE_SLOTS: {
  key: RoutineSlot;
  label: string;
  title: string;
}[] = [
  { key: "morning", label: "Morning", title: "Morning Routine" },
  { key: "lunch", label: "Lunch", title: "Lunch Routine" },
  { key: "evening", label: "Evening", title: "Evening Routine" },
];

export const ROUTINE_ITEMS: RoutineItem[] = [
  // FOOD
  {
    key: "food.morning.protein",
    group: "food",
    slot: "morning",
    label: "Protein 30g",
    points: 15,
  },
  {
    key: "food.morning.fiber",
    group: "food",
    slot: "morning",
    label: "Fiber 10g",
    points: 15,
  },
  {
    key: "food.lunch.protein",
    group: "food",
    slot: "lunch",
    label: "Protein 30g",
    points: 15,
  },
  {
    key: "food.lunch.fiber",
    group: "food",
    slot: "lunch",
    label: "Fiber 10g",
    points: 20,
  },
  {
    key: "food.evening.protein",
    group: "food",
    slot: "evening",
    label: "Protein 30g",
    points: 15,
  },
  {
    key: "food.evening.fiber",
    group: "food",
    slot: "evening",
    label: "Fiber 10g",
    points: 20,
  },

  // WATER
  {
    key: "water.morning.30oz",
    group: "water",
    slot: "morning",
    label: "30 oz by 10 am",
    points: 30,
  },
  {
    key: "water.lunch.50oz",
    group: "water",
    slot: "lunch",
    label: "50 oz by end of lunch break",
    points: 30,
  },
  {
    key: "water.evening.64oz",
    group: "water",
    slot: "evening",
    label: "64 oz finished",
    points: 40,
  },

  // MOVEMENT
  {
    key: "movement.morning.4k",
    group: "movement",
    slot: "morning",
    label: "4K steps by 10 am",
    points: 10,
  },
  {
    key: "movement.morning.workout",
    group: "movement",
    slot: "morning",
    label: "Weights or Cardio",
    points: 30,
  },
  {
    key: "movement.morning.backneck",
    group: "movement",
    slot: "morning",
    label: "Back & Neck Exercises",
    points: 15,
  },
  {
    key: "movement.lunch.7500",
    group: "movement",
    slot: "lunch",
    label: "7500 steps by end of lunch break",
    points: 10,
  },
  {
    key: "movement.lunch.backneck",
    group: "movement",
    slot: "lunch",
    label: "Back & Neck Exercises",
    points: 15,
  },
  {
    key: "movement.evening.10k",
    group: "movement",
    slot: "evening",
    label: "10K steps finished",
    points: 20,
  },

  // RESTORE
  {
    key: "restore.lunch.mentalbreak",
    group: "restore",
    slot: "lunch",
    label: "Mental break at lunch",
    points: 15,
  },
  {
    key: "restore.evening.work",
    group: "restore",
    slot: "evening",
    label: "Shut down work by 7 pm",
    points: 15,
  },
  {
    key: "restore.evening.food",
    group: "restore",
    slot: "evening",
    label: "Shut down food by 7:30 pm",
    points: 15,
  },
  {
    key: "restore.evening.supplements",
    group: "restore",
    slot: "evening",
    label: "Evening supplements by 7:30 pm",
    points: 10,
  },
  {
    key: "restore.evening.screens",
    group: "restore",
    slot: "evening",
    label: "Shut down screens by 9 pm",
    points: 15,
  },
  {
    key: "restore.evening.stretches",
    group: "restore",
    slot: "evening",
    label: "Evening stretches",
    points: 15,
  },
  {
    key: "restore.evening.reading",
    group: "restore",
    slot: "evening",
    label: "In bed reading by 9:30 pm",
    points: 15,
  },
];

const ITEM_BY_KEY = new Map(ROUTINE_ITEMS.map((i) => [i.key, i]));

export function isRoutineSlot(v: unknown): v is RoutineSlot {
  return v === "morning" || v === "lunch" || v === "evening";
}

export type RoutineScores = Record<RoutineGroup, number>;

/** Each group's 0–100 score for one day, from the checked item keys. */
export function scoreDay(checked: Iterable<string>): RoutineScores {
  const scores: RoutineScores = { food: 0, water: 0, movement: 0, restore: 0 };
  const seen = new Set<string>();
  for (const key of checked) {
    if (seen.has(key)) continue;
    seen.add(key);
    const item = ITEM_BY_KEY.get(key);
    if (item) scores[item.group] += item.points;
  }
  for (const g of Object.keys(scores) as RoutineGroup[]) {
    scores[g] = Math.min(100, scores[g]);
  }
  return scores;
}

/**
 * Average score per group across logged days. Days that weren't logged
 * aren't passed in at all, so they don't drag the average down. Returns
 * null scores when there are no logged days.
 */
export function averageScores(days: string[][]): {
  days: number;
  scores: RoutineScores | null;
} {
  if (days.length === 0) return { days: 0, scores: null };
  const total: RoutineScores = { food: 0, water: 0, movement: 0, restore: 0 };
  for (const checked of days) {
    const s = scoreDay(checked);
    for (const g of Object.keys(total) as RoutineGroup[]) total[g] += s[g];
  }
  for (const g of Object.keys(total) as RoutineGroup[]) {
    total[g] = Math.round(total[g] / days.length);
  }
  return { days: days.length, scores: total };
}

/**
 * How many days in the last `windowDays` (ending today) had nothing logged
 * at all. Days before the first-ever logged day don't count (tracking
 * hadn't started), and today never counts — it's still in progress, so it
 * can't be "skipped" yet. `loggedDates` are YYYY-MM-DD strings of days with
 * at least one item checked.
 */
export function countUnloggedDays(
  loggedDates: string[],
  today: string,
  windowDays: number,
  firstLoggedDate: string | null,
): number {
  if (!firstLoggedDate) return 0;
  const logged = new Set(loggedDates);
  let start = addDaysYmd(today, -(windowDays - 1));
  if (firstLoggedDate > start) start = firstLoggedDate;
  let count = 0;
  for (let d = start; d < today; d = addDaysYmd(d, 1)) {
    if (!logged.has(d)) count++;
  }
  return count;
}

/** Shift a YYYY-MM-DD date by whole days (calendar math, no time zones). */
export function addDaysYmd(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split("-").map((p) => parseInt(p, 10));
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return dt.toISOString().slice(0, 10);
}
