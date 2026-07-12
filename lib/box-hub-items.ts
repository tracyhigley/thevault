import type { Item } from "@/lib/types";

/** Same ordering as box storage lists: today_order, then created_at. */
export function sortHubItems(a: Item, b: Item): number {
  const ao = a.todayOrder;
  const bo = b.todayOrder;
  if (ao != null && bo != null && ao !== bo) return ao - bo;
  if (ao != null && bo == null) return -1;
  if (ao == null && bo != null) return 1;
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

/** Match stored keys/areas/categories to a configured box key (case-insensitive). */
export function hubKeyMatchesField(
  boxKey: string,
  field: string | null | undefined,
): boolean {
  if (field == null || String(field).trim() === "") return false;
  return field.trim().toUpperCase() === boxKey.trim().toUpperCase();
}

/**
 * All items that "belong" to a life-area box for the Boxes hub:
 * - filed in storage with `item.box === boxKey`
 * - on the Counter with `area === boxKey`
 * - on the ATM with `category === boxKey`
 * - still in Drop with `area` or `category === boxKey` before triage
 */
export function itemsForHubBox(boxKey: string, items: Item[]): Item[] {
  return items.filter((it) => {
    if (hubKeyMatchesField(boxKey, it.box)) return true;
    if (it.box === "COUNTER" && hubKeyMatchesField(boxKey, it.area))
      return true;
    if (it.box === "ATM" && hubKeyMatchesField(boxKey, it.category))
      return true;
    if (it.box === "DROP") {
      if (hubKeyMatchesField(boxKey, it.area)) return true;
      if (hubKeyMatchesField(boxKey, it.category)) return true;
    }
    return false;
  });
}

export function sortedItemsForHubBox(boxKey: string, items: Item[]): Item[] {
  return itemsForHubBox(boxKey, items).sort(sortHubItems);
}
