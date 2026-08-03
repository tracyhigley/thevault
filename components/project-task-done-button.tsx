"use client";
// "Done" button on a Project Tasks row. Marks the task done (shown struck
// through back on the project's own checklist) and takes it off this page
// — the task itself isn't deleted. Visually matches CounterDoneButton on
// Maint Tasks. Hides optimistically and rolls back on failure.

import { useTransition } from "react";
import { toast } from "sonner";
import { markProjectTaskDone } from "@/lib/plan-actions";

export function ProjectTaskDoneButton({
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
      aria-label="Mark done"
      title="Done"
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onHide();
        startTransition(async () => {
          try {
            await markProjectTaskDone(projectId, taskId);
          } catch (e: any) {
            onFail();
            toast.error(e?.message ?? "Couldn't update the task.");
          }
        });
      }}
      className="shrink-0 rounded-sm border border-emerald-600/35 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-emerald-700 transition hover:bg-emerald-600/10 hover:text-emerald-800 disabled:opacity-40"
    >
      Done
    </button>
  );
}
