"use client";
// Drag-orderable project groups for the Project Tasks page. Same pattern as
// ReorderableProjects / AtmCategorySortableList: plain data in, SortableList
// wired to its own reorder action (reorderProjectTaskGroups — separate from
// the Under Construction page's active_order since this list is a narrower
// subset of active projects).

import { SortableList, type SortableItem } from "@/components/sortable-list";
import { reorderProjectTaskGroups } from "@/lib/plan-actions";
import { ProjectTaskGroupCard } from "@/components/project-task-group-card";

export type TaskGroup = {
  projectId: string;
  projectTitle: string;
  buildingLabel: string;
  buildingColor?: string;
  tasks: {
    taskId: string;
    text: string;
    minutes: number | null;
    onToday: boolean;
  }[];
};

export function ReorderableProjectTaskGroups({
  groups,
}: {
  groups: TaskGroup[];
}) {
  const items: SortableItem[] = groups.map((g) => ({
    id: g.projectId,
    content: (
      <ProjectTaskGroupCard
        projectId={g.projectId}
        projectTitle={g.projectTitle}
        buildingLabel={g.buildingLabel}
        buildingColor={g.buildingColor}
        tasks={g.tasks}
      />
    ),
  }));

  return (
    <SortableList
      items={items}
      onReorder={async (orderedItems) => {
        await reorderProjectTaskGroups(orderedItems.map((i) => i.id));
      }}
    />
  );
}
