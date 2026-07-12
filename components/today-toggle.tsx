"use client";

// "On today's plan" opt-in toggle. Used on Admin Tasks rows and in the
// wizard's "What's heavy" review.
//
// Default off. Click once → today_order set → row is included in
// today's schedule. Click again → today_order cleared.

import { useState, useTransition } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import { setTodayPlan } from "@/lib/actions";

export function TodayToggle({
  itemId,
  on: initial,
  size = "md",
}: {
  itemId: string;
  on: boolean;
  size?: "sm" | "md";
}) {
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => {
        const next = !on;
        setOn(next);
        startTransition(async () => {
          try {
            await setTodayPlan(itemId, next);
            toast.success(next ? "Added to today." : "Removed from today.");
          } catch (e: any) {
            setOn(!next);
            toast.error(e?.message ?? "Couldn't update.");
          }
        });
      }}
      className={clsx(
        "shrink-0 whitespace-nowrap rounded-sm border font-mono tracking-wider transition",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-[10px]",
        on
          ? "border-brass bg-brass/15 text-brass"
          : "border-paper-line text-ink-mute hover:border-brass/40 hover:text-brass",
        pending && "opacity-60",
      )}
      title={on ? "On today's plan" : "Add to today's plan"}
    >
      {on ? "✓ TODAY" : "+ TODAY"}
    </button>
  );
}
