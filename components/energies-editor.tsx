"use client";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveEnergyConfig } from "@/lib/actions";
import type { EnergyType } from "@/lib/categories";

// Energies don't carry a destination — ATM items use them for daily
// energy-matching, Counter items don't have an energy column at all.

function deriveKey(label: string): string {
  return label
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9_/-]/g, "")
    .slice(0, 40);
}

export function EnergiesEditor({ initial }: { initial: EnergyType[] }) {
  const [energies, setEnergies] = useState<EnergyType[]>(initial);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const manualKeys = useRef<Set<number>>(new Set());

  function update(i: number, patch: Partial<EnergyType>) {
    setEnergies(
      energies.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
    );
  }

  function changeLabel(i: number, label: string) {
    setEnergies(
      energies.map((e, idx) => {
        if (idx !== i) return e;
        const key = manualKeys.current.has(i) ? e.key : deriveKey(label);
        return { ...e, label, key };
      }),
    );
  }

  function changeKey(i: number, key: string) {
    manualKeys.current.add(i);
    update(i, { key: key.toUpperCase().replace(/\s+/g, "-") });
  }

  function add() {
    setEnergies([...energies, { key: "", label: "" }]);
  }

  function remove(i: number) {
    if (
      !confirm(
        "Remove this energy? Items already tagged with it keep their value.",
      )
    )
      return;
    setEnergies(energies.filter((_, idx) => idx !== i));
    const next = new Set<number>();
    for (const idx of manualKeys.current) {
      if (idx < i) next.add(idx);
      else if (idx > i) next.add(idx - 1);
    }
    manualKeys.current = next;
  }

  function save() {
    const cleaned = energies.map((e) => ({
      ...e,
      key: e.key || deriveKey(e.label) || "ENERGY",
    }));
    setEnergies(cleaned);
    startTransition(async () => {
      try {
        await saveEnergyConfig(cleaned);
        setSavedAt(Date.now());
      } catch (e: any) {
        toast.error(e?.message ?? "Couldn't save energies.");
      }
    });
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center gap-2 px-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-mute">
        <span className="flex-1 min-w-[160px]">Label</span>
        <span className="w-[140px]">
          Key <span className="text-ink-mute/60 normal-case tracking-normal">(auto)</span>
        </span>
        <span className="w-[80px]" />
      </div>
      {energies.map((e, i) => (
        <div
          key={i}
          className="flex flex-wrap items-center gap-2 rounded-sm border border-vault-line bg-vault-panel/40 px-4 py-3"
        >
          <input
            value={e.label}
            onChange={(ev) => changeLabel(i, ev.target.value)}
            placeholder="Label (e.g. Creative)"
            className="min-w-[160px] flex-1 rounded-sm border border-vault-line bg-vault-bg/60 px-2 py-1 text-ink outline-none focus:border-brass"
          />
          <input
            value={e.key}
            onChange={(ev) => changeKey(i, ev.target.value)}
            placeholder="auto"
            title="Stored internally on each ATM item. Auto-derived from the label until you edit it."
            className="w-[140px] rounded-sm border border-vault-line bg-vault-bg/60 px-2 py-1 font-mono text-[10px] text-brass outline-none focus:border-brass"
          />
          <button
            onClick={() => remove(i)}
            className="rounded-sm border border-vault-line px-2 py-1 font-mono text-[10px] tracking-wider text-ink-mute hover:border-rust hover:text-rust"
          >
            REMOVE
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="w-full rounded-sm border border-dashed border-brass/40 py-3 font-mono text-[10px] tracking-[0.24em] text-brass/70 hover:border-brass"
      >
        + ADD ENERGY
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
          SAVE ENERGIES
        </button>
      </div>
    </div>
  );
}
