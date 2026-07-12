"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import clsx from "clsx";
import { updateItemPatch } from "@/lib/actions";
import { FlagIcon, type FlagKind } from "./flag-icons";

export function EditableText({
  itemId,
  field,
  initial,
  className,
  placeholder,
  numeric = false,
  multiline = false,
}: {
  itemId: string;
  field:
    | "title"
    | "minutes"
    | "area"
    | "category"
    | "person"
    | "tag"
    | "notes"
    | "today_order";
  initial: string | number | null | undefined;
  className?: string;
  placeholder?: string;
  numeric?: boolean;
  multiline?: boolean;
}) {
  const [value, setValue] = useState(initial ?? "");
  const [pending, startTransition] = useTransition();

  function commit() {
    if (String(value) === String(initial ?? "")) return;
    const v: any = numeric
      ? value === ""
        ? null
        : Number(value)
      : value === ""
        ? null
        : value;
    startTransition(async () => {
      const r = await updateItemPatch(itemId, { [field]: v } as any);
      if (!r.ok) toast.error(r.error);
    });
  }

  const sharedClassName = clsx(
    "bg-transparent outline-none focus:bg-paper-bg/40 focus:ring-1 focus:ring-brass/40 rounded-sm px-1",
    pending && "opacity-50",
    className,
  );

  if (multiline) {
    return (
      <textarea
        value={value as any}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") setValue(initial ?? "");
        }}
        placeholder={placeholder}
        rows={2}
        className={clsx("resize-none", sharedClassName)}
      />
    );
  }

  return (
    <input
      value={value as any}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setValue(initial ?? "");
      }}
      placeholder={placeholder}
      type={numeric ? "number" : "text"}
      className={sharedClassName}
    />
  );
}

/** Same visuals as EditableFlag, for local state before insert (e.g. new Admin Tasks row). */
export function CounterFlagDraft({
  on,
  onChange,
  kind,
  activeClassName,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  kind: FlagKind;
  activeClassName: string;
}) {
  return (
    <button
      type="button"
      title={
        kind === "urgent" ? "Urgent" : kind === "must" ? "Must-Do" : "Should"
      }
      onClick={() => onChange(!on)}
      className={clsx(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-sm leading-none transition",
        on ? activeClassName : "text-ink-mute/40 hover:text-ink-mute",
      )}
      aria-pressed={on}
    >
      <FlagIcon kind={kind} filled={on} />
    </button>
  );
}

// Visual key:
//   urgent (⚡ lightning) → time pressure, amber (see Admin Tasks / Field Notes)
//   must   (★ star)       → required / anchor, brass color
//   should (◎ target)     → recommended / strong nudge, emerald
// Each renders an outline when OFF (still clearly that flag) and fills when ON.
export function EditableFlag({
  itemId,
  field,
  initial,
  kind,
  className,
}: {
  itemId: string;
  field: "urgent" | "must" | "should" | "pinned";
  initial: boolean;
  kind: FlagKind;
  className?: string;
}) {
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();
  return (
    <button
      title={
        kind === "urgent" ? "Urgent" : kind === "must" ? "Must-Do" : "Should"
      }
      onClick={() => {
        const prev = on;
        const next = !on;
        setOn(next);
        startTransition(async () => {
          const r = await updateItemPatch(itemId, { [field]: next } as any);
          if (!r.ok) {
            setOn(prev);
            toast.error(r.error);
          }
        });
      }}
      className={clsx(
        "flex h-6 w-6 items-center justify-center rounded-sm leading-none transition",
        on ? className : "text-ink-mute/40 hover:text-ink-mute",
        pending && "opacity-50",
      )}
    >
      <FlagIcon kind={kind} filled={on} />
    </button>
  );
}
