"use client";

import { keyParts } from "@/lib/shortcuts";
import clsx from "clsx";

// <Kbd keys="g d" /> renders two chips with a small gap.
// <Kbd keys="mod+k" /> renders one chord chip with ⌘ + K joined.
export function Kbd({
  keys,
  className,
  size = "sm",
}: {
  keys: string;
  className?: string;
  size?: "sm" | "xs";
}) {
  const chords = keyParts(keys);
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 align-middle font-mono text-ink-mute",
        className,
      )}
    >
      {chords.map((chord, ci) => (
        <span key={ci} className="inline-flex items-center gap-0.5">
          {chord.map((k, ki) => (
            <kbd
              key={ki}
              className={clsx(
                "inline-flex items-center justify-center rounded-[3px] border border-paper-line/80 bg-paper-panel/60 px-1 leading-none",
                size === "sm" ? "min-w-[18px] h-[18px] text-[10px]" : "min-w-[14px] h-[14px] text-[9px]",
              )}
            >
              {k}
            </kbd>
          ))}
        </span>
      ))}
    </span>
  );
}
