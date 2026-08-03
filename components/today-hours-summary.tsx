"use client";

// "X hours out of Y hours left" — Y is live: hours remaining between now
// and the end-of-day time set in the Build Today wizard, ticking down as
// the day goes on (not the static hours-available figure from that
// wizard). Must run client-side — SSR is UTC and would skew end-of-day by
// the visitor's offset. Both numbers round to the nearest quarter hour.

import { useEffect, useState } from "react";
import { parseTimeOnDate } from "@/lib/daily-plan";
import { fmtQuarterHours } from "@/lib/format-hours";

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

  return (
    <p className="text-ink-dim mt-2 text-[16px]" suppressHydrationWarning>
      {hoursLeft === null
        ? " "
        : `${fmtQuarterHours(totalTodayMinutes / 60)} hours out of ${fmtQuarterHours(hoursLeft)} hours left.`}
    </p>
  );
}
