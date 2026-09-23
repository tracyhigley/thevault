"use client";

// Small moon button on each Today row. Marking a task "evening" leaves it
// out of the "Begin Maint Tasks at…" calculation at the top of the page.

import { useState, useTransition } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import { setItemEvening } from "@/lib/actions";

export function TodayEveningToggle({
  itemId,
  initial,
}: {
  itemId: string;
  initial: boolean;
}) {
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      title={on ? "Evening task — click to unmark" : "Mark as an evening task"}
      aria-label={on ? "Unmark evening task" : "Mark as evening task"}
      aria-pressed={on}
      disabled={pending}
      onClick={() => {
        const next = !on;
        setOn(next);
        startTransition(async () => {
          try {
            await setItemEvening(itemId, next);
          } catch (e: any) {
            setOn(!next);
            toast.error(e?.message ?? "Couldn't save.");
          }
        });
      }}
      className={clsx(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[13px] leading-none transition disabled:opacity-60",
        on
          ? "border-indigo-400 bg-indigo-500/20 text-indigo-600"
          : "border-paper-line/60 text-ink-mute/50 hover:border-indigo-300 hover:text-indigo-500",
      )}
    >
      ☾
    </button>
  );
}
