"use client";

import { useEffect, useState, useTransition } from "react";
import clsx from "clsx";
import { SortableList, type SortableItem } from "@/components/sortable-list";
import { reorderItems } from "@/lib/actions";

export type CounterSectionGroup = {
  /** "urgent" (stressor) section, then one key per building area, in display order. */
  key: string;
  title: string;
  /** Building's assigned color (hex), if any — tints the section heading. */
  color?: string;
  items: SortableItem[];
};

/** Groups are already in display order — just flatten their items in place. */
function mergeIds(groups: CounterSectionGroup[]) {
  return groups.flatMap((g) => g.items.map((i) => i.id));
}

export function CounterSectionedLists({
  groups: initialGroups,
  listKey,
  syncSignature,
}: {
  groups: CounterSectionGroup[];
  /** Filter / area — remount client buckets when the user changes filters. */
  listKey: string;
  /** Id order per section from the server; when it changes, sync local state. */
  syncSignature: string;
}) {
  const [groups, setGroups] = useState(initialGroups);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setGroups(initialGroups);
  }, [listKey, syncSignature, initialGroups]);

  function handleSectionReorder(
    sectionKey: CounterSectionGroup["key"],
    nextItems: SortableItem[],
  ) {
    let fullIds: string[] = [];
    setGroups((prev) => {
      const nextGroups = prev.map((g) =>
        g.key === sectionKey ? { ...g, items: nextItems } : g,
      );
      fullIds = mergeIds(nextGroups);
      return nextGroups;
    });
    startTransition(async () => {
      await reorderItems(fullIds);
    });
  }

  if (groups.length === 0) return null;

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.key} aria-labelledby={`counter-section-${g.key}`}>
          <h2
            id={`counter-section-${g.key}`}
            className={clsx(
              "font-mono text-[14px] font-semibold tracking-[0.16em] uppercase",
              !g.color && "text-ink-mute",
            )}
            style={g.color ? { color: g.color } : undefined}
          >
            — {g.title} —
          </h2>
          <div className="mt-2">
            <SortableList
              items={g.items}
              onReorder={(next) => handleSectionReorder(g.key, next)}
            />
          </div>
        </section>
      ))}
    </div>
  );
}
