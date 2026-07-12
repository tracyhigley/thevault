"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createItem } from "@/lib/actions";
import {
  MinutesInlineInput,
  parseMinutesField,
} from "@/components/minutes-inline-input";
import { Select } from "@/components/ui";

export function NewAtmItemRow({
  boxes,
  initialCategory = "",
}: {
  boxes: { key: string; label: string }[];
  initialCategory?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [minutes, setMinutes] = useState("");
  const [pending, startTransition] = useTransition();

  function add() {
    const t = title.trim();
    if (!t || !category) return;
    startTransition(async () => {
      const m = parseMinutesField(minutes);
      await createItem("ATM", t, {
        category,
        area: null,
        ...(m !== undefined ? { minutes: m } : {}),
      });
      setTitle("");
      setMinutes("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-sm border border-dashed border-paper-line/60 bg-paper-panel/20 px-4 py-2 transition hover:border-brass/40">
      <span className="font-mono text-[10px] tracking-wider text-ink-mute">+</span>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        placeholder="+ New Project Tasks option"
        className="paper-task-title min-w-[220px] flex-1 bg-transparent text-ink placeholder:text-ink-mute outline-none"
      />
      <Select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        tone="brass"
        className="w-[13rem] shrink-0 px-2 py-1 font-mono text-[10px]"
        aria-label="Choose box for new Project Tasks task"
      >
        <option value="" className="bg-paper-bg">
          — choose box —
        </option>
        {boxes.map((b) => (
          <option key={b.key} value={b.key} className="bg-paper-bg">
            {b.label}
          </option>
        ))}
      </Select>
      <MinutesInlineInput
        value={minutes}
        onChange={setMinutes}
        aria-label="Minutes for new Project Tasks item"
      />
      <button
        type="button"
        onClick={add}
        disabled={pending || !title.trim() || !category}
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
