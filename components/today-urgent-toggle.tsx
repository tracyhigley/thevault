"use client";

// Small ⚡ button on each Today row, sitting next to the evening moon.
// Filled/amber when the task is urgent — whether that was set here, on
// Maint Tasks, or on Project Tasks — and tapping it flips the flag
// everywhere (see setItemUrgent).

import { useState, useTransition } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import { setItemUrgent } from "@/lib/actions";
import { UrgentIcon } from "./flag-icons";

export function TodayUrgentToggle({
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
      title={on ? "Urgent — click to unmark" : "Mark as urgent"}
      aria-label={on ? "Unmark urgent" : "Mark as urgent"}
      aria-pressed={on}
      disabled={pending}
      onClick={() => {
        const next = !on;
        setOn(next);
        startTransition(async () => {
          try {
            await setItemUrgent(itemId, next);
          } catch (e: any) {
            setOn(!next);
            toast.error(e?.message ?? "Couldn't save.");
          }
        });
      }}
      className={clsx(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border leading-none transition disabled:opacity-60",
        on
          ? "border-amber-500 bg-amber-500/20 text-amber-700"
          : "border-paper-line/60 text-ink-mute/50 hover:border-amber-400 hover:text-amber-600",
      )}
    >
      <UrgentIcon filled={on} size={12} />
    </button>
  );
}
