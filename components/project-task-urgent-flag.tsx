"use client";
// ⚡ urgent toggle for a Project Tasks row. Looks and behaves exactly like
// the EditableFlag bolt on Maint Tasks, but writes through
// updateProjectTaskUrgent (project.tasks jsonb) since a project task isn't
// an Item.

import { useState, useTransition } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import { FlagIcon } from "./flag-icons";
import { updateProjectTaskUrgent } from "@/lib/plan-actions";

export function ProjectTaskUrgentFlag({
  projectId,
  taskId,
  initial,
  onChange,
}: {
  projectId: string;
  taskId: string;
  initial: boolean;
  /** Lets the row restyle itself (amber stripe) as soon as it's toggled. */
  onChange?: (urgent: boolean) => void;
}) {
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      title="Urgent"
      onClick={() => {
        const prev = on;
        const next = !on;
        setOn(next);
        onChange?.(next);
        startTransition(async () => {
          try {
            await updateProjectTaskUrgent(projectId, taskId, next);
          } catch (e: any) {
            setOn(prev);
            onChange?.(prev);
            toast.error(e?.message ?? "Couldn't update.");
          }
        });
      }}
      className={clsx(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-sm leading-none transition",
        on ? "text-amber-700" : "text-ink-mute/40 hover:text-ink-mute",
        pending && "opacity-50",
      )}
    >
      <FlagIcon kind="urgent" filled={on} />
    </button>
  );
}
