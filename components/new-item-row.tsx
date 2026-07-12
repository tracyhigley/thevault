"use client";
import { useState, useTransition } from "react";
import { createItem } from "@/lib/actions";

export function NewItemRow({
  box,
  placeholder = "+ New item",
  defaults = {},
  onCreated,
}: {
  box: string;
  placeholder?: string;
  defaults?: Record<string, unknown>;
  /** Runs after a row is successfully inserted (e.g. refresh parent lists). */
  onCreated?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();

  function add() {
    const t = title.trim();
    if (!t) return;
    startTransition(async () => {
      await createItem(box, t, defaults as any);
      setTitle("");
      onCreated?.();
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-sm border border-dashed border-paper-line/60 bg-paper-panel/20 px-4 py-2 transition hover:border-brass/40">
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
        placeholder={placeholder}
        className="paper-task-title flex-1 bg-transparent text-ink placeholder:text-ink-mute outline-none"
      />
      {pending && (
        <span className="font-mono text-[10px] text-brass">saving…</span>
      )}
    </div>
  );
}
