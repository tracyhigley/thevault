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
