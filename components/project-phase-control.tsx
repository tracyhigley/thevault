"use client";
// The phase stepper on a project's title block. Always shows all four
// phases so progress is oriented without dates or deadlines.

import { useTransition } from "react";
import { toast } from "sonner";
import clsx from "clsx";
import { setProjectPhase } from "@/lib/plan-actions";
import { PHASES, type ProjectPhase } from "@/lib/project-phases";

export function ProjectPhaseControl({
  projectId,
  phase,
}: {
  projectId: string;
  phase: ProjectPhase;
}) {
  const [pending, startTransition] = useTransition();

  function move(next: ProjectPhase) {
    if (next === phase) return;
    startTransition(async () => {
      try {
        await setProjectPhase(projectId, next);
        if (next === "complete") {
          toast.success("Certificate of occupancy issued.");
        }
      } catch (e: any) {
        toast.error(e?.message ?? "Couldn't change the phase.");
      }
    });
  }

  return (
    <div
      className={clsx(
        "flex flex-wrap items-center gap-1",
        pending && "opacity-50",
      )}
    >
      {PHASES.map((p, i) => (
        <span key={p.key} className="flex items-center gap-1">
          {i > 0 ? <span className="text-[11px] text-ink-mute/50">→</span> : null}
          <button
            onClick={() => move(p.key)}
            disabled={pending}
            className={clsx(
              "rounded-sm border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] transition",
              p.key === phase
                ? "border-brass bg-brass/10 text-brass"
                : "border-transparent text-ink-mute hover:border-paper-line hover:text-ink",
            )}
          >
            {p.label}
          </button>
        </span>
      ))}
    </div>
  );
}
