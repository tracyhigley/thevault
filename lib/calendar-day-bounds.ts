import { addDays, format, parse } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

/** Start/end of a calendar day in `tz`, as UTC `Date` values for the Calendar API. */
export function localDayBoundsUtc(ymd: string, tz: string): { start: Date; end: Date } {
  const base = parse(ymd, "yyyy-MM-dd", new Date());
  const dayStart = fromZonedTime(
    parse(`${ymd} 00:00:00`, "yyyy-MM-dd HH:mm:ss", base),
    tz,
  );
  const tomorrowYmd = format(addDays(base, 1), "yyyy-MM-dd");
  const nextDayStart = fromZonedTime(
    parse(`${tomorrowYmd} 00:00:00`, "yyyy-MM-dd HH:mm:ss", base),
    tz,
  );
  const end = new Date(nextDayStart.getTime() - 1);
  return { start: dayStart, end };
}

/** Today's date string (yyyy-MM-dd) in the given IANA timezone. */
export function todayYmdInTz(tz: string): string {
  return format(toZonedTime(new Date(), tz), "yyyy-MM-dd");
}

/** Any instant's calendar date (yyyy-MM-dd) in the given IANA timezone. */
export function ymdInTz(date: Date, tz: string): string {
  return format(toZonedTime(date, tz), "yyyy-MM-dd");
}
