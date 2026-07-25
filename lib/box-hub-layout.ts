import type { Box } from "@/lib/categories";

// The Boxes hub itself is gone (Buildings replaced it as the categorization
// system across Field Notes, Admin Tasks, and Calendar), but this matcher
// is still shared infrastructure — calendarWorkLifeGroup uses it to match a
// calendar project (building) against its work/life slot strings.

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ").replace(/&/g, "and");
}

function compactAlnum(s: string) {
  return norm(s).replace(/[^a-z0-9]/g, "");
}

/** Match a settings slot string to a configured box/building (label or key). */
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
