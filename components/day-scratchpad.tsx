"use client";

// Loose notes for the day — synced to day_inputs.scratchpad so it's the
// same note on every device, not just the browser that typed it (used to
// be localStorage-only, which is why it showed up on mobile but never on
// desktop). Debounced autosave while typing, plus an immediate save on
// blur so navigating away doesn't strand unsaved text.
import { useEffect, useRef, useState, useTransition } from "react";
import { saveDayScratchpad } from "@/lib/actions";

export function DayScratchpad({
  date,
  initial,
  className = "",
}: {
  date: string;
  initial: string | null;
  className?: string;
}) {
  const [value, setValue] = useState(initial ?? "");
  const [, startTransition] = useTransition();
  const loadedDate = useRef(date);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef(initial ?? "");

  // Only reseed from the server when the date actually changes underneath
  // us (a new day) — not on every revalidate, or we'd clobber mid-typing.
  useEffect(() => {
    if (loadedDate.current !== date) {
      loadedDate.current = date;
      lastSaved.current = initial ?? "";
      setValue(initial ?? "");
    }
  }, [date, initial]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function save(text: string) {
    if (text === lastSaved.current) return;
    lastSaved.current = text;
    startTransition(async () => {
      try {
        await saveDayScratchpad(date, text);
      } catch {
        // best-effort — leave the typed text on screen either way
      }
    });
  }

  function handleChange(next: string) {
    setValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(next), 800);
  }

  return (
    <div
      className={`rounded-sm border border-paper-line bg-paper-panel/60 p-2 ${className}`}
    >
      <div className="eyebrow text-ink-mute">Scratchpad</div>
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          save(value);
        }}
        placeholder="Jot a note…"
        rows={3}
        className="mt-1 w-full resize-none bg-transparent text-[13px] leading-snug text-ink outline-none placeholder:text-ink-mute"
      />
    </div>
  );
}
