"use client";
// "On today's plan" toggle for a Project Tasks row. Mirrors TodayToggle
// (Maint Tasks) visually and behaviorally, but goes through the
// Project-Tasks-specific actions since there's no existing Item to flip a
// flag on — the first click creates one (linked via source_project_id /
// source_task_id), the second click removes it again.

import { useState, useTransition } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import {
  addProjectTaskToToday,
  removeProjectTaskFromToday,
} from "@/lib/plan-actions";

export function ProjectTaskTodayToggle({
  projectId,
  taskId,
  text,
  minutes,
  on: initial,
  size = "md",
}: {
  projectId: string;
  taskId: string;
  text: string;
  minutes: number | null;
  on: boolean;
  size?: "sm" | "md";
}) {
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => {
        const next = !on;
        setOn(next);
        startTransition(async () => {
          try {
            if (next) {
              await addProjectTaskToToday(projectId, taskId, text, minutes);
              toast.success("Added to today.");
            } else {
              await removeProjectTaskFromToday(projectId, taskId);
              toast.success("Removed from today.");
            }
          } catch (e: any) {
            setOn(!next);
            toast.error(e?.message ?? "Couldn't update.");
          }
        });
      }}
      disabled={pending}
      className={clsx(
        "shrink-0 rounded-sm border font-mono tracking-wider whitespace-nowrap transition",
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
