"use client";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveBoxConfig } from "@/lib/actions";
import type { Box } from "@/lib/categories";

// The Documents settings editor reuses this same component — same shape, same UX,
// just routed to a different `onSave`. See app/settings/documents/page.tsx.

// Auto-derived key from a label: uppercase, spaces → underscores, strip
// punctuation. Mirrors the manual transform users were typing themselves.
function deriveKey(label: string): string {
  return label
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_/-]/g, "")
    .slice(0, 40);
}

export function BoxesEditor({
  initial,
  onSave = saveBoxConfig,
  singular = "BOX",
  plural = "BOXES",
  labelPlaceholder = "Label",
  metaPlaceholder = "Subtitle (optional)",
}: {
  initial: Box[];
  onSave?: (rows: Box[]) => Promise<unknown>;
  /** Uppercase singular — used in "+ ADD <singular>". */
  singular?: string;
  /** Uppercase plural — used in "SAVE <plural>". */
  plural?: string;
  labelPlaceholder?: string;
  metaPlaceholder?: string;
}) {
  const [boxes, setBoxes] = useState<Box[]>(initial);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Track which row indexes have had their key edited manually. Once a row
  // is "manual," typing in the label stops auto-updating its key.
  const manualKeys = useRef<Set<number>>(new Set());

  function update(i: number, patch: Partial<Box>) {
    setBoxes(boxes.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }

  function changeLabel(i: number, label: string) {
    setBoxes(
      boxes.map((b, idx) => {
        if (idx !== i) return b;
        const key = manualKeys.current.has(i) ? b.key : deriveKey(label);
        return { ...b, label, key };
      }),
    );
  }

  function changeKey(i: number, key: string) {
    manualKeys.current.add(i);
    update(i, { key: key.toUpperCase().replace(/\s+/g, "_") });
  }

  function add() {
    // Brand new box: empty label, empty key — key will derive as she types.
    setBoxes([...boxes, { key: "", label: "", meta: "", color: "#b5853a" }]);
  }

  function remove(i: number) {
    if (
      !confirm(
        `Remove this ${singular.toLowerCase()}? Items already filed under it stay safe.`,
      )
    )
      return;
    setBoxes(boxes.filter((_, idx) => idx !== i));
    // Re-base manual-key indexes after removal.
    const next = new Set<number>();
    for (const idx of manualKeys.current) {
      if (idx < i) next.add(idx);
      else if (idx > i) next.add(idx - 1);
    }
    manualKeys.current = next;
  }

  function save() {
    // Last-line backstop: ensure every row has a key (derive from label).
    const cleaned = boxes.map((b) => ({
      ...b,
      key: b.key || deriveKey(b.label) || "BOX",
    }));
    setBoxes(cleaned);
    startTransition(async () => {
      try {
        await onSave(cleaned);
        setSavedAt(Date.now());
      } catch (e: any) {
        // Surface the failure instead of letting it bubble as an
        // unhandledRejection. Most common cause: a settings column the DB
        // doesn't have yet (run the latest migration).
        toast.error(
          e?.message
            ? `Couldn't save: ${e.message}`
            : `Couldn't save ${plural.toLowerCase()}.`,
        );
      }
    });
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center gap-2 px-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-mute">
        <span className="w-7" />
        <span className="flex-1 min-w-[160px]">Label</span>
        <span className="flex-1 min-w-[160px]" title="Optional subtitle shown on box cards">
          Meta <span className="text-ink-mute/60 normal-case tracking-normal">(subtitle, optional)</span>
        </span>
        <span className="w-[110px]" title="Stored on each item — lowercase letters become uppercase, spaces become underscores">
          Key <span className="text-ink-mute/60 normal-case tracking-normal">(auto)</span>
        </span>
        <span className="w-[80px]" />
      </div>
      {boxes.map((b, i) => (
        <div
          key={i}
          className="flex flex-wrap items-center gap-2 rounded-sm border border-paper-line bg-paper-panel/40 px-4 py-3"
        >
          <input
            type="color"
            value={b.color ?? "#b5853a"}
            onChange={(e) => update(i, { color: e.target.value })}
            className="h-7 w-7 cursor-pointer rounded-sm border border-paper-line bg-transparent"
            title="Color"
          />
          <input
            value={b.label}
            onChange={(e) => changeLabel(i, e.target.value)}
            placeholder={labelPlaceholder}
            className="min-w-[160px] flex-1 rounded-sm border border-paper-line bg-paper-bg/60 px-2 py-1 text-ink outline-none focus:border-brass"
          />
          <input
            value={b.meta ?? ""}
            onChange={(e) => update(i, { meta: e.target.value })}
            placeholder={metaPlaceholder}
            title="An optional one-liner to remind you what this box is — shows under the label on box cards."
            className="min-w-[160px] flex-1 rounded-sm border border-paper-line bg-paper-bg/60 px-2 py-1 font-mono text-[11px] text-ink-mute outline-none focus:border-brass"
          />
          <input
            value={b.key}
            onChange={(e) => changeKey(i, e.target.value)}
            placeholder="auto"
            title="Stored internally on each item. Auto-derived from the label until you edit it."
            className="w-[110px] rounded-sm border border-paper-line bg-paper-bg/60 px-2 py-1 font-mono text-[10px] text-brass outline-none focus:border-brass"
          />
          <button
            onClick={() => remove(i)}
            className="rounded-sm border border-paper-line px-2 py-1 font-mono text-[10px] tracking-wider text-ink-mute hover:border-rust hover:text-rust"
          >
            REMOVE
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="w-full rounded-sm border border-dashed border-brass/40 py-3 font-mono text-[10px] tracking-[0.24em] text-brass/70 hover:border-brass"
      >
        + ADD {singular}
      </button>

      <div className="flex items-center justify-between pt-3">
        <span className="font-mono text-[10px] text-ink-mute">
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
          className="brass-button px-6 py-2 font-mono text-[10px] tracking-[0.24em] disabled:opacity-50"
        >
          SAVE {plural}
        </button>
      </div>
    </div>
  );
}
