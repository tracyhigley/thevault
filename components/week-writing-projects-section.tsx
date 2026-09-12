"use client";
// "This Week's Writing Project(s)" — sits above the day grid on the This
// Week page. Multi-select checkboxes over The Library's under-construction
// projects; whatever's checked is immediately shown below as a PROJECT /
// FIRST TASK card (same format as the day grid's cards), and saved
// (settings.week_writing_projects) so it survives a reload. Optimistic
// like WeekBuildingPicker — local state updates first, server action
// confirms in the background.

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveWeekWritingProjects } from "@/lib/plan-actions";

type LibraryProject = { id: string; title: string; firstTask: string | null };

export function WeekWritingProjectsSection({
  projects,
  initialSelectedIds,
}: {
  projects: LibraryProject[];
  initialSelectedIds: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelectedIds),
  );
  const [pending, startTransition] = useTransition();

  function toggle(id: string, checked: boolean) {
    const prev = selected;
    const next = new Set(prev);
    if (checked) next.add(id);
    else next.delete(id);
    setSelected(next);
    startTransition(async () => {
      try {
        await saveWeekWritingProjects(Array.from(next));
      } catch (e: any) {
        setSelected(prev);
        toast.error(e?.message ?? "Couldn't save that.");
      }
    });
  }

  if (projects.length === 0) {
    return (
      <p className="text-[12px] text-ink-mute">
        No projects under construction in The Library right now.
      </p>
    );
  }

  const selectedProjects = projects.filter((p) => selected.has(p.id));

  return (
    <div>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {projects.map((p) => (
          <label
            key={p.id}
            className="flex items-center gap-2 text-[13px] text-ink-dim"
          >
            <input
              type="checkbox"
              className="accent-brass"
              checked={selected.has(p.id)}
              disabled={pending}
              onChange={(e) => toggle(p.id, e.target.checked)}
            />
            {p.title}
          </label>
        ))}
      </div>

      {selectedProjects.length > 0 && (
        <div className="mt-3 space-y-2.5">
          {selectedProjects.map((p) => (
            <div
              key={p.id}
              className="rounded-sm border border-brass/40 bg-paper-bg/30 px-3 py-2"
            >
              <div className="font-mono text-[10px] tracking-[0.14em] text-brass">
                PROJECT: <span className="text-ink">{p.title}</span>
              </div>
              <div className="mt-1 font-mono text-[10px] tracking-[0.14em] text-ink-mute">
                FIRST TASK:{" "}
                <span className="text-ink-dim">
                  {p.firstTask ?? "(no tasks yet)"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
