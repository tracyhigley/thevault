"use client";
// Small 1/2/3 dropdown on a Project Plan's title block — used for Priority
// and Days to Build. Saves on change through updateProjectPatch; "—" clears.

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProjectPatch } from "@/lib/plan-actions";

const CHOICES = [1, 2, 3] as const;

export function ProjectNumberSelect({
  projectId,
  field,
  label,
  initial,
}: {
  projectId: string;
  field: "priority" | "days_to_build";
  label: string;
  initial: number | null;
}) {
  const [value, setValue] = useState<number | null>(initial);
  const [pending, startTransition] = useTransition();

  return (
    <label className="text-ink-mute flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] uppercase">
      {label}
      <select
        value={value ?? ""}
        disabled={pending}
        onChange={(e) => {
          const prev = value;
          const next = e.target.value === "" ? null : Number(e.target.value);
          setValue(next);
          startTransition(async () => {
            try {
              await updateProjectPatch(projectId, { [field]: next });
            } catch (err: any) {
              setValue(prev);
              toast.error(err?.message ?? `Couldn't save ${label}.`);
            }
          });
        }}
        className="border-paper-line bg-paper-bg text-ink hover:border-brass/40 focus:border-brass rounded-sm border px-2 py-1 font-mono text-[12px] tracking-normal outline-none disabled:opacity-50"
      >
        <option value="">—</option>
        {CHOICES.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
}
