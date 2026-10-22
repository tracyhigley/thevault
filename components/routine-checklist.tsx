"use client";

// The checklist for one routine (morning / lunch / evening) on one day.
// Scores at the top update the moment a box is ticked; each change saves
// the day's full list of checked items in the background.

import { useRef, useState } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import {
  ROUTINE_GROUPS,
  ROUTINE_ITEMS,
  scoreDay,
  type RoutineSlot,
} from "@/lib/routine";
import { saveRoutineDay } from "@/lib/routine-actions";
import { RoutineScoreTiles } from "./routine-score-tiles";

export function RoutineChecklist({
  date,
  slot,
  initialChecked,
}: {
  date: string;
  slot: RoutineSlot;
  initialChecked: string[];
}) {
  const [checked, setChecked] = useState(() => new Set(initialChecked));
  const [saving, setSaving] = useState(false);
  // Saves run one after another so a fast run of clicks can't land out of
  // order and leave an older list as the saved one.
  const queue = useRef<Promise<void>>(Promise.resolve());
  const lastSaved = useRef(new Set(initialChecked));

  function toggle(key: string) {
    const next = new Set(checked);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setChecked(next);
    setSaving(true);
    const list = Array.from(next);
    queue.current = queue.current.then(async () => {
      try {
        await saveRoutineDay(date, list);
        lastSaved.current = new Set(list);
      } catch (e: any) {
        setChecked(new Set(lastSaved.current));
        toast.error(e?.message ?? "Couldn't save.");
      } finally {
        setSaving(false);
      }
    });
  }

  const scores = scoreDay(checked);
  const groups = ROUTINE_GROUPS.map((g) => ({
    ...g,
    items: ROUTINE_ITEMS.filter((i) => i.group === g.key && i.slot === slot),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <RoutineScoreTiles scores={scores} />
      <p className="text-ink-mute mt-1 h-4 text-right font-mono text-[10px] tracking-wider">
        {saving ? "SAVING…" : "SCORES FOR THE WHOLE DAY SO FAR"}
      </p>

      <div className="mt-4 space-y-5">
        {groups.map((g) => (
          <section key={g.key}>
            <h2 className="text-ink-mute font-mono text-[11px] font-semibold tracking-[0.18em] uppercase">
              — {g.label} —
            </h2>
            <div className="mt-2 space-y-1.5">
              {g.items.map((item) => {
                const on = checked.has(item.key);
                return (
                  <label
                    key={item.key}
                    className={clsx(
                      "flex cursor-pointer items-center gap-3 rounded-sm border px-3 py-2.5 transition select-none",
                      on
                        ? "border-brass/50 bg-brass/10"
                        : "border-paper-line/60 bg-paper-panel/40 hover:border-brass/30",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(item.key)}
                      className="accent-brass h-4 w-4 shrink-0"
                    />
                    <span
                      className={clsx(
                        "min-w-0 flex-1 text-[14px]",
                        on ? "text-ink" : "text-ink-dim",
                      )}
                    >
                      {item.label}
                    </span>
                    <span className="text-ink-mute shrink-0 font-mono text-[11px] tabular-nums">
                      {item.points} pts
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
