// Boxes are user-defined categories — life/business/project axes. They
// don't carry a destination on their own; a single box can hold both
// Counter items (obligations) and ATM items (energy-matched pulls) at
// the same time.
//
// Destination is its own axis, picked explicitly per item at triage:
//   ATM     — energy-matched pulls; carries `category`, `energy`, `minutes`
//   COUNTER — obligations; carries `area`, `urgent`, `must`, `minutes`
//
// Boxes, documents, and energies all live in `settings` JSONB so they're
// editable from the Settings UI. No defaults — vaults start empty.

import { normalizeDocumentFolderKey } from "@/lib/document-folders";
import { supabaseServer } from "./supabase/server";

export type Box = {
  key: string;
  label: string;
  color?: string;
  meta?: string;
};

// Reserved keys for the daily-action surfaces (top-level pages, not
// categories). Stored on item.box but never valid as a settings.boxes
// or settings.documents entry.
export const RESERVED_BOX_KEYS = new Set(["DROP", "ATM", "COUNTER", "DOCKET"]);

function normalize(raw: any): Box | null {
  if (!raw || typeof raw !== "object") return null;
  const key = typeof raw.key === "string" ? raw.key : null;
  if (!key) return null;
  if (RESERVED_BOX_KEYS.has(key)) return null;
  return {
    key,
    label: typeof raw.label === "string" ? raw.label : key,
    color: typeof raw.color === "string" ? raw.color : undefined,
    meta: typeof raw.meta === "string" ? raw.meta : undefined,
  };
}

export async function getBoxes(): Promise<Box[]> {
  const sb = await supabaseServer();
  const { data } = await sb
    .from("settings")
    .select("boxes")
    .maybeSingle();
  const raw = (data?.boxes as any[]) ?? null;
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map(normalize).filter((b): b is Box => b !== null);
}

export type Destination = "ATM" | "COUNTER";

// Energies are pure metadata — they live on ATM items, used by the daily
// energy-matching to decide what to pick today. Counter items don't
// carry energy.
export type EnergyType = {
  key: string;
  label: string;
};

function normalizeEnergy(raw: any): EnergyType | null {
  if (!raw || typeof raw !== "object") return null;
  const key = typeof raw.key === "string" ? raw.key : null;
  if (!key) return null;
  return {
    key,
    label: typeof raw.label === "string" ? raw.label : key,
  };
}

export async function getEnergies(): Promise<EnergyType[]> {
  const sb = await supabaseServer();
  const { data } = await sb
    .from("settings")
    .select("energies")
    .maybeSingle();
  const raw = (data?.energies as any[]) ?? null;
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .map(normalizeEnergy)
    .filter((e): e is EnergyType => e !== null);
}

// Documents are text-first storage categories (Notes, Measurements, Read &
// Watch, Health Ideas…) — separately configured from Boxes. Same shape;
// kept distinct so the Vault page can render them in their own section and
// route them through /documents/<slug> instead of /vault/<slug>.
export type DocumentType = {
  key: string;
  label: string;
  color?: string;
  meta?: string;
  folder?:
    | "health"
    | "read-watch"
    | "misc"
    | "ecom-ecoship"
    | "friends-family"
    | "home-garden"
    | "stonewater-books"
    | "leisure"
    | "writing"
    | "travel";
};

function normalizeDocument(raw: any): DocumentType | null {
  const n = normalize(raw);
  if (!n) return null;
  const folderRaw = typeof raw?.folder === "string" ? raw.folder.toLowerCase() : undefined;
  const folder = normalizeDocumentFolderKey(folderRaw);
  return { ...n, folder };
}

export async function getDocuments(): Promise<DocumentType[]> {
  const sb = await supabaseServer();
  // Prefer `documents` (post-migration); fall back to legacy `records` so the
  // app works if migration 0015 has not been applied to this database yet.
  const { data } = await sb.from("settings").select("*").maybeSingle();
  const row = data as { documents?: unknown; records?: unknown } | null;
  const raw = (row?.documents ?? row?.records) as unknown;
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map(normalizeDocument).filter((d): d is DocumentType => d !== null);
}
