"use client";

import clsx from "clsx";

/** 0–1440 inclusive; empty or invalid → undefined (omit on save). */
export function parseMinutesField(raw: string): number | undefined {
  const t = raw.trim();
  if (t === "") return undefined;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0 || n > 1440) return undefined;
  return Math.round(n);
}

/** Compact minutes field (same pattern as Field Notes triage). */
export function MinutesInlineInput({
  value,
  onChange,
  id,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  id?: string;
  "aria-label"?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-baseline gap-1 rounded-sm border bg-paper-bg/40 px-1.5 py-0.5 transition focus-within:border-brass",
        value ? "border-brass/40" : "border-paper-line",
      )}
    >
      <span
        className={clsx(
          "font-mono text-[10px]",
          value ? "text-brass/70" : "text-ink-mute/60",
        )}
      >
        ⏱
      </span>
      <input
        id={id}
        aria-label={ariaLabel}
        type="number"
        min={0}
        max={1440}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className="w-10 bg-transparent text-right font-mono text-[11px] text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
      />
      <span className="font-mono text-[9px] text-ink-mute/60">min</span>
    </span>
  );
}
