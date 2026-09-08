// Shared grouping for "Maint Tasks"-style displays: items flagged urgent
// come first (as a single "Urgent" section), then everything else is
// bucketed by building. Used by both the standalone Maint Tasks page and
// the Build Day wizard's Maint Tasks review step so the two can't drift
// apart from each other.

import type { Item } from "./types";

export const UNASSIGNED_AREA_KEY = "__unassigned__";

export type CounterGroupDescriptor = {
  /** "urgent", then one key per building area, in display order. */
  key: string;
  title: string;
  /** Building's assigned color (hex), if any. */
  color?: string;
  items: Item[];
};

type BuildingLike = { key: string; label: string; color?: string };

export function buildCounterGroups(
  items: Item[],
  buildings: BuildingLike[],
): CounterGroupDescriptor[] {
  const urgent: Item[] = [];
  const rest: Item[] = [];
  for (const it of items) {
    if (it.urgent) urgent.push(it);
    else rest.push(it);
  }

  const byArea = new Map<string, Item[]>();
  for (const it of rest) {
    const key = it.area ?? UNASSIGNED_AREA_KEY;
    const bucket = byArea.get(key);
    if (bucket) bucket.push(it);
    else byArea.set(key, [it]);
  }

  const groups: CounterGroupDescriptor[] = [];
  if (urgent.length > 0) {
    groups.push({ key: "urgent", title: "Urgent", items: urgent });
  }

  // One section per building, in the order buildings are configured.
  const usedAreaKeys = new Set<string>();
  for (const b of buildings) {
    const bucket = byArea.get(b.key);
    if (bucket && bucket.length > 0) {
      groups.push({ key: b.key, title: b.label, color: b.color, items: bucket });
      usedAreaKeys.add(b.key);
    }
  }
  // Any area key present on items but no longer in settings.buildings.
  for (const [key, bucket] of byArea) {
    if (key === UNASSIGNED_AREA_KEY || usedAreaKeys.has(key)) continue;
    if (bucket.length > 0) groups.push({ key, title: key, items: bucket });
  }
  const unassigned = byArea.get(UNASSIGNED_AREA_KEY);
  if (unassigned && unassigned.length > 0) {
    groups.push({
      key: UNASSIGNED_AREA_KEY,
      title: "Unassigned",
      items: unassigned,
    });
  }
  return groups;
}
