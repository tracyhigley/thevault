"use client";
// The project log — dated one-liners, like a site logbook. Quick capture:
// type, Enter, done. Newest entries shown first.

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addProjectLog } from "@/lib/plan-actions";
import type { ProjectLogEntry } from "@/lib/project-phases";

function todayLocal(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function ProjectLog({
  projectId,
  initial,
}: {
  projectId: string;
  initial: ProjectLogEntry[];
}) {
  const [entries, setEntries] = useState<ProjectLogEntry[]>(initial);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  function add() {
    const clean = text.trim();
    if (!clean) return;
    const entry = { date: todayLocal(), text: clean };
    setText("");
    setEntries([...entries, entry]);
    startTransition(async () => {
      try {
        await addProjectLog(projectId, entry.text, entry.date);
      } catch (e: any) {
        setEntries(entries);
        setText(clean);
        toast.error(e?.message ?? "Couldn't save the note.");
      }
    });
  }

  const newestFirst = [...entries].reverse();

  return (
    <div>
      {newestFirst.length === 0 ? (
        <p className="text-[13px] text-ink-mute">
          No notes yet — a line or two counts.
        </p>
      ) : (
        <div className="divide-y divide-vault-line/50">
          {newestFirst.map((e, i) => (
            <div key={`${e.date}-${i}`} className="flex gap-3 py-2 text-[13px]">
              <span className="shrink-0 font-mono text-[11px] text-ink-mute">
                {e.date.slice(5)}
              </span>
              <span className="text-ink-dim">{e.text}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
          placeholder="Add a quick note…"
          className="min-w-0 flex-1 rounded-sm border border-vault-line bg-vault-bg/60 px-2 py-1.5 text-[13px] text-ink outline-none placeholder:text-ink-mute/60 focus:border-brass"
        />
        <button
          onClick={add}
          disabled={pending || !text.trim()}
          className="brass-button px-4 py-1.5 font-mono text-[10px] tracking-[0.2em] text-[#2a1c08] disabled:opacity-50"
        >
          ADD
        </button>
      </div>
    </div>
  );
}
