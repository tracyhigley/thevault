import type { DocumentType } from "@/lib/categories";

// Notes used to live in a fixed set of ten folders (health, read-watch, …).
// They now file into the same buildings as Project Plans and Project Tasks,
// so a note's `folder` value is a building key (e.g. "THE_GYMNASIUM") —
// looked up dynamically against settings.buildings, not a compile-time list.
//
// Older notes still carry the pre-rebuild lowercase folder keys. This map
// translates them to a building key the first time they're read, so nothing
// has to move in the database for the app to work correctly.
const LEGACY_FOLDER_TO_BUILDING: Record<string, string> = {
  health: "THE_GYMNASIUM",
  "read-watch": "THE_LIBRARY",
  books: "THE_LIBRARY", // pre-rename alias, kept for safety
  "ecom-ecoship": "THE_MERCANTILE",
  "friends-family": "THE_SUPPORT_CENTER",
  "home-garden": "THE_GROUNDS",
  "stonewater-books": "THE_PRESS",
  writing: "THE_PRESS",
  travel: "THE_PORT",
  misc: "THE_GYMNASIUM", // only ever held one note (the 50 First Dates tape); Tracy's call
};

/** Translate a legacy folder key to a building key. Anything else (already a
 * building key, or unrecognized) passes through unchanged. */
export function normalizeDocumentFolderKey(
  raw: string | undefined,
): string | undefined {
  if (!raw) return undefined;
  const aliased = LEGACY_FOLDER_TO_BUILDING[raw.toLowerCase()];
  return aliased ?? raw;
}

export function folderForDocument(doc: DocumentType): string | undefined {
  return doc.folder;
}

/** Group notes by building key. Notes whose folder doesn't match any known
 * building (shouldn't normally happen) land in `unfiled` rather than
 * vanishing from view. */
export function groupDocumentsByBuilding(
  documents: DocumentType[],
  buildings: { key: string }[],
): { byBuilding: Record<string, DocumentType[]>; unfiled: DocumentType[] } {
  const byBuilding: Record<string, DocumentType[]> = {};
  for (const b of buildings) byBuilding[b.key] = [];
  const unfiled: DocumentType[] = [];
  for (const d of documents) {
    const key = d.folder;
    if (key && byBuilding[key]) byBuilding[key]!.push(d);
    else unfiled.push(d);
  }
  return { byBuilding, unfiled };
}

export function slugifyDocumentKey(key: string): string {
  return key.toLowerCase().replace(/_/g, "-").replace(/\//g, "-");
}

/** Matches documents-settings-editor `deriveKey`. */
export function deriveDocumentKey(label: string): string {
  return label
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_/-]/g, "")
    .slice(0, 40);
}

export function documentHrefForKey(key: string): string {
  return `/documents/${slugifyDocumentKey(key)}`;
}

export const FIFTY_FD_DOCUMENT_LABEL =
  "Next Steps in all areas: 50 First Dates Tape";

export function fiftyFdDocumentHref(
  documents: { key: string; label: string }[],
): string {
  const label = FIFTY_FD_DOCUMENT_LABEL;
  const doc = documents.find(
    (d) => d.label.trim().toLowerCase() === label.toLowerCase(),
  );
  return documentHrefForKey(doc?.key ?? deriveDocumentKey(label));
}
