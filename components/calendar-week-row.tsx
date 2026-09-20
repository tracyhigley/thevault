"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import clsx from "clsx";
import type { Box } from "@/lib/categories";
import type { CalendarDay, CalendarWeek } from "@/lib/calendar-planning";
import {
  DAY_NOTE_MAX,
  projectsForBuilding,
  type CalendarProjectOption,
  type DayPlan,
} from "@/lib/calendar-day-plan";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Sentinel <option> value for "type my own text instead of a project".
const CUSTOM = "__custom__";

// Boxes the user doesn't want offered as buildings on the calendar.
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
  projects,
  todayRef,
  onSetDay,
  onSetNote,
}: {
  week: CalendarWeek;
  boxes: Box[];
  projects: CalendarProjectOption[];
  todayRef?: (el: HTMLElement | null) => void;
  onSetDay: (date: string, plan: DayPlan) => void;
  onSetNote: (note: string | null) => void;
}) {
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
      </header>

      <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
        {week.days.map((day) => (
          <DayCell
            key={day.date}
            day={day}
            boxes={boxes}
            projects={projects}
            todayRef={day.isToday ? todayRef : undefined}
            onChange={(plan) => onSetDay(day.date, plan)}
          />
        ))}
      </div>
    </section>
  );
}

// A dropdown that shows wrapped label text with a chevron, with the native
// <select> laid invisibly over it — tapping anywhere opens the picker, and
// phones get the native wheel for free.
function OverlaySelect({
  display,
  placeholder,
  ariaLabel,
  value,
  onChange,
  className,
  style,
  children,
}: {
  display: string | null;
  placeholder: string;
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      className={clsx(
        "relative rounded-sm border px-1.5 py-1 text-[11px] leading-tight transition hover:border-brass/60",
        className,
      )}
      style={style}
    >
      <div className="flex items-start justify-between gap-1">
        <span className={display ? "break-words" : "text-ink-mute/60"}>
          {display ?? placeholder}
        </span>
        <span aria-hidden className="mt-px shrink-0 text-[9px] text-ink-mute">
          ▾
        </span>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent text-transparent opacity-0"
      >
        {children}
      </select>
    </div>
  );
}

function DayCell({
  day,
  boxes,
  projects,
  todayRef,
  onChange,
}: {
  day: CalendarDay;
  boxes: Box[];
  projects: CalendarProjectOption[];
  todayRef?: (el: HTMLElement | null) => void;
  onChange: (plan: DayPlan) => void;
}) {
  const boxesByKey = new Map(boxes.map((b) => [b.key, b]));
  const activeBox = day.boxKey ? (boxesByKey.get(day.boxKey) ?? null) : null;
  const color = activeBox?.color;
  const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6;
  const buildingOptions = pickableBoxesFor(boxes, day.boxKey);

  const projectOptions = projectsForBuilding(
    projects,
    day.boxKey,
    day.projectId,
  );
  const chosenProject = day.projectId
    ? (projects.find((p) => p.id === day.projectId) ?? null)
    : null;

  // "Type my own" mode: on whenever the day has typed text, or right after
  // the user picks the option (before they've typed anything).
  const [typing, setTyping] = useState<boolean>(day.note !== null);
  const [draft, setDraft] = useState<string>(day.note ?? "");
  useEffect(() => {
    setDraft(day.note ?? "");
    if (day.note !== null) setTyping(true);
  }, [day.note]);

  function onBuildingChange(v: string) {
    if (!v) {
      // No building means nothing else on the day makes sense either.
      setTyping(false);
      setDraft("");
      onChange({ boxKey: null, projectId: null, note: null });
      return;
    }
    // The project belonged to the old building, so it goes; typed text stays.
    onChange({ boxKey: v, projectId: null, note: day.note });
  }

  function onProjectChange(v: string) {
    if (v === CUSTOM) {
      setTyping(true);
      // Typed text replaces the project.
      if (day.projectId) {
        onChange({ boxKey: day.boxKey, projectId: null, note: day.note });
      }
      return;
    }
    setTyping(false);
    setDraft("");
    onChange({ boxKey: day.boxKey, projectId: v || null, note: null });
  }

  function commitDraft() {
    const next = draft.trim();
    if (next === (day.note ?? "")) {
      if (next === "") setTyping(false);
      return;
    }
    if (next === "") setTyping(false);
    onChange({ boxKey: day.boxKey, projectId: null, note: next || null });
  }

  const projectValue = typing ? CUSTOM : (day.projectId ?? "");
  const projectDisplay = typing
    ? "✎ Custom text"
    : day.projectId
      ? (chosenProject?.title ?? "(removed project)")
      : null;

  return (
    <div
      ref={todayRef ?? undefined}
      className={clsx(
        "relative flex min-h-[78px] flex-col gap-1.5 rounded-sm border px-2 py-1.5 transition",
        day.isToday ? "border-brass" : "border-paper-line",
        !activeBox && isWeekend && "bg-paper-bg/40",
      )}
      style={
        activeBox
          ? {
              backgroundColor: hexToRgba(color, 0.18),
              borderColor: day.isToday ? undefined : hexToRgba(color, 0.5),
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

      <OverlaySelect
        display={activeBox?.label ?? null}
        placeholder="Building"
        ariaLabel={`Building for ${day.date}`}
        value={day.boxKey ?? ""}
        onChange={onBuildingChange}
        className={clsx(
          "font-mono tracking-[0.06em]",
          activeBox ? "" : "border-dashed border-paper-line",
        )}
        style={
          activeBox
            ? {
                color: hexToRgba(color, 0.95),
                borderColor: hexToRgba(color, 0.5),
                backgroundColor: hexToRgba(color, 0.12),
              }
            : undefined
        }
      >
        <option value="">No building</option>
        {buildingOptions.map((b) => (
          <option key={b.key} value={b.key}>
            {b.label}
          </option>
        ))}
      </OverlaySelect>

      {day.boxKey && (
        <>
          <OverlaySelect
            display={projectDisplay}
            placeholder="Project (optional)"
            ariaLabel={`Project for ${day.date}`}
            value={projectValue}
            onChange={onProjectChange}
            className="border-paper-line bg-paper-bg/40 text-ink-dim"
          >
            <option value="">No project</option>
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.phase === "planning" ? `${p.title} (planning)` : p.title}
              </option>
            ))}
            {day.projectId && !chosenProject && (
              <option value={day.projectId}>(removed project)</option>
            )}
            <option value={CUSTOM}>✎ Type my own…</option>
          </OverlaySelect>

          {typing && (
            <input
              value={draft}
              autoFocus={day.note === null}
              maxLength={DAY_NOTE_MAX}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitDraft}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  (e.currentTarget as HTMLInputElement).blur();
                }
              }}
              placeholder="e.g. Dr B 3 pm"
              aria-label={`Text for ${day.date}`}
              className="w-full rounded-sm border border-paper-line bg-paper-bg/60 px-1.5 py-1 text-[11px] leading-tight text-ink outline-none placeholder:text-ink-mute/50 focus:border-brass"
            />
          )}
        </>
      )}
    </div>
  );
}
