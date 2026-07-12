import type { Box } from "@/lib/categories";

/**
 * Fixed tile order on The Boxes hub (labels / keys as shown in Settings).
 * Row 1: SWB, PCS, QCOM, ECOSHIP — Row 2: Writing, Health, Home & Garden, Travel —
 * Row 3: Leisure, Read/Watch, F&F. Boxes not listed here render after row 3.
 */
export const BOX_HUB_SLOT_ROWS: readonly (readonly string[])[] = [
  ["SWB", "PCS", "QCOM", "ECOSHIP"],
  ["Writing", "Health", "Home & Garden", "Travel"],
  ["Leisure", "Read/Watch", "F&F"],
] as const;

function norm(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/&/g, "and");
}

function compactAlnum(s: string) {
  return norm(s).replace(/[^a-z0-9]/g, "");
}

/** Match a settings slot string to a configured box (label or key). */
export function hubSlotMatchesBox(box: Box, slot: string): boolean {
  const slotTrim = slot.trim();
  if (!slotTrim) return false;
  if (box.label.trim() === slotTrim) return true;
  if (norm(box.label) === norm(slotTrim)) return true;
  if (box.key.trim().toUpperCase() === slotTrim.toUpperCase()) return true;
  if (norm(box.key.replace(/_/g, " ")) === norm(slotTrim)) return true;
  if (compactAlnum(box.label) === compactAlnum(slotTrim)) return true;
  return false;
}

/**
 * Place each configured box at most once: fill fixed rows by slot order,
 * then return any remaining boxes for a trailing row.
 */
export function layoutBoxHubRows(boxes: Box[]): {
  rows: (Box | null)[][];
  orphans: Box[];
} {
  const unused = new Set(boxes.map((b) => b.key));
  const rows: (Box | null)[][] = BOX_HUB_SLOT_ROWS.map((rowSlots) =>
    rowSlots.map((slot) => {
      const found = boxes.find(
        (b) => unused.has(b.key) && hubSlotMatchesBox(b, slot),
      );
      if (found) unused.delete(found.key);
      return found ?? null;
    }),
  );
  const orphans = boxes.filter((b) => unused.has(b.key));
  return { rows, orphans };
}
