"use client";

// "X hours out of Y hours left" — Y is live: hours remaining between now
// and the end-of-day time set in the Build Today wizard, ticking down as
// the day goes on (not the static hours-available figure from that
// wizard). Must run client-side — SSR is UTC and would skew end-of-day by
// the visitor's offset. Both numbers round to the nearest quarter hour.
//
// Text color signals the balance: red once task hours exceed hours left,
// green once hours left exceeds task hours, default (ink) when exactly
// equal. Compared using the same rounded quarter-hour values shown on
// screen, so the color never disagrees with the numbers next to it.

import { useEffect, useState } from "react";
import clsx from "clsx";
import { parseTimeOnDate } from "@/lib/daily-plan";
import { fmtQuarterHours } from "@/lib/format-hours";

function roundToQuarter(hours: number): number {
  return Math.round(Math.max(0, hours) * 4) / 4;
}

export function TodayHoursSummary({
  date,
  endOfDay,
  totalTodayMinutes,
}: {
  date: string;
  endOfDay: string;
  totalTodayMinutes: number;
}) {
  const [hoursLeft, setHoursLeft] = useState<number | null>(null);

  useEffect(() => {
    function tick() {
      const end = parseTimeOnDate(endOfDay, date);
      const remainingMs = end.getTime() - Date.now();
      setHoursLeft(remainingMs / 3_600_000);
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [date, endOfDay]);

  const taskHours = roundToQuarter(totalTodayMinutes / 60);
  const availableHours = hoursLeft === null ? null : roundToQuarter(hoursLeft);
  const colorClass =
    availableHours === null
      ? "text-ink-dim"
      : taskHours > availableHours
        ? "text-rust"
        : availableHours > taskHours
          ? "text-emerald-600"
          : "text-ink-dim";

  return (
    <p
      className={clsx("mt-2 text-[16px]", colorClass)}
      suppressHydrationWarning
    >
      {hoursLeft === null
        ? " "
        : `${fmtQuarterHours(totalTodayMinutes / 60)} hours out of ${fmtQuarterHours(hoursLeft)} hours left.`}
    </p>
  );
}
