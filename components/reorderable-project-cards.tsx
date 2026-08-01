"use client";
// Drag-orderable project cards for the Under Construction page, styled to
// mirror the Master Project Plans building-card grid (color strip, serif
// heading, small mono caption) — but one card per project, not per building,
// and the heading is the project title rather than the building name.
//
// Reordering follows the same handle-based pattern as SortableList
// (components/sortable-list.tsx), just laid out on a 2D grid via dnd-kit's
// rectSortingStrategy instead of a vertical stack, since a full-card drag
// surface would fight with the card's own Link navigation.

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderActiveProjects } from "@/lib/plan-actions";

export type ReorderableProjectCard = {
  id: string;
  title: string;
  buildingLabel: string;
  buildingColor?: string;
  lastLogDate: string | null;
  doneLooksLike: string | null;
  currentTasks: { id: string; text: string }[];
};

export function ReorderableProjectCards({
  projects,
}: {
  projects: ReorderableProjectCard[];
}) {
  const [order, setOrder] = useState(projects);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const currentIds = order.map((p) => p.id).join(",");
    const incomingIds = projects.map((p) => p.id).join(",");
    if (currentIds !== incomingIds) setOrder(projects);
  }, [projects, order]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = order.findIndex((p) => p.id === active.id);
    const newIndex = order.findIndex((p) => p.id === over.id);
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);
    startTransition(async () => {
      await reorderActiveProjects(next.map((p) => p.id));
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={order.map((p) => p.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {order.map((p) => (
            <SortableProjectCard key={p.id} project={p} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableProjectCard({
  project,
}: {
  project: ReorderableProjectCard;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      className="relative"
    >
      <button
        {...attributes}
        {...listeners}
        title="Drag"
        className="absolute top-2 right-2 z-10 cursor-grab rounded-sm border border-paper-line/40 bg-paper-panel/70 px-1 font-mono text-[11px] text-ink-dim select-none hover:border-brass/40 hover:text-brass active:cursor-grabbing"
      >
        ⋮⋮
      </button>
      <Link
        href={`/project-plans/project/${project.id}`}
        className="group block h-full rounded-sm border border-paper-line bg-paper-panel px-4 py-4 pr-9 transition hover:border-brass/60"
      >
        <div
          className="h-1.5 w-6 rounded-full"
          style={{ background: project.buildingColor ?? "#b5853a" }}
        />
        <div className="serif-h text-ink group-hover:text-brass-low mt-3 text-[19px] leading-snug">
          {project.title}
        </div>
        <div className="mt-1 font-mono text-[10px] tracking-[0.14em] text-ink-mute">
          {project.buildingLabel.toUpperCase()}
          {project.lastLogDate ? ` · LAST NOTE ${project.lastLogDate}` : ""}
        </div>
        {project.doneLooksLike ? (
          <div className="mt-2 text-[12px] text-ink-dim">
            Done looks like: {project.doneLooksLike}
          </div>
        ) : null}
        {project.currentTasks.length > 0 ? (
          <div className="mt-2">
            <div className="font-mono text-[9px] tracking-[0.2em] text-red-500">
              CURRENT TASKS:
            </div>
            <ul className="mt-1 space-y-0.5">
              {project.currentTasks.map((t) => (
                <li key={t.id} className="text-[12px] text-ink-dim">
                  {t.text}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Link>
    </div>
  );
}
