"use client";

// Loose notes for the day — persists across navigation (localStorage, keyed
// by date) but not something we bother syncing anywhere. New date (or a
// day rebuild that lands on the same date) is free to start blank.
import { useEffect, useRef, useState } from "react";

function storageKey(date: string) {
  return `blueprint:scratchpad:${date}`;
}

export function DayScratchpad({
  date,
  className = "",
}: {
  date: string;
  className?: string;
}) {
  const [value, setValue] = useState("");
  const loaded = useRef(false);

  useEffect(() => {
    loaded.current = false;
    try {
      setValue(window.localStorage.getItem(storageKey(date)) ?? "");
    } catch {
      setValue("");
    }
    loaded.current = true;
  }, [date]);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      if (value) {
        window.localStorage.setItem(storageKey(date), value);
      } else {
        window.localStorage.removeItem(storageKey(date));
      }
    } catch {
      // ignore (private browsing / storage disabled)
    }
  }, [value, date]);

  return (
    <div
      className={`rounded-sm border border-paper-line bg-paper-panel/60 p-2 ${className}`}
    >
      <div className="eyebrow text-ink-mute">Scratchpad</div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Jot a note…"
        rows={3}
        className="mt-1 w-full resize-none bg-transparent text-[13px] leading-snug text-ink outline-none placeholder:text-ink-mute"
      />
    </div>
  );
}
