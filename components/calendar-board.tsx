"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import type { Box } from "@/lib/categories";
import type { CalendarWeek } from "@/lib/calendar-planning";
import { setDayPlan, setWeekNote } from "@/lib/calendar-planning-actions";
import {
  normalizeDayPlan,
  type CalendarProjectOption,
  type DayPlan,
} from "@/lib/calendar-day-plan";
import { CalendarWeekRow } from "@/components/calendar-week-row";
import { CalendarCounts } from "@/components/calendar-counts";

// We pre-compute weeks server-side and pass them in. Locally we apply
// optimistic updates to the same array; the server actions then revalidate
// the page, which refreshes initialWeeks on the next navigation. If a
// server write fails we revert and toast.

export function CalendarBoard({
  initialWeeks,
  boxes,
  projects,
}: {
  initialWeeks: CalendarWeek[];
  boxes: Box[];
  projects: CalendarProjectOption[];
}) {
  const [weeks, setWeeks] = useState<CalendarWeek[]>(initialWeeks);
  const [, startTransition] = useTransition();
  // Keep local state in sync with fresh server data (e.g. after a route
  // refresh that pulls a new initialWeeks).
  useEffect(() => {
    setWeeks(initialWeeks);
  }, [initialWeeks]);

  function updateDayLocal(date: string, plan: DayPlan) {
    const next = normalizeDayPlan(plan);
    setWeeks((prev) =>
      prev.map((w) => {
        if (!w.days.some((d) => d.date === date)) return w;
        return {
          ...w,
          days: w.days.map((d) => (d.date === date ? { ...d, ...next } : d)),
        };
      }),
    );
  }

  function onSetDay(date: string, plan: DayPlan) {
    const snapshot = weeks;
    updateDayLocal(date, plan);
    startTransition(async () => {
      try {
        await setDayPlan(date, plan);
      } catch (e: unknown) {
        setWeeks(snapshot);
        toast.error(
          e instanceof Error && e.message
            ? `Couldn't save: ${e.message}`
            : "Couldn't save day.",
        );
      }
    });
  }

  function updateNoteLocal(weekStart: string, note: string | null) {
    setWeeks((prev) =>
      prev.map((w) => (w.weekStart === weekStart ? { ...w, note } : w)),
    );
  }

  function onSetNote(weekStart: string, note: string | null) {
    const snapshot = weeks;
    updateNoteLocal(weekStart, note);
    startTransition(async () => {
      try {
        await setWeekNote(weekStart, note);
      } catch (e: unknown) {
        setWeeks(snapshot);
        toast.error(
          e instanceof Error && e.message
            ? `Couldn't save: ${e.message}`
            : "Couldn't save note.",
        );
      }
    });
  }

  if (boxes.length === 0) {
    return (
      <div className="border-paper-line bg-paper-panel/40 mt-8 rounded-sm border border-dashed p-6 text-center">
        <p className="text-ink-dim">
          You haven&apos;t set up any buildings yet — those are what you plan
          each day around.
        </p>
        <a
          href="/settings/buildings"
          className="border-brass/40 text-brass hover:border-brass mt-3 inline-block rounded-sm border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em]"
        >
          + ADD BUILDINGS
        </a>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <CalendarCounts
        weeks={weeks}
        boxes={boxes}
        heading={`FROM THIS WEEK FORWARD (${weeks.length} weeks shown)`}
      />
      {weeks.map((w) => (
        <CalendarWeekRow
          key={w.weekStart}
          week={w}
          boxes={boxes}
          projects={projects}
          onSetDay={onSetDay}
          onSetNote={(note) => onSetNote(w.weekStart, note)}
        />
      ))}
    </div>
  );
}
