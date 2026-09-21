"use client";

import { useEffect, useState } from "react";
import { parseTimeOnDate } from "@/lib/daily-plan";

function fmt12Local(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function MaintStartHint({
  date,
  endOfDay,
  maintMinutes,
}: {
  date: string;
  endOfDay: string;
  maintMinutes: number;
}) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    if (maintMinutes <= 0) {
      setText(null);
      return;
    }
    try {
      const end = parseTimeOnDate(endOfDay, date);
      const startTime = new Date(end.getTime() - maintMinutes * 60_000);
      const now = new Date();
      if (startTime.getTime() <= now.getTime()) {
        setText("Begin Maint Tasks now.");
      } else {
        setText(`Begin Maint Tasks at ${fmt12Local(startTime)}.`);
      }
    } catch {
      setText(null);
    }
  }, [date, endOfDay, maintMinutes]);

  if (text === null) {
    return null;
  }

  return (
    <p className="text-ink-dim mt-1 w-0 min-w-full text-[14px] leading-snug">
      {text}
    </p>
  );
}
