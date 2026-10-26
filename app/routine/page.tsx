// Routine score-logging. One page for all three routines — Morning, Lunch
// and Evening — chosen by ?slot=, for any day chosen by ?date= (defaults
// to today; future dates aren't allowed). Below the checklist: average
// Food / Water / Movement / Restore scores over the last 7 and 30 days,
// counting only days that were actually logged.

import Link from "next/link";
import clsx from "clsx";
import { format, parse } from "date-fns";
import { todayYmd } from "@/lib/day-timezone";
import {
  ROUTINE_GROUPS,
  ROUTINE_SLOTS,
  addDaysYmd,
  averageScores,
  countUnloggedDays,
  isRoutineSlot,
  type RoutineSlot,
} from "@/lib/routine";
import {
  getFirstRoutineDate,
  getRoutineDay,
  getRoutineRange,
} from "@/lib/routine-data";
import { RoutineChecklist } from "@/components/routine-checklist";

function dateLabel(ymd: string): string {
  return format(parse(ymd, "yyyy-MM-dd", new Date()), "EEEE, MMMM d");
}

function href(slot: RoutineSlot, date: string, today: string) {
  return date === today
    ? `/routine?slot=${slot}`
    : `/routine?slot=${slot}&date=${date}`;
}

export default async function RoutinePage({
  searchParams,
}: {
  searchParams: Promise<{ slot?: string; date?: string }>;
}) {
  const sp = await searchParams;
  const today = todayYmd();
  const slot: RoutineSlot = isRoutineSlot(sp.slot) ? sp.slot : "morning";
  const date =
    sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) && sp.date <= today
      ? sp.date
      : today;
  const slotInfo = ROUTINE_SLOTS.find((s) => s.key === slot)!;

  const [checked, last30, firstLogged] = await Promise.all([
    getRoutineDay(date),
    getRoutineRange(addDaysYmd(today, -29), today),
    getFirstRoutineDate(),
  ]);
  const week = averageScores(
    last30.filter((d) => d.date >= addDaysYmd(today, -6)).map((d) => d.checked),
  );
  const month = averageScores(last30.map((d) => d.checked));
  const loggedDates = last30.map((d) => d.date);
  const weekSkipped = countUnloggedDays(loggedDates, today, 7, firstLogged);
  const monthSkipped = countUnloggedDays(loggedDates, today, 30, firstLogged);

  const prev = addDaysYmd(date, -1);
  const next = addDaysYmd(date, 1);

  return (
    <div className="mx-auto max-w-[640px] px-4 py-8 md:px-10">
      <div className="eyebrow">— Routine Log —</div>
      <h1 className="serif-h mt-2 text-[28px] leading-tight md:text-[34px]">
        {slotInfo.title}
      </h1>

      {/* Day picker — go back to log a day you missed. */}
      <div className="mt-3 flex items-center gap-3 font-mono text-[11px] tracking-wider">
        <Link
          href={href(slot, prev, today)}
          className="text-ink-mute hover:text-brass"
          aria-label="Previous day"
        >
          ← PREV
        </Link>
        <span className={clsx(date === today ? "text-ink" : "text-brass")}>
          {date === today ? "TODAY · " : ""}
          {dateLabel(date).toUpperCase()}
        </span>
        {date < today ? (
          <>
            <Link
              href={href(slot, next, today)}
              className="text-ink-mute hover:text-brass"
              aria-label="Next day"
            >
              NEXT →
            </Link>
            <Link
              href={href(slot, today, today)}
              className="text-ink-mute hover:text-brass"
            >
              BACK TO TODAY
            </Link>
          </>
        ) : null}
      </div>

      {/* Morning / Lunch / Evening tabs, keeping the chosen day. */}
      <div className="mt-4 flex gap-2">
        {ROUTINE_SLOTS.map((s) => (
          <Link
            key={s.key}
            href={href(s.key, date, today)}
            className={clsx(
              "rounded-sm border px-3 py-1 font-mono text-[10px] tracking-[0.16em] uppercase transition",
              s.key === slot
                ? "border-brass bg-brass/15 text-brass"
                : "border-paper-line text-ink-mute hover:border-brass/40 hover:text-brass",
            )}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <RoutineChecklist
          key={`${date}:${slot}`}
          date={date}
          slot={slot}
          initialChecked={checked}
        />
      </div>

      <div className="mt-10">
        <h2 className="serif-h text-ink text-[20px]">Averages</h2>
        <p className="text-ink-mute mt-1 text-[12px]">
          Only days you logged count.
        </p>
        <table className="mt-3 w-full border-collapse text-[14px]">
          <thead>
            <tr className="text-ink-mute font-mono text-[10px] tracking-[0.16em] uppercase">
              <th className="py-1 text-left font-normal"></th>
              <th className="py-1 text-right font-normal">Last 7 days</th>
              <th className="py-1 text-right font-normal">Last 30 days</th>
            </tr>
          </thead>
          <tbody>
            {ROUTINE_GROUPS.map((g) => (
              <tr key={g.key} className="border-paper-line/60 border-t">
                <td className="text-ink py-2">{g.label}</td>
                <td className="text-ink py-2 text-right font-mono tabular-nums">
                  {week.scores ? week.scores[g.key] : "—"}
                </td>
                <td className="text-ink py-2 text-right font-mono tabular-nums">
                  {month.scores ? month.scores[g.key] : "—"}
                </td>
              </tr>
            ))}
            <tr className="border-paper-line/60 text-ink-mute border-t font-mono text-[11px]">
              <td className="py-2">Days logged</td>
              <td className="py-2 text-right tabular-nums">{week.days}</td>
              <td className="py-2 text-right tabular-nums">{month.days}</td>
            </tr>
            <tr className="border-paper-line/60 text-ink-mute border-t font-mono text-[11px]">
              <td className="py-2">Days not logged</td>
              <td className="py-2 text-right tabular-nums">{weekSkipped}</td>
              <td className="py-2 text-right tabular-nums">{monthSkipped}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
