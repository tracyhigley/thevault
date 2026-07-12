"use client";
// Edit-in-place for project text fields — saves on blur, Escape reverts.
// Mirrors EditableText, routed at the projects table instead of items.

import { useState, useTransition } from "react";
import { toast } from "sonner";
import clsx from "clsx";
import { updateProjectPatch } from "@/lib/plan-actions";

export function ProjectFieldEditor({
  projectId,
  field,
  initial,
  className,
  placeholder,
  multiline = false,
  rows = 3,
}: {
  projectId: string;
  field: "title" | "why" | "done_looks_like" | "sketch" | "systems";
  initial: string | null | undefined;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}) {
  const [value, setValue] = useState(initial ?? "");
  const [pending, startTransition] = useTransition();

  function commit() {
    if (value === (initial ?? "")) return;
    const v = value === "" ? null : value;
    if (field === "title" && v === null) {
      setValue(initial ?? "");
      return;
    }
    startTransition(async () => {
      try {
        await updateProjectPatch(projectId, { [field]: v } as any);
      } catch (e: any) {
        toast.error(e?.message ?? "Couldn't save.");
      }
    });
  }

  const sharedClassName = clsx(
    "w-full bg-transparent text-[14px] leading-relaxed text-ink outline-none focus:bg-paper-bg/40 focus:ring-1 focus:ring-brass/40 rounded-sm px-1 placeholder:text-ink-mute/60",
    pending && "opacity-50",
    className,
  );

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") setValue(initial ?? "");
        }}
        placeholder={placeholder}
        rows={rows}
        className={clsx("resize-y", sharedClassName)}
      />
    );
  }

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setValue(initial ?? "");
      }}
      placeholder={placeholder}
      className={sharedClassName}
    />
  );
}
