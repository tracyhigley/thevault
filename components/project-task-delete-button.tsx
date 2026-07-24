"use client";
// Small red ✕ on a Project Tasks row — permanently removes the task from
// the project's checklist (and cleans up a linked Today item, if any).
// Visually and behaviorally matches DeleteItemButton on Admin Tasks. Hides
// optimistically and rolls back on failure.

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteProjectTask } from "@/lib/plan-actions";

export function ProjectTaskDeleteButton({
  projectId,
  taskId,
  onHide,
  onFail,
}: {
  projectId: string;
  taskId: string;
  onHide: () => void;
  onFail: () => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label="Delete task"
      title="Delete"
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("Delete this task? This can't be undone.")) return;
        onHide();
        startTransition(async () => {
          try {
            await deleteProjectTask(projectId, taskId);
          } catch (e: any) {
            onFail();
            toast.error(e?.message ?? "Couldn't delete the task.");
          }
        });
      }}
      className="shrink-0 rounded-sm px-1 py-0.5 font-mono text-[15px] leading-none text-red-600 transition hover:bg-red-500/10 hover:text-red-700 disabled:opacity-40"
    >
      ×
    </button>
  );
}
