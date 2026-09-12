"use client";
// "This Week's Writing Project(s)" — sits above the day grid on the This
// Week page. Multi-select checkboxes over The Library's under-construction
// projects; whatever's checked is immediately shown below as a PROJECT /
// TASKS card (same format as the day grid's cards — every task checked
// onto the Project Tasks page, not just the first one), color-coded to
// The Library's own settings.buildings color, and saved
// (settings.week_writing_projects) so it survives a reload. Optimistic —
// local state updates first, server action confirms in the background.

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveWeekWritingProjects } from "@/lib/plan-actions";

type LibraryProject = {
  id: string;
  title: string;
  tasks: { id: string; text: string }[];
};

export function WeekWritingProjectsSection({
  projects,
  initialSelectedIds,
  color = "#9a6b24",
}: {
  projects: LibraryProject[];
  initialSelectedIds: string[];
  /** The Library's settings.buildings color, for the checkboxes/cards. */
  color?: string;
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
      <p className="text-[15px] text-ink-mute">
        No projects under construction in The Library right now.
      </p>
    );
  }

  const selectedProjects = projects.filter((p) => selected.has(p.id));

  return (
    <div>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {projects.map((p) => (
          <label
            key={p.id}
            className="flex cursor-pointer items-center gap-2.5 text-[16px] text-ink-dim"
          >
            <input
              type="checkbox"
              className="h-5 w-5 shrink-0"
              style={{ accentColor: color }}
              checked={selected.has(p.id)}
              disabled={pending}
              onChange={(e) => toggle(p.id, e.target.checked)}
            />
            {p.title}
          </label>
        ))}
      </div>

      {selectedProjects.length > 0 && (
        <div className="mt-4 space-y-3">
          {selectedProjects.map((p) => (
            <div
              key={p.id}
              className="rounded-sm border px-4 py-3"
              style={{ borderColor: color, background: `${color}14` }}
            >
              <div
                className="font-mono text-[13px] tracking-[0.14em]"
                style={{ color }}
              >
                PROJECT: <span className="text-ink text-[15px]">{p.title}</span>
              </div>
              <div className="mt-1.5 font-mono text-[13px] tracking-[0.14em] text-ink-mute">
                TASKS:
              </div>
              {p.tasks.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {p.tasks.map((t) => (
                    <li key={t.id} className="text-ink-dim text-[15px]">
                      • {t.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-ink-dim text-[15px]">
                  (nothing pulled onto Project Tasks yet)
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
