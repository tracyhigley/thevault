"use client";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderItems } from "@/lib/actions";

// Items must be { id, content: ReactNode }. We can't accept a render function
// because Server Components can't pass functions across the client boundary.

export type SortableItem = { id: string; content: React.ReactNode };

type SortableListProps = {
  items: SortableItem[];
  /**
   * When set, drag-end invokes this with the new row order for this list only
   * instead of calling `reorderItems` (e.g. Maint Tasks merges several sections).
   */
  onReorder?: (orderedItems: SortableItem[]) => void | Promise<void>;
};

export function SortableList({ items, onReorder }: SortableListProps) {
  const [order, setOrder] = useState(items);
  const [, startTransition] = useTransition();

  // Re-sync when the parent re-renders with a different list (e.g. after
  // a + New row inserts a new item, or a row is moved to another box).
  // Compare ids so we don't trigger when only content (e.g. an EditableText
  // re-renders with a fresh closure) changes.
  useEffect(() => {
    const currentIds = order.map((i) => i.id).join(",");
    const incomingIds = items.map((i) => i.id).join(",");
    if (currentIds !== incomingIds) setOrder(items);
    else if (order.length === items.length) {
      // Same ids in the same order — refresh content references in case
      // titles or other cell contents changed.
      const sameContent = order.every(
        (o, i) => o.content === items[i].content,
      );
      if (!sameContent) setOrder(items);
    }
  }, [items, order]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = order.findIndex((i) => i.id === active.id);
    const newIndex = order.findIndex((i) => i.id === over.id);
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);
    startTransition(async () => {
      if (onReorder) {
        await onReorder(next);
      } else {
        await reorderItems(next.map((i) => i.id));
      }
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={order.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {order.map((item) => (
            <SortableRow key={item.id} id={item.id}>
              {item.content}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      className="flex items-stretch gap-2"
    >
      <button
        {...attributes}
        {...listeners}
        title="Drag"
        className="cursor-grab select-none rounded-sm border border-paper-line/40 bg-paper-panel/30 px-1 font-mono text-[13px] text-ink-dim hover:border-brass/40 hover:text-brass active:cursor-grabbing"
      >
        ⋮⋮
      </button>
      <div className="flex-1">{children}</div>
    </div>
  );
}
