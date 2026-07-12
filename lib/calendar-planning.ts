// Calendar planning surface — week-level "this whole week is QCOM" assignments
// plus per-day overrides. Pure planning data; reading is `override ?? week`.
//
// Week starts on Sunday. Dates are stored as plain YYYY-MM-DD strings (no
// timezone in the table — these are calendar dates, not instants).

import { supabaseServer } from "@/lib/supabase/server";
import { todayYmd } from "@/lib/day-timezone";

export type CalendarDay = {
  date: string;
  dayOfMonth: number;
  dayOfWeek: number;
  isToday: boolean;
  boxKey: string | null;
  overridden: boolean;
};

export type CalendarWeek = {
  weekStart: string;
  weekLabel: string;
  isCurrentWeek: boolean;
  boxKey: string | null;
  note: string | null;
  days: CalendarDay[];
};

function envReady() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromYmd(s: string): Date {
  const [y, m, d] = s.split("-").map((p) => parseInt(p, 10));
  return new Date(y, m - 1, d);
}

function sundayOf(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  out.setDate(out.getDate() - out.getDay());
  return out;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatWeekLabel(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const sameMonth = weekStart.getMonth() === end.getMonth();
  const sameYear = weekStart.getFullYear() === end.getFullYear();
  const startStr = `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()}`;
  const endStr = sameMonth
    ? `${end.getDate()}`
    : `${MONTHS[end.getMonth()]} ${end.getDate()}`;
  const yearStr = sameYear ? weekStart.getFullYear() : end.getFullYear();
  return `${startStr} – ${endStr}, ${yearStr}`;
}

export function sundayOfYmd(date: string): string {
  return ymd(sundayOf(fromYmd(date)));
}

export function thisWeekStart(): string {
  return ymd(sundayOf(fromYmd(todayYmd())));
}

// Returns weeks from `weeksBefore` Sundays back through `weeksAfter` Sundays
// forward (inclusive of the current week).
export async function getCalendarRange(opts: {
  weeksBefore: number;
  weeksAfter: number;
}): Promise<CalendarWeek[]> {
  // "Today" is a calendar concept — fix it to the app timezone instead of
  // the server's UTC so the today-marker doesn't roll at UTC midnight.
  const today = todayYmd();
  const currentSunday = sundayOf(fromYmd(today));

  const firstSunday = new Date(currentSunday);
  firstSunday.setDate(firstSunday.getDate() - 7 * opts.weeksBefore);

  const totalWeeks = opts.weeksBefore + opts.weeksAfter + 1;

  const lastSunday = new Date(currentSunday);
  lastSunday.setDate(lastSunday.getDate() + 7 * opts.weeksAfter);
  const lastDayInclusive = new Date(lastSunday);
  lastDayInclusive.setDate(lastDayInclusive.getDate() + 6);

  const weekBoxByStart = new Map<string, string>();
  const weekNoteByStart = new Map<string, string>();
  const overrideByDate = new Map<string, string>();
  // Days with an override row whose box_key is NULL — i.e. "off, just this
  // day" even when the surrounding week has a project.
  const unassignedOverrideDates = new Set<string>();

  if (envReady()) {
    const sb = await supabaseServer();
    const firstYmd = ymd(firstSunday);
    const lastWeekYmd = ymd(lastSunday);
    const lastDayYmd = ymd(lastDayInclusive);

    const [{ data: weeks }, { data: overrides }] = await Promise.all([
      sb
        .from("calendar_week_assignments")
        .select("week_start, box_key, note")
        .gte("week_start", firstYmd)
        .lte("week_start", lastWeekYmd),
      sb
        .from("calendar_day_overrides")
        .select("date, box_key")
        .gte("date", firstYmd)
        .lte("date", lastDayYmd),
    ]);

    for (const w of weeks ?? []) {
      if (!w?.week_start) continue;
      if (w.box_key) weekBoxByStart.set(w.week_start, w.box_key);
      if (typeof w.note === "string" && w.note.length > 0) {
        weekNoteByStart.set(w.week_start, w.note);
      }
    }
    for (const o of overrides ?? []) {
      if (!o?.date) continue;
      if (o.box_key) overrideByDate.set(o.date, o.box_key);
      else unassignedOverrideDates.add(o.date);
    }
  }

  const out: CalendarWeek[] = [];
  for (let i = 0; i < totalWeeks; i++) {
    const ws = new Date(firstSunday);
    ws.setDate(ws.getDate() + 7 * i);
    const wsYmd = ymd(ws);
    const weekBox = weekBoxByStart.get(wsYmd) ?? null;
    const weekNote = weekNoteByStart.get(wsYmd) ?? null;

    const days: CalendarDay[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(ws);
      day.setDate(day.getDate() + d);
      const dYmd = ymd(day);
      const boxOverride = overrideByDate.get(dYmd) ?? null;
      const explicitlyUnassigned = unassignedOverrideDates.has(dYmd);
      const overridden = explicitlyUnassigned || boxOverride !== null;
      const boxKey = explicitlyUnassigned ? null : (boxOverride ?? weekBox);
      days.push({
        date: dYmd,
        dayOfMonth: day.getDate(),
        dayOfWeek: day.getDay(),
        isToday: dYmd === today,
        boxKey,
        overridden,
      });
    }

    out.push({
      weekStart: wsYmd,
      weekLabel: formatWeekLabel(ws),
      isCurrentWeek: wsYmd === ymd(currentSunday),
      boxKey: weekBox,
      note: weekNote,
      days,
    });
  }

  return out;
}
