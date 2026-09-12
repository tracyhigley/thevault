"use client";
// Per-day building dropdown on the This Week page. Picking a building
// saves immediately (settings.week_buildings) via saveWeekBuilding, so the
// choice survives a reload — it's a fixed Sun–Sat template, not tied to
// any particular calendar week (see lib/week-days.ts).

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveWeekBuilding } from "@/lib/plan-actions";
import type { DayKey } from "@/lib/week-days";
import { Select } from "@/components/ui";
import type { Building } from "@/lib/categories";

export function WeekBuildingPicker({
  day,
  buildings,
  initial,
}: {
  day: DayKey;
  buildings: Building[];
  initial: string | null;
}) {
  const [value, setValue] = useState<string>(initial ?? "");
  const [pending, startTransition] = useTransition();

  function onChange(next: string) {
    const prev = value;
    setValue(next);
    startTransition(async () => {
      try {
        await saveWeekBuilding(day, next || null);
      } catch (e: any) {
        setValue(prev);
        toast.error(e?.message ?? "Couldn't save that building.");
      }
    });
  }

  return (
    <Select
      value={value}
      disabled={pending}
      onChange={(e) => onChange(e.target.value)}
      className="w-full disabled:opacity-50"
    >
      <option value="">— choose a building —</option>
      {buildings.map((b) => (
        <option key={b.key} value={b.key}>
          {b.label}
        </option>
      ))}
    </Select>
  );
}
