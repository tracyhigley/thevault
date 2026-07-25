"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import type { DocumentKeyMigration } from "@/lib/actions";
import type { DocumentType } from "@/lib/categories";

// Keep in sync with DocumentConfig (extends BoxConfig) in lib/actions.ts —
// that's the source of truth (Zod), this just stops you before you hit the
// server-side limit.
const LABEL_MAX = 60;
const META_MAX = 120;

function deriveKey(label: string): string {
  return label
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_/-]/g, "")
    .slice(0, 40);
}

export function DocumentsSettingsEditor({
  initial,
  buildings,
  onSave,
}: {
  initial: DocumentType[];
  buildings: { key: string; label: string }[];
  onSave: (rows: DocumentType[], keyMigrations?: DocumentKeyMigration[]) => Promise<unknown>;
}) {
  const defaultBuilding = buildings[0]?.key ?? "";
  const [rows, setRows] = useState<DocumentType[]>(initial);
  /** Document key for each row at last successful save (or server load). Drives items.box renames. */
  const [keyAtLastSave, setKeyAtLastSave] = useState(() =>
    initial.map((d) => d.key),
  );
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const manualKeys = useRef<Set<number>>(new Set());

  useEffect(() => {
    setRows(initial);
    setKeyAtLastSave(initial.map((d) => d.key));
    manualKeys.current.clear();
  }, [initial]);

  function update(i: number, patch: Partial<DocumentType>) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function changeLabel(i: number, label: string) {
    setRows(
      rows.map((r, idx) => {
        if (idx !== i) return r;
        const key = manualKeys.current.has(i) ? r.key : deriveKey(label);
        return { ...r, label, key };
      }),
    );
  }

  function changeKey(i: number, key: string) {
    manualKeys.current.add(i);
    update(i, { key: key.toUpperCase().replace(/\s+/g, "_") });
  }

  function add() {
    setRows([
      ...rows,
      { key: "", label: "", meta: "", color: "#b5853a", folder: defaultBuilding },
    ]);
    setKeyAtLastSave([...keyAtLastSave, ""]);
  }

  function remove(i: number) {
    if (
      !confirm(
        "Remove this note? Items already filed under it stay safe.",
      )
    )
      return;
    setRows(rows.filter((_, idx) => idx !== i));
    setKeyAtLastSave(keyAtLastSave.filter((_, idx) => idx !== i));
    const next = new Set<number>();
    for (const idx of manualKeys.current) {
      if (idx < i) next.add(idx);
      else if (idx > i) next.add(idx - 1);
    }
    manualKeys.current = next;
  }

  function save() {
    const cleaned = rows.map((r) => ({
      ...r,
      key: r.key || deriveKey(r.label) || "DOCUMENT",
      folder: r.folder || defaultBuilding,
    }));
    const keyMigrations: DocumentKeyMigration[] = [];
    for (let i = 0; i < cleaned.length; i++) {
      const from = (keyAtLastSave[i] ?? "").trim();
      const to = cleaned[i]!.key.trim();
      if (from && to && from !== to) keyMigrations.push({ from, to });
    }
    setRows(cleaned);
    startTransition(async () => {
      try {
        await onSave(cleaned, keyMigrations);
        setKeyAtLastSave(cleaned.map((d) => d.key));
        setSavedAt(Date.now());
      } catch (e: any) {
        toast.error(
          e?.message ? `Couldn't save: ${e.message}` : "Couldn't save documents.",
        );
      }
    });
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center gap-2 px-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute">
        <span className="w-7" />
        <span className="min-w-[140px] flex-1">Label</span>
        <span className="min-w-[160px] flex-1">Meta</span>
        <span className="w-[150px]">Building</span>
        <span className="w-[110px]">Key</span>
        <span className="w-[80px]" />
      </div>
      {rows.map((r, i) => (
        <div
          key={i}
          className="flex flex-wrap items-center gap-2 rounded-sm border border-paper-line bg-paper-panel/40 px-4 py-3"
        >
          <input
            type="color"
            value={r.color ?? "#b5853a"}
            onChange={(e) => update(i, { color: e.target.value })}
            className="h-7 w-7 cursor-pointer rounded-sm border border-paper-line bg-transparent"
            title="Color"
          />
          <span className="flex min-w-[140px] flex-1 items-center gap-1">
            <input
              value={r.label}
              onChange={(e) => changeLabel(i, e.target.value)}
              placeholder="Label (e.g. Notes)"
              maxLength={LABEL_MAX}
              className="min-w-0 flex-1 rounded-sm border border-paper-line bg-paper-bg/60 px-2 py-1 text-ink outline-none focus:border-brass"
            />
            <span className="w-[40px] shrink-0 text-right font-mono text-[9px] text-ink-mute/50">
              {r.label.length}/{LABEL_MAX}
            </span>
          </span>
          <span className="flex min-w-[160px] flex-1 items-center gap-1">
            <input
              value={r.meta ?? ""}
              onChange={(e) => update(i, { meta: e.target.value })}
              placeholder="Subtitle, e.g. Measurements & doses"
              maxLength={META_MAX}
              className="min-w-0 flex-1 rounded-sm border border-paper-line bg-paper-bg/60 px-2 py-1 font-mono text-[13px] text-ink-mute outline-none focus:border-brass"
            />
            <span className="w-[40px] shrink-0 text-right font-mono text-[9px] text-ink-mute/50">
              {(r.meta ?? "").length}/{META_MAX}
            </span>
          </span>
          <select
            value={r.folder ?? defaultBuilding}
            onChange={(e) => update(i, { folder: e.target.value })}
            className="w-[150px] rounded-sm border border-paper-line bg-paper-bg/60 px-2 py-1 font-mono text-[12px] text-ink outline-none focus:border-brass"
          >
            {buildings.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label}
              </option>
            ))}
          </select>
          <input
            value={r.key}
            onChange={(e) => changeKey(i, e.target.value)}
            placeholder="auto"
            className="w-[110px] rounded-sm border border-paper-line bg-paper-bg/60 px-2 py-1 font-mono text-[12px] text-brass outline-none focus:border-brass"
          />
          <button
            onClick={() => remove(i)}
            className="rounded-sm border border-paper-line px-2 py-1 font-mono text-[11px] tracking-wider text-ink-mute hover:border-rust hover:text-rust"
          >
            REMOVE
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="w-full rounded-sm border border-dashed border-brass/40 py-3 font-mono text-[11px] tracking-[0.24em] text-brass/70 hover:border-brass"
      >
        + ADD NOTE
      </button>

      <div className="flex items-center justify-between pt-3">
        <span className="font-mono text-[11px] text-ink-mute">
          {pending && "saving…"}
          {!pending &&
            savedAt &&
            `saved ${new Date(savedAt).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}`}
        </span>
        <button
          onClick={save}
          disabled={pending}
          className="brass-button px-6 py-2 font-mono text-[11px] tracking-[0.24em] disabled:opacity-50"
        >
          SAVE NOTES
        </button>
      </div>
    </div>
  );
}
