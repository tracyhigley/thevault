"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import type { Box } from "@/lib/categories";
import type { CalendarDay, CalendarWeek } from "@/lib/calendar-planning";

// Three intents the day picker can express. The board fans these out to
// different server actions.
export type DayChange =
  | { kind: "inherit" }
  | { kind: "unassigned" }
  | { kind: "box"; boxKey: string };

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Boxes the user doesn't want offered as week/day projects on the calendar.
// They still exist on Maint Tasks/Project Tasks/Boxes — this only hides them from the
// calendar's pickers. Matched on label, case-insensitive, whitespace-collapsed.
const CALENDAR_HIDDEN_BOX_LABELS = new Set(["health", "read / watch"]);

function normalizeLabel(label: string): string {
  return label.toLowerCase().replace(/\s+/g, " ").trim();
}

function pickableBoxesFor(boxes: Box[], keepKey: string | null): Box[] {
  return boxes.filter(
    (b) =>
      !CALENDAR_HIDDEN_BOX_LABELS.has(normalizeLabel(b.label)) ||
      b.key === keepKey,
  );
}

function hexToRgba(hex: string | undefined, alpha: number): string | undefined {
  if (!hex) return undefined;
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (full.length !== 6) return undefined;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function CalendarWeekRow({
  week,
  boxes,
  todayRef,
  onSetWeek,
  onSetDay,
  onSetNote,
}: {
  week: CalendarWeek;
  boxes: Box[];
  todayRef?: (el: HTMLElement | null) => void;
  onSetWeek: (boxKey: string | null) => void;
  onSetDay: (date: string, action: DayChange) => void;
  onSetNote: (note: string | null) => void;
}) {
  const boxesByKey = new Map(boxes.map((b) => [b.key, b]));
  const weekBox = week.boxKey ? boxesByKey.get(week.boxKey) ?? null : null;
  const weekPickableBoxes = pickableBoxesFor(boxes, week.boxKey);

  // Local draft so typing feels instant; we flush to the server on blur.
  const [noteDraft, setNoteDraft] = useState<string>(week.note ?? "");
  useEffect(() => {
    setNoteDraft(week.note ?? "");
  }, [week.note]);

  function commitNote() {
    const next = noteDraft.trim();
    const current = (week.note ?? "").trim();
    if (next === current) return;
    onSetNote(next === "" ? null : next);
  }

  return (
    <section
      className={clsx(
        "rounded-sm border border-paper-line bg-paper-panel/30 px-3 py-3 md:px-4 md:py-4",
        week.isCurrentWeek && "ring-1 ring-brass/40",
      )}
    >
      <header className="flex flex-wrap items-center gap-3">
        <div className="flex shrink-0 items-baseline gap-3">
          <span className="font-mono text-[11px] tracking-[0.18em] text-ink-mute">
            {week.weekLabel.toUpperCase()}
          </span>
          {week.isCurrentWeek && (
            <span className="plaque text-[9px]">THIS WEEK</span>
          )}
        </div>

        <input
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          onBlur={commitNote}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.currentTarget as HTMLInputElement).blur();
            }
          }}
          placeholder="Notes for the week…"
          aria-label={`Notes for ${week.weekLabel}`}
          className="min-w-[140px] flex-1 rounded-sm border border-paper-line bg-paper-bg/60 px-2 py-1 text-[13px] italic text-ink-dim outline-none placeholder:text-ink-mute/50 focus:border-brass focus:not-italic focus:text-ink"
        />

        <label className="flex items-center gap-2 text-[11px] text-ink-mute">
          <span className="font-mono tracking-[0.18em]">PROJECT</span>
          <select
            value={week.boxKey ?? ""}
            onChange={(e) => onSetWeek(e.target.value || null)}
            className="rounded-sm border border-paper-line bg-paper-bg/60 px-2 py-1 text-[12px] text-ink outline-none focus:border-brass"
            style={{
              backgroundColor: hexToRgba(weekBox?.color, 0.12),
              borderColor: hexToRgba(weekBox?.color, 0.5),
            }}
          >
            <option value="">— no project —</option>
            {weekPickableBoxes.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {week.days.map((day) => (
          <DayCell
            key={day.date}
            day={day}
            weekBox={weekBox}
            boxes={boxes}
            todayRef={day.isToday ? todayRef : undefined}
            onChange={(action) => onSetDay(day.date, action)}
          />
        ))}
      </div>
    </section>
  );
}

function DayCell({
  day,
  weekBox,
  boxes,
  todayRef,
  onChange,
}: {
  day: CalendarDay;
  weekBox: Box | null;
  boxes: Box[];
  todayRef?: (el: HTMLElement | null) => void;
  onChange: (action: DayChange) => void;
}) {
  const boxesByKey = new Map(boxes.map((b) => [b.key, b]));
  const activeBox = day.boxKey ? boxesByKey.get(day.boxKey) ?? null : null;
  const color = activeBox?.color;
  const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6;
  const explicitlyUnassigned = day.overridden && day.boxKey === null;
  const dayPickableBoxes = pickableBoxesFor(
    boxes,
    day.overridden ? day.boxKey : null,
  );

  return (
    <div
      ref={todayRef ?? undefined}
      className={clsx(
        "relative flex min-h-[78px] flex-col gap-1 overflow-hidden rounded-sm border px-2 py-1.5 transition",
        "hover:border-brass/60",
        day.isToday
          ? "border-brass"
          : explicitlyUnassigned
            ? "border-dashed border-paper-line-2"
            : "border-paper-line",
        !activeBox && isWeekend && "bg-paper-bg/40",
      )}
      style={
        activeBox
          ? {
              backgroundColor: hexToRgba(color, 0.18),
              borderColor: day.isToday
                ? undefined
                : hexToRgba(color, 0.5),
            }
          : undefined
      }
    >
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[9px] tracking-[0.16em] text-ink-mute">
          {DAY_NAMES[day.dayOfWeek].toUpperCase()}
        </span>
        <span
          className={clsx(
            "font-serif text-[18px] leading-none",
            day.isToday ? "text-brass" : "text-ink",
          )}
        >
          {day.dayOfMonth}
        </span>
      </div>

      <div className="mt-auto min-h-[14px] text-[10px] leading-tight">
        {activeBox ? (
          <span
            className={clsx(
              "font-mono tracking-[0.06em]",
              day.overridden ? "text-ink" : "text-ink-dim",
            )}
            style={{ color: hexToRgba(color, 0.95) }}
          >
            {activeBox.label}
            {day.overridden && weekBox && (
              <span className="ml-1 text-ink-mute" title={`Overrides week (${weekBox.label})`}>
                ✱
              </span>
            )}
          </span>
        ) : explicitlyUnassigned && weekBox ? (
          <span
            className="font-mono tracking-[0.06em] text-ink-mute"
            title={`Off — overrides week (${weekBox.label})`}
          >
            — <span className="ml-0.5">✱</span>
          </span>
        ) : (
          <span className="text-ink-mute/60">—</span>
        )}
      </div>

      {/* Native select overlays the cell — tapping anywhere opens the
          picker. Mobile gets a native wheel for free. */}
      <select
        value={
          !day.overridden
            ? "__inherit__"
            : explicitlyUnassigned
              ? "__unassigned__"
              : (day.boxKey ?? "__inherit__")
        }
        onChange={(e) => {
          const v = e.target.value;
          if (v === "__inherit__") onChange({ kind: "inherit" });
          else if (v === "__unassigned__") onChange({ kind: "unassigned" });
          else onChange({ kind: "box", boxKey: v });
        }}
        aria-label={`Project for ${day.date}`}
        className="absolute inset-0 cursor-pointer appearance-none bg-transparent text-transparent opacity-0"
      >
        <option value="__inherit__">
          {weekBox ? `Same as week — ${weekBox.label}` : "No project"}
        </option>
        {weekBox && (
          <option value="__unassigned__">No project — just this day</option>
        )}
        {dayPickableBoxes.map((b) => (
          <option key={b.key} value={b.key}>
            {b.label}
          </option>
        ))}
      </select>
    </div>
  );
}
