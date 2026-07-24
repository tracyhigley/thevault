"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { appendDocument } from "@/lib/actions";
import { Select } from "@/components/ui";

export function NewDocumentRow({
  buildings,
  initialBuilding = "",
}: {
  buildings: { key: string; label: string }[];
  initialBuilding?: string;
}) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [building, setBuilding] = useState(initialBuilding);
  const [pending, startTransition] = useTransition();

  function add() {
    const t = label.trim();
    if (!t || !building) return;
    startTransition(async () => {
      try {
        await appendDocument(t, building);
        setLabel("");
        router.refresh();
        toast.success("Note added.");
      } catch (e: unknown) {
        toast.error(
          e instanceof Error ? e.message : "Couldn’t add the note.",
        );
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-sm border border-dashed border-paper-line/60 bg-paper-panel/20 px-4 py-2 transition hover:border-brass/40">
      <span className="font-mono text-[10px] tracking-wider text-ink-mute">
        +
      </span>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        placeholder="+ New note"
        className="paper-task-title min-w-[220px] flex-1 bg-transparent text-ink placeholder:text-ink-mute outline-none"
      />
      <Select
        value={building}
        onChange={(e) => setBuilding(e.target.value)}
        tone="brass"
        className="w-[14rem] shrink-0 px-2 py-1 font-mono text-[10px]"
        aria-label="Building for new note"
      >
        <option value="" className="bg-paper-bg">
          — choose building —
        </option>
        {buildings.map((b) => (
          <option key={b.key} value={b.key} className="bg-paper-bg">
            {b.label}
          </option>
        ))}
      </Select>
      <button
        type="button"
        onClick={add}
        disabled={pending || !label.trim() || !building}
        className="rounded-sm border border-brass/40 px-3 py-1 font-mono text-[10px] tracking-[0.16em] text-brass transition hover:bg-brass/10 disabled:opacity-40"
      >
        ADD
      </button>
      {pending && (
        <span className="font-mono text-[10px] text-brass">saving…</span>
      )}
    </div>
  );
}
