"use client";
// Inline-editable minutes estimate for a Project Tasks row. Same look and
// feel as the numeric EditableText field on Maint Tasks, but writes through
// updateProjectTaskMinutes (project.tasks jsonb) instead of items.

import { useState, useTransition } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import { updateProjectTaskMinutes } from "@/lib/plan-actions";

export function EditableProjectTaskMinutes({
  projectId,
  taskId,
  initial,
}: {
  projectId: string;
  taskId: string;
  initial: number | null;
}) {
  const [value, setValue] = useState(initial ?? "");
  const [pending, startTransition] = useTransition();

  function commit() {
    if (String(value) === String(initial ?? "")) return;
    const next = value === "" ? null : Number(value);
    startTransition(async () => {
      try {
        await updateProjectTaskMinutes(projectId, taskId, next);
      } catch (e: any) {
        setValue(initial ?? "");
        toast.error(e?.message ?? "Couldn't update minutes.");
      }
    });
  }

  return (
    <input
      value={value as any}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setValue(initial ?? "");
      }}
      type="number"
      placeholder="—"
      className={clsx(
        "focus:bg-paper-bg/40 focus:ring-brass/40 w-16 max-w-[4.5rem] min-w-[3.25rem] rounded-sm bg-transparent px-0 text-right text-[11px] tabular-nums outline-none focus:ring-1",
        pending && "opacity-50",
      )}
    />
  );
}
