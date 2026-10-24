"use client";

// Small sun button on each Currently Under Construction row on Today.
// Those rows are pulled in automatically (up to 3 checked tasks per
// project), so ☀ is how she says "I'm actually working on this one today."
// Only ☀ tasks count toward the hour totals at the top of the page. It's
// stored as today's date on the task, so it resets on its own each day.

import { useState, useTransition } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import { setProjectTaskToday } from "@/lib/plan-actions";

export function ProjectTaskSunToggle({
  projectId,
  taskId,
  initial,
}: {
  projectId: string;
  taskId: string;
  initial: boolean;
}) {
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      title={
        on ? "Working on this today — click to unmark" : "Work on this today"
      }
      aria-label={on ? "Unmark for today" : "Mark to work on today"}
      aria-pressed={on}
      disabled={pending}
      onClick={() => {
        const next = !on;
        setOn(next);
        startTransition(async () => {
          try {
            await setProjectTaskToday(projectId, taskId, next);
          } catch (e: any) {
            setOn(!next);
            toast.error(e?.message ?? "Couldn't save.");
          }
        });
      }}
      className={clsx(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[13px] leading-none transition disabled:opacity-60",
        on
          ? "border-orange-400 bg-orange-400/20 text-orange-600"
          : "border-paper-line/60 text-ink-mute/50 hover:border-orange-300 hover:text-orange-500",
      )}
    >
      {/* text-style sun (U+FE0E) so it matches the ☾, not an emoji */}
      {"\u2600\uFE0E"}
    </button>
  );
}
