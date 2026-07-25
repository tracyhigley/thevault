"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import type { Box } from "@/lib/categories";
import type { CalendarWeek } from "@/lib/calendar-planning";
import {
  setWeekProject,
  setDayProject,
  clearDayOverride,
  setDayUnassigned,
  setWeekNote,
} from "@/lib/calendar-planning-actions";
import {
  CalendarWeekRow,
  type DayChange,
} from "@/components/calendar-week-row";
import { CalendarCounts } from "@/components/calendar-counts";

// We pre-compute weeks server-side and pass them in. Locally we apply
// optimistic updates to the same array; the server actions then revalidate
// the page, which refreshes initialWeeks on the next navigation. If a
// server write fails we revert and toast.

export function CalendarBoard({
  initialWeeks,
  boxes,
}: {
  initialWeeks: CalendarWeek[];
  boxes: Box[];
}) {
  const [weeks, setWeeks] = useState<CalendarWeek[]>(initialWeeks);
  const [, startTransition] = useTransition();
  const todayCellRef = useRef<HTMLElement | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [showPast, setShowPast] = useState(false);

  // Keep local state in sync with fresh server data (e.g. after a route
  // refresh that pulls a new initialWeeks).
  useEffect(() => {
    setWeeks(initialWeeks);
  }, [initialWeeks]);

  // Scroll today into view on first paint, and any time past weeks are
  // toggled (so the current week stays roughly anchored under the toggle).
  useEffect(() => {
    if (scrolled && !showPast) return;
    if (todayCellRef.current) {
      todayCellRef.current.scrollIntoView({
        block: showPast ? "center" : "start",
        behavior: scrolled ? "smooth" : "auto",
      });
      setScrolled(true);
    }
  }, [scrolled, showPast]);

  // Split into past vs current+future. If today's week isn't found (defensive,
  // e.g. fixture mode), treat everything as future.
  const currentIdx = weeks.findIndex((w) => w.isCurrentWeek);
  const pastWeeks = currentIdx > 0 ? weeks.slice(0, currentIdx) : [];
  const futureWeeks = currentIdx >= 0 ? weeks.slice(currentIdx) : weeks;
  const visibleWeeks =
    currentIdx >= 0 ? (showPast ? weeks : futureWeeks) : weeks;

  function updateWeekLocal(weekStart: string, boxKey: string | null) {
    setWeeks((prev) =>
      prev.map((w) => {
        if (w.weekStart !== weekStart) return w;
        const newDays = w.days.map((d) => ({
          ...d,
          boxKey: d.overridden ? d.boxKey : boxKey,
        }));
        return { ...w, boxKey, days: newDays };
      }),
    );
  }

  function updateDayLocal(date: string, action: DayChange) {
    setWeeks((prev) =>
      prev.map((w) => {
        if (!w.days.some((d) => d.date === date)) return w;
        const newDays = w.days.map((d) => {
          if (d.date !== date) return d;
          if (action.kind === "inherit") {
            return { ...d, overridden: false, boxKey: w.boxKey };
          }
          if (action.kind === "unassigned") {
            return { ...d, overridden: true, boxKey: null };
          }
          return { ...d, overridden: true, boxKey: action.boxKey };
        });
        return { ...w, days: newDays };
      }),
    );
  }

  function onSetWeek(weekStart: string, boxKey: string | null) {
    const snapshot = weeks;
    updateWeekLocal(weekStart, boxKey);
    startTransition(async () => {
      try {
        await setWeekProject(weekStart, boxKey);
      } catch (e: unknown) {
        setWeeks(snapshot);
        toast.error(
          e instanceof Error && e.message
            ? `Couldn't save: ${e.message}`
            : "Couldn't save week.",
        );
      }
    });
  }

  function onSetDay(date: string, action: DayChange) {
    const snapshot = weeks;
    updateDayLocal(date, action);
    startTransition(async () => {
      try {
        if (action.kind === "inherit") await clearDayOverride(date);
        else if (action.kind === "unassigned") await setDayUnassigned(date);
        else await setDayProject(date, action.boxKey);
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
          You haven&apos;t set up any buildings yet — those are the projects you
          can block out weeks for.
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
        weeks={futureWeeks}
        boxes={boxes}
        heading={`FROM THIS WEEK FORWARD (${futureWeeks.length} weeks shown)`}
      />
      {pastWeeks.length > 0 && (
        <button
          type="button"
          onClick={() => setShowPast((v) => !v)}
          className="border-paper-line bg-paper-panel/20 text-ink-mute hover:border-brass/40 hover:text-brass block w-full rounded-sm border border-dashed px-3 py-2 font-mono text-[10px] tracking-[0.18em]"
        >
          {showPast
            ? `▴  HIDE EARLIER WEEKS (${pastWeeks.length})`
            : `◂  SHOW EARLIER WEEKS (${pastWeeks.length})`}
        </button>
      )}
      {showPast && pastWeeks.length > 0 && (
        <CalendarCounts
          weeks={pastWeeks}
          boxes={boxes}
          assignedOnly
          heading={`EARLIER WEEKS (${pastWeeks.length} weeks shown)`}
        />
      )}
      {visibleWeeks.map((w) => (
        <CalendarWeekRow
          key={w.weekStart}
          week={w}
          boxes={boxes}
          todayRef={
            w.isCurrentWeek
              ? (el) => {
                  todayCellRef.current = el;
                }
              : undefined
          }
          onSetWeek={(boxKey) => onSetWeek(w.weekStart, boxKey)}
          onSetDay={onSetDay}
          onSetNote={(note) => onSetNote(w.weekStart, note)}
        />
      ))}
    </div>
  );
}
