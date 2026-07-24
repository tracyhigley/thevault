"use client";
// One task row on the Project Tasks page. "Done" marks the task done (it
// shows struck through back on the project's own checklist) and takes it
// off this page — the task itself isn't deleted, so nothing gets lost.

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { markProjectTaskDone } from "@/lib/plan-actions";

export function ProjectTaskRollupItem({
  projectId,
  taskId,
  text,
  projectTitle,
  projectHref,
}: {
  projectId: string;
  taskId: string;
  text: string;
  projectTitle: string;
  projectHref: string;
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
    <div className="flex items-start justify-between gap-3 py-2 text-[13px]">
      <div className="min-w-0">
        <div className="text-ink">{text}</div>
        <Link
          href={projectHref}
          className="text-ink-mute hover:text-brass mt-0.5 inline-block font-mono text-[10px] tracking-[0.12em]"
        >
          {projectTitle.toUpperCase()}
        </Link>
      </div>
      <button
        onClick={done}
        disabled={pending}
        className="border-paper-line text-ink-mute hover:border-brass/40 hover:text-brass shrink-0 rounded-sm border px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] transition disabled:opacity-50"
      >
        DONE
      </button>
    </div>
  );
}
