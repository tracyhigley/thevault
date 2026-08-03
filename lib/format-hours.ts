// Shared "minutes → hours" display formatting. Used anywhere we show a
// total against hours (Today's three cards, Maint Tasks, Project Tasks) —
// one decimal place, trimmed when it's a whole number.

/** 90 → "1.5", 60 → "1", 615 → "10.3". */
export function fmtHoursFromMinutes(minutes: number): string {
  return fmtHoursNumber(minutes / 60);
}

export function fmtHoursNumber(hours: number): string {
  const rounded = Math.round(hours * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/**
 * Quarter-hour rounding (.25 increments) for the live Today summary line —
 * e.g. 3.1 → "3", 3.2 → "3.25", 3.4 → "3.5". Negative in (e.g. past
 * end-of-day) clamps to 0 rather than showing a negative number of hours.
 */
export function fmtQuarterHours(hours: number): string {
  const rounded = Math.round(Math.max(0, hours) * 4) / 4;
  return String(rounded);
}
