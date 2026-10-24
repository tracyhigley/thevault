// The two maintenance groups shared by the Today page's cards and the
// Maint Tasks page's second filter row — one place so they can't drift.
// Items with no building count as General Life (that's where Today's
// "+ ADD A CUSTOM TASK" lands too).

export type MaintGroup = "general" | "business";

export const MAINT_GROUP_LABELS: Record<MaintGroup, string> = {
  general: "General Life Maintenance",
  business: "Business & Creative Maintenance",
};

export const GENERAL_LIFE_BUILDINGS = new Set([
  "THE_WELLNESS_CENTER",
  "THE_SUPPORT_CENTER",
  "THE_PORT",
  "THE_GROUNDS",
  "THE_FAMILY_LODGE",
]);

export const BUSINESS_CREATIVE_BUILDINGS = new Set([
  "THE_LIBRARY",
  "THE_PRESS",
  "THE_MERCANTILE",
]);

export function maintGroupFor(
  area: string | null | undefined,
): MaintGroup | null {
  if (!area || GENERAL_LIFE_BUILDINGS.has(area)) return "general";
  if (BUSINESS_CREATIVE_BUILDINGS.has(area)) return "business";
  return null;
}
