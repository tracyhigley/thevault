"use client";

// Round "mark done" radio for a Project Task row on the Today page's
// Currently Under Construction card — same look as TodayDoneToggle on the
// maintenance cards, but writes straight to the project's checklist via
// markProjectTaskDone (struck through on the plan, unchecked). The page
// revalidates, so the next checked task on that project slides in.

import { useState, useTransition } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import { markProjectTaskDone } from "@/lib/plan-actions";

export function ProjectTaskDoneToggle({
  projectId,
  taskId,
}: {
  projectId: string;
  taskId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const disabled = pending || Date.now() < cooldownUntil;

  return (
    <button
      type="button"
      title="Mark done"
      aria-label="Mark done"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        setCooldownUntil(Date.now() + 700);
        startTransition(async () => {
          try {
            await markProjectTaskDone(projectId, taskId);
            toast.success("Done — struck through on the Project Plan.");
          } catch (e: any) {
            toast.error(e?.message ?? "Couldn't mark done.");
          }
        });
      }}
      className={clsx(
        "h-5 w-5 shrink-0 rounded-full border transition disabled:cursor-not-allowed disabled:opacity-60",
        "border-brass/40 hover:border-brass",
      )}
    />
  );
}
