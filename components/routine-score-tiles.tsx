// Four small score tiles — Food, Water, Movement, Restore — each 0–100.
// Used on the Today page and at the top of the routine checklist.

import clsx from "clsx";
import { ROUTINE_GROUPS, type RoutineScores } from "@/lib/routine";

export function RoutineScoreTiles({
  scores,
  size = "md",
  className,
}: {
  scores: RoutineScores;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div className={clsx("grid grid-cols-4 gap-2", className)}>
      {ROUTINE_GROUPS.map((g) => (
        <div
          key={g.key}
          className="border-paper-line/60 bg-paper-panel/40 rounded-sm border px-2 py-1.5 text-center"
        >
          <div className="text-ink-mute font-mono text-[9px] tracking-[0.16em] uppercase">
            {g.label}
          </div>
          <div
            className={clsx(
              "text-ink font-mono tabular-nums",
              size === "sm"
                ? "text-[18px] leading-tight"
                : "text-[24px] leading-tight",
            )}
          >
            {scores[g.key]}
          </div>
        </div>
      ))}
    </div>
  );
}
