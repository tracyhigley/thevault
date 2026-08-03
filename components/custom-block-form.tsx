"use client";
import { useState, useTransition } from "react";
import { addCustomBlock } from "@/lib/actions";

// Quick-add for an ad-hoc Today task that isn't sourced from Maint Tasks
// or Project Tasks. Lands in the Maint Tasks card (same box, same shape —
// just tagged CUSTOM_BLOCK so it never lands on the Maint Tasks page
// itself). No time-of-day pinning anymore — Today is three cards, not a
// timed schedule.
export function CustomBlockForm() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState(30);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-sm border border-dashed border-brass/40 py-2 font-mono text-[10px] tracking-[0.24em] text-brass/70 hover:border-brass"
      >
        + ADD A CUSTOM TASK
      </button>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      await addCustomBlock({ title, minutes });
      setTitle("");
      setMinutes(30);
      setOpen(false);
    });
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-sm border border-brass/40 bg-paper-panel/60 p-3"
    >
      <input
        autoFocus
        placeholder="What's the task?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="paper-task-title w-full bg-transparent text-ink outline-none placeholder:text-ink-mute"
      />
      <div className="mt-3 flex items-center gap-3 font-mono text-[11px] text-ink-mute">
        <label className="flex items-center gap-2">
          <span className="eyebrow">Min</span>
          <input
            type="number"
            min="5"
            max="480"
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="w-16 rounded-sm border border-paper-line bg-paper-bg/60 px-2 py-1 text-right text-brass outline-none focus:border-brass"
          />
        </label>
        <span className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-sm border border-paper-line px-3 py-1 text-ink-mute hover:border-rust hover:text-rust"
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={pending}
            className="brass-button px-4 py-1.5 font-mono text-[10px] tracking-[0.24em] disabled:opacity-50"
          >
            ADD
          </button>
        </span>
      </div>
    </form>
  );
}
