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

export function isDayKey(v: string): v is DayKey {
  return (DAY_KEYS as string[]).includes(v);
}

// settings.week_buildings shape: { [day]: buildingKey | null }
export type WeekBuildings = Partial<Record<DayKey, string | null>>;
