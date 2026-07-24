"use client";
// One task row on the Project Tasks page. "Done" marks the task done (it
// shows struck through back on the project's own checklist) and takes it
// off this page — the task itself isn't deleted, so nothing gets lost.
//
// Row chrome deliberately matches the Admin Tasks row (`CounterRow`): same
// bordered card, same title treatment, same Done button styling. The project
// this task came from isn't shown here — the building header above already
// gives the grouping that matters on this page.

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { markProjectTaskDone } from "@/lib/plan-actions";

export function ProjectTaskRollupItem({
  projectId,
  taskId,
  text,
}: {
  projectId: string;
  taskId: string;
  text: string;
}) {
  const [hidden, setHidden] = useState(false);
  const [pending, startTransition] = useTransition();

  if (hidden) return null;

  function done() {
    setHidden(true);
    startTransition(async () => {
      try {
        await markProjectTaskDone(projectId, taskId);
      } catch (e: any) {
        setHidden(false);
        toast.error(e?.message ?? "Couldn't update the task.");
      }
    });
  }

  return (
    <div className="border-paper-line/60 bg-paper-panel/40 flex min-w-0 items-center gap-3 rounded-sm border px-3 py-2 transition">
      <span className="paper-task-title text-ink min-w-0 flex-1 truncate">
        {text}
      </span>
      <button
        type="button"
        onClick={done}
        disabled={pending}
        className="shrink-0 rounded-sm border border-emerald-600/35 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-emerald-700 transition hover:bg-emerald-600/10 hover:text-emerald-800 disabled:opacity-40"
      >
        Done
      </button>
    </div>
  );
}
