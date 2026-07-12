import type { Box } from "@/lib/categories";
import {
  DOCUMENT_FOLDERS,
  type DocumentFolderKey,
} from "@/lib/document-folders";
import { hubSlotMatchesBox } from "@/lib/box-hub-layout";

export type WorkLifeGroup = "work" | "other";

const WORK_FOLDER_KEYS: DocumentFolderKey[] = [
  "stonewater-books",
  "ecom-ecoship",
  "writing",
];

const OTHER_FOLDER_KEYS: DocumentFolderKey[] = [
  "travel",
  "leisure",
  "friends-family",
  "home-garden",
];

/** Box hub abbreviations that map to document-folder groups on the calendar. */
const WORK_EXTRA_SLOTS = ["SWB", "PCS", "QCOM", "ECOSHIP"] as const;
const OTHER_EXTRA_SLOTS = ["F&F"] as const;

function folderSlots(keys: DocumentFolderKey[]): string[] {
  const slots: string[] = [];
  for (const key of keys) {
    slots.push(key);
    const folder = DOCUMENT_FOLDERS.find((f) => f.key === key);
    if (folder) slots.push(folder.label);
  }
  return slots;
}

const WORK_SLOTS = [...folderSlots(WORK_FOLDER_KEYS), ...WORK_EXTRA_SLOTS];
const OTHER_SLOTS = [...folderSlots(OTHER_FOLDER_KEYS), ...OTHER_EXTRA_SLOTS];

function matchesAnySlot(box: Box, slots: readonly string[]): boolean {
  return slots.some((slot) => hubSlotMatchesBox(box, slot));
}

/** Classify a calendar project box as work, life/other, or outside those groups. */
export function calendarWorkLifeGroup(box: Box): WorkLifeGroup | null {
  if (matchesAnySlot(box, WORK_SLOTS)) return "work";
  if (matchesAnySlot(box, OTHER_SLOTS)) return "other";
  return null;
}
