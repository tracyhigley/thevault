import type { Box } from "@/lib/categories";
import { hubSlotMatchesBox } from "@/lib/box-hub-layout";

export type WorkLifeGroup = "work" | "other";

// These slot strings mirror the labels/keys the old Notes folders used
// (Stonewater Books, Ecom & Ecoship, Writing / Travel, Leisure, Friends &
// Family, Home & Garden). Kept as plain strings here — independent of the
// Notes/buildings rework — since this is purely about matching calendar
// project boxes for work/life coloring, not about notes at all.
const WORK_SLOTS = [
  "stonewater-books",
  "STONEWATER BOOKS",
  "ecom-ecoship",
  "ECOM & ECOSHIP",
  "writing",
  "WRITING",
  "SWB",
  "PCS",
  "QCOM",
  "ECOSHIP",
];

const OTHER_SLOTS = [
  "travel",
  "TRAVEL",
  "leisure",
  "LEISURE",
  "friends-family",
  "FRIENDS & FAMILY",
  "home-garden",
  "HOME & GARDEN",
  "F&F",
];

function matchesAnySlot(box: Box, slots: readonly string[]): boolean {
  return slots.some((slot) => hubSlotMatchesBox(box, slot));
}

/** Classify a calendar project box as work, life/other, or outside those groups. */
export function calendarWorkLifeGroup(box: Box): WorkLifeGroup | null {
  if (matchesAnySlot(box, WORK_SLOTS)) return "work";
  if (matchesAnySlot(box, OTHER_SLOTS)) return "other";
  return null;
}
