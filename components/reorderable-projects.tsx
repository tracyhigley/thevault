"use client";
// Drag-orderable project cards for the Under Construction page. Mirrors
// AtmCategorySortableList: takes plain data (not JSX) from the server
// component, builds the card markup here, and wires SortableList's
// onReorder to reorderActiveProjects.

import Link from "next/link";
import { SortableList, type SortableItem } from "@/components/sortable-list";
import { reorderActiveProjects } from "@/lib/plan-actions";

export type ReorderableProject = {
  id: string;
  title: string;
  buildingLabel: string;
  lastLogDate: string | null;
  doneLooksLike: string | null;
  currentTasks: { id: string; text: string }[];
};

export function ReorderableProjects({
  projects,
}: {
  projects: ReorderableProject[];
}) {
  const items: SortableItem[] = projects.map((p) => ({
    id: p.id,
    content: (
      <Link
        href={`/project-plans/project/${p.id}`}
        className="block rounded-sm border border-paper-line border-l-[3px] border-l-brass bg-paper-panel px-4 py-3 transition hover:border-brass/60"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="paper-task-title text-ink">{p.title}</span>
          <span className="font-mono text-[10px] text-ink-mute">
            {p.buildingLabel.toUpperCase()}
            {p.lastLogDate ? ` · last note ${p.lastLogDate}` : ""}
          </span>
        </div>
        {p.doneLooksLike ? (
          <div className="mt-1 text-[12px] text-ink-dim">
            Done looks like: {p.doneLooksLike}
          </div>
        ) : null}
        {p.currentTasks.length > 0 ? (
          <div className="mt-2">
            <div className="font-mono text-[9px] tracking-[0.2em] text-red-500">
              CURRENT TASKS:
            </div>
            <ul className="mt-1 space-y-0.5">
              {p.currentTasks.map((t) => (
                <li key={t.id} className="text-[12px] text-ink-dim">
                  {t.text}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Link>
    ),
  }));

  return (
    <SortableList
      items={items}
      onReorder={async (orderedItems) => {
        await reorderActiveProjects(orderedItems.map((i) => i.id));
      }}
    />
  );
}
