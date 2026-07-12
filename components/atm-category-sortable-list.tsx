"use client";

import clsx from "clsx";
import { AreaPill } from "@/components/area-pill";
import { EditableText } from "@/components/editable-text";
import { AtmPickButton } from "@/components/atm-pick-button";
import { DeleteItemButton } from "@/components/delete-item-button";
import { SortableList, type SortableItem } from "@/components/sortable-list";
import { reorderAtmItems } from "@/lib/actions";
import type { Box } from "@/lib/categories";
import type { Item } from "@/lib/types";

export function AtmCategorySortableList({
  items,
  boxes,
}: {
  items: Item[];
  boxes: Box[];
}) {
  const sortableItems: SortableItem[] = items.map((it) => {
    const picked = it.todayOrder !== null;
    return {
      id: it.id,
      content: (
        <div
          title={[it.energy, it.title].filter(Boolean).join(" · ") || undefined}
          className={clsx(
            "flex items-center gap-3 rounded-sm border bg-paper-panel/40 px-3 py-2 transition",
            picked ? "border-brass/40" : "border-paper-line/60",
          )}
        >
          <AreaPill
            itemId={it.id}
            initial={it.category}
            field="category"
            options={boxes.map((b) => ({
              key: b.key,
              label: b.label,
            }))}
            className="!max-h-7 max-w-[9.25rem] shrink-0 !py-0.5 !pl-1.5 !pr-1 !text-[9px] !leading-tight border-brass/40 bg-paper-bg/20"
          />
          <EditableText
            itemId={it.id}
            field="title"
            initial={it.title}
            className={clsx(
              "paper-task-title min-w-0 flex-1 truncate",
              picked ? "text-ink" : "text-ink-mute",
            )}
            placeholder="(no title)"
          />
          <span className="flex shrink-0 items-baseline justify-end gap-1 whitespace-nowrap font-mono text-[11px] text-ink-mute tabular-nums">
            <EditableText
              itemId={it.id}
              field="minutes"
              initial={it.minutes}
              className="min-w-[3.25rem] w-16 max-w-[4.5rem] bg-transparent px-0 text-right text-[11px] tabular-nums"
              numeric
              placeholder="—"
            />
            <span>min</span>
          </span>
          <AtmPickButton itemId={it.id} picked={picked} size="compact" />
          <DeleteItemButton itemId={it.id} />
        </div>
      ),
    };
  });

  return (
    <SortableList
      items={sortableItems}
      onReorder={async (orderedItems) => {
        await reorderAtmItems(orderedItems.map((i) => i.id));
      }}
    />
  );
}
