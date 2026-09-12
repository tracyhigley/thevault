// Shared Sun–Sat vocabulary for the This Week page. A fixed weekly
// template (not tied to calendar dates) — same 7 rows every time it's
// opened, matching the Sun-first convention already used by the Calendar
// week row (see components/calendar-week-row.tsx's DAY_NAMES).

export type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export const DAY_KEYS: DayKey[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

export const DAY_LABELS: Record<DayKey, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

// Purely a memory-jog shown in parentheses next to each day's label on the
// This Week page — Tracy's usual building rhythm. Cosmetic only: it doesn't
// drive which buildings can be picked that day, just hints at the pattern.
export const DAY_HINTS: Record<DayKey, string> = {
  sun: "usually Reservoir",
  mon: "usually Mercantile",
  tue: "choose from Support Center/Family Lodge or Press",
  wed: "choose from Support Center/Family Lodge or Press",
  thu: "choose from Support Center/Family Lodge or Press",
  fri: "choose from Support Center/Family Lodge or Press",
  sat: "usually Grounds, Reservoir, and Port",
};

export function isDayKey(v: string): v is DayKey {
  return (DAY_KEYS as string[]).includes(v);
}

// settings.week_buildings shape: { [day]: buildingKey[] } — a day can now
// have more than one building chosen (multi-select).
export type WeekBuildings = Partial<Record<DayKey, string[]>>;

// settings.week_day_projects shape: { [day]: { [buildingKey]: projectId } }
// — the one project "featured" for that day within that building, chosen
// from a dropdown of the building's under-construction projects.
export type WeekDayProjects = Partial<Record<DayKey, Record<string, string>>>;
