"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveDayInputsPartial } from "@/lib/actions";
import { formatEndOfDay12h, parseTimeOnDate } from "@/lib/daily-plan";

export function TodayEndOfDayEditor({
  date,
  endOfDay,
}: {
  date: string;
  endOfDay: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(() => {
    try {
      return formatEndOfDay12h(endOfDay, date);
    } catch {
      return endOfDay;
    }
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function handleSave() {
    let normalizedEnd: string;
    let hoursAvailable: number;
    try {
      normalizedEnd = formatEndOfDay12h(value.trim(), date);
      const end = parseTimeOnDate(normalizedEnd, date);
      const ms = end.getTime() - Date.now();
      hoursAvailable =
        Math.round(Math.max(0, Math.min(24, ms / 3_600_000)) * 100) / 100;
    } catch {
      toast.error("Couldn't read that time — try 4:30 PM.");
      return;
    }
    startTransition(async () => {
      try {
        await saveDayInputsPartial({
          date,
          hours_available: hoursAvailable,
          end_of_day: normalizedEnd,
          reference_now: new Date().toISOString(),
          reference_tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        setValue(normalizedEnd);
        setEditing(false);
        router.refresh();
        toast.success("End of day updated.");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Couldn't save.");
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      try {
        setValue(formatEndOfDay12h(endOfDay, date));
      } catch {
        setValue(endOfDay);
      }
      setEditing(false);
    }
  }

  const displayValue = (() => {
    try {
      return formatEndOfDay12h(endOfDay, date);
    } catch {
      return endOfDay;
    }
  })();

  if (editing) {
    return (
      <div className="mt-2 flex items-center gap-2">
        <span className="text-ink-mute text-[13px]">End of day:</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={pending}
          placeholder="e.g. 4:30 PM"
          className="border-paper-line bg-paper-panel/60 text-ink placeholder:text-ink-mute focus:border-brass w-24 rounded-sm border px-2 py-1 font-mono text-[13px] outline-none"
        />
        {pending && (
          <span className="text-ink-mute text-[11px]">Saving…</span>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-ink-dim hover:text-brass mt-2 flex items-center gap-1 text-[13px] transition"
      title="Click to edit end of day"
    >
      <span className="text-ink-mute">End of day:</span>
      <span className="font-mono underline decoration-dotted underline-offset-2">
        {displayValue}
      </span>
    </button>
  );
}
