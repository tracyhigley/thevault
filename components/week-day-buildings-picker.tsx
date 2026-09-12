"use client";
// Multi-select building picker for one day on the This Week page — Tracy
// can now pick more than one building per day (was a single dropdown).
// Each choice shows that building's own color dot so the picker itself is
// color-coded, matching the day's building blocks below it.

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveWeekBuildings } from "@/lib/plan-actions";
import type { DayKey } from "@/lib/week-days";
import type { Building } from "@/lib/categories";

export function WeekDayBuildingsPicker({
  day,
  buildings,
  initialSelected,
}: {
  day: DayKey;
  buildings: Building[];
  initialSelected: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelected),
  );
  const [pending, startTransition] = useTransition();

  function toggle(key: string, checked: boolean) {
    const prev = selected;
    const next = new Set(prev);
    if (checked) next.add(key);
    else next.delete(key);
    setSelected(next);
    startTransition(async () => {
      try {
        await saveWeekBuildings(day, Array.from(next));
      } catch (e: any) {
        setSelected(prev);
        toast.error(e?.message ?? "Couldn't save that.");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3">
      {buildings.map((b) => (
        <label
          key={b.key}
          className="flex cursor-pointer items-center gap-2.5 text-[16px] text-ink-dim"
        >
          <input
            type="checkbox"
            className="h-5 w-5 shrink-0"
            style={{ accentColor: b.color ?? "#b5853a" }}
            checked={selected.has(b.key)}
            disabled={pending}
            onChange={(e) => toggle(b.key, e.target.checked)}
          />
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ background: b.color ?? "#b5853a" }}
            aria-hidden
          />
          {b.label}
        </label>
      ))}
    </div>
  );
}
