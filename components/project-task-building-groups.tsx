"use client";
// Building-grouped, drag-orderable project cards for the Project Tasks
// page. Same pattern as Maint Tasks' CounterSectionedLists — one
// independent SortableList per building section (so a card can be
// reordered within its building but never dragged into another one,
// since the building itself is set on the project, not by drag order) —
// merged back into a single flat order for reorderProjectTaskGroups,
// which persists task_group_order by array position.

import { useEffect, useState, useTransition } from "react";
import clsx from "clsx";
import { SortableList, type SortableItem } from "@/components/sortable-list";
import { reorderProjectTaskGroups } from "@/lib/plan-actions";
import { ProjectTaskGroupCard } from "@/components/project-task-group-card";

export type ProjectTaskCard = {
  projectId: string;
  projectTitle: string;
  tasks: {
    taskId: string;
    text: string;
    minutes: number | null;
    onToday: boolean;
  }[];
};

export type ProjectTaskBuildingSection = {
  /** Building key (or a fallback key for stray/unassigned buildings). */
  key: string;
  title: string;
  /** Building's assigned color (hex), if any — tints the section heading. */
  color?: string;
  cards: ProjectTaskCard[];
};

function mergeIds(sections: ProjectTaskBuildingSection[]) {
  return sections.flatMap((s) => s.cards.map((c) => c.projectId));
}

export function ProjectTaskBuildingGroups({
  sections: initialSections,
}: {
  sections: ProjectTaskBuildingSection[];
}) {
  const [sections, setSections] = useState(initialSections);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setSections(initialSections);
  }, [initialSections]);

  function handleSectionReorder(
    sectionKey: string,
    nextItems: SortableItem[],
  ) {
    const order = nextItems.map((i) => i.id);
    let fullIds: string[] = [];
    setSections((prev) => {
      const nextSections = prev.map((s) => {
        if (s.key !== sectionKey) return s;
        const byId = new Map(s.cards.map((c) => [c.projectId, c]));
        const cards = order
          .map((id) => byId.get(id))
          .filter((c): c is ProjectTaskCard => c != null);
        return { ...s, cards };
      });
      fullIds = mergeIds(nextSections);
      return nextSections;
    });
    startTransition(async () => {
      await reorderProjectTaskGroups(fullIds);
    });
  }

  if (sections.length === 0) return null;

  return (
    <div className="space-y-8">
      {sections.map((s) => (
        <section key={s.key} aria-labelledby={`project-tasks-section-${s.key}`}>
          <h2
            id={`project-tasks-section-${s.key}`}
            className={clsx(
              "font-mono text-[14px] font-semibold tracking-[0.16em] uppercase",
              !s.color && "text-ink-mute",
            )}
            style={s.color ? { color: s.color } : undefined}
          >
            — {s.title} —
          </h2>
          <div className="mt-3">
            <SortableList
              items={s.cards.map(
                (c): SortableItem => ({
                  id: c.projectId,
                  content: (
                    <ProjectTaskGroupCard
                      projectId={c.projectId}
                      projectTitle={c.projectTitle}
                      tasks={c.tasks}
                    />
                  ),
                }),
              )}
              onReorder={(next) => handleSectionReorder(s.key, next)}
            />
          </div>
        </section>
      ))}
    </div>
  );
}
