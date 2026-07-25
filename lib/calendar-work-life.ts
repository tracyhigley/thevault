import type { Box } from "@/lib/categories";
import { hubSlotMatchesBox } from "@/lib/box-hub-layout";

export type WorkLifeGroup = "work" | "other";

// These slot strings are your Buildings' keys/labels. Kept as plain strings
// here — independent of the buildings config itself — since this is purely
// about matching calendar project buildings for work/life coloring, not
// about the buildings feature generally.
//
// Mirrors the old Boxes-based grouping (see migration
// 0018_project_task_today_link's sibling data migration for the box->
// building remap this replaced): Stonewater Books, Ecom & Ecoship, and
// Writing were "work"; Travel, Leisure, Friends & Family, and Home & Garden
// were "other". Leisure had no direct building equivalent and was folded
// into The Gymnasium, so that building is grouped "other" here too.
const WORK_SLOTS = [
  "THE_PRESS",
  "The Press",
  "THE_MERCANTILE",
  "The Mercantile",
  "THE_LIBRARY",
  "The Library",
];

const OTHER_SLOTS = [
  "THE_PORT",
  "The Port",
  "THE_FAMILY_LODGE",
  "The Family Lodge",
  "THE_GROUNDS",
  "The Grounds",
  "THE_GYMNASIUM",
  "The Gymnasium",
];

function matchesAnySlot(box: Box, slots: readonly string[]): boolean {
  return slots.some((slot) => hubSlotMatchesBox(box, slot));
}

/** Classify a calendar project building as work, life/other, or outside those groups. */
export function calendarWorkLifeGroup(box: Box): WorkLifeGroup | null {
  if (matchesAnySlot(box, WORK_SLOTS)) return "work";
  if (matchesAnySlot(box, OTHER_SLOTS)) return "other";
  return null;
}
