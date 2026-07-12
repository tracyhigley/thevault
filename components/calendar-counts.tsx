"use client";

import type { Box } from "@/lib/categories";
import type { CalendarWeek } from "@/lib/calendar-planning";
import { calendarWorkLifeGroup } from "@/lib/calendar-work-life";

const UNASSIGNED = "__unassigned__";

function formatDayStat(count: number, totalDays: number): string {
  if (totalDays <= 0) return `${count}d - 0%`;
  const pct = Math.round((count / totalDays) * 100);
  return `${count}d - ${pct}%`;
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

// Tally days across the given weeks by their resolved project (override
// wins over week assignment; null = unassigned). Returns chips sorted by
// count descending, with the unassigned tally last regardless of count.
export function CalendarCounts({
  weeks,
  boxes,
  heading,
  /** Earlier-weeks block: only assigned days count; no unassigned chip. */
  assignedOnly = false,
}: {
  weeks: CalendarWeek[];
  boxes: Box[];
  heading: string;
  assignedOnly?: boolean;
}) {
  const counts = new Map<string, number>();
  for (const w of weeks) {
    for (const d of w.days) {
      if (assignedOnly && d.boxKey == null) continue;
      const key = d.boxKey ?? UNASSIGNED;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  const boxesByKey = new Map(boxes.map((b) => [b.key, b]));
  const projectChips = Array.from(counts.entries())
    .filter(([k]) => k !== UNASSIGNED)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => {
      const box = boxesByKey.get(key);
      return {
        key,
        label: box?.label ?? key,
        color: box?.color,
        count,
      };
    });
  const unassignedCount = assignedOnly ? 0 : (counts.get(UNASSIGNED) ?? 0);
  const assignedTotal = projectChips.reduce((sum, c) => sum + c.count, 0);
  const totalDays = assignedOnly
    ? assignedTotal
    : weeks.reduce((sum, w) => sum + w.days.length, 0);

  let workCount = 0;
  let otherCount = 0;
  for (const [key, count] of counts.entries()) {
    if (key === UNASSIGNED) continue;
    const box = boxesByKey.get(key);
    if (!box) continue;
    const group = calendarWorkLifeGroup(box);
    if (group === "work") workCount += count;
    else if (group === "other") otherCount += count;
  }

  if (projectChips.length === 0 && unassignedCount === 0) return null;

  return (
    <section
      aria-label={heading}
      className="rounded-sm border border-paper-line bg-paper-panel/30 px-3 py-3 md:px-4 md:py-3"
    >
      <div className="mb-2 font-mono text-[10px] tracking-[0.18em] text-ink-mute">
        {heading}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {projectChips.map((chip) => (
          <span
            key={chip.key}
            className="inline-flex items-baseline gap-2 rounded-sm border px-2 py-1 text-[12px]"
            style={{
              backgroundColor: hexToRgba(chip.color, 0.18),
              borderColor: hexToRgba(chip.color, 0.5),
            }}
          >
            <span
              className="font-mono tracking-[0.06em]"
              style={{ color: hexToRgba(chip.color, 0.95) }}
            >
              {chip.label}
            </span>
            <span className="font-mono text-[11px] text-ink-dim">
              {formatDayStat(chip.count, totalDays)}
            </span>
          </span>
        ))}
        {unassignedCount > 0 && (
          <span className="inline-flex items-baseline gap-2 rounded-sm border border-dashed border-paper-line px-2 py-1 text-[12px]">
            <span className="font-mono tracking-[0.06em] text-ink-mute">
              Unassigned
            </span>
            <span className="font-mono text-[11px] text-ink-mute">
              {formatDayStat(unassignedCount, totalDays)}
            </span>
          </span>
        )}
      </div>
      {assignedTotal > 0 && (
        <div className="mt-3 border-t border-paper-line/80 pt-3">
          <div className="mb-2 font-mono text-[10px] tracking-[0.18em] text-ink-mute">
            Work/Life Balance
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { label: "Work", count: workCount },
                { label: "Other", count: otherCount },
              ] as const
            ).map((chip) => (
              <span
                key={chip.label}
                className="inline-flex items-baseline gap-2 rounded-sm border border-paper-line bg-paper-panel/50 px-2 py-1 text-[12px]"
              >
                <span className="font-mono tracking-[0.06em] text-ink">
                  {chip.label}
                </span>
                <span className="font-mono text-[11px] text-ink-dim">
                  {formatDayStat(chip.count, assignedTotal)}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
