"use client";
import { useEffect, useState, useTransition } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateItemPatch } from "@/lib/actions";
import { Select } from "./ui";

// Compact box-key picker. Admin Tasks rows set `area`; Project Tasks rows set `category`.

export function AreaPill({
  itemId,
  initial,
  options,
  field = "area",
  className,
}: {
  itemId: string;
  initial?: string | null;
  options: { key: string; label: string }[];
  field?: "area" | "category";
  /** Merged onto the `<select>` (e.g. compact chip sizing on Project Tasks). */
  className?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial ?? "");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setValue(initial ?? "");
  }, [initial]);

  return (
    <Select
      tone="brass"
      value={value}
      className={clsx(className, pending && "opacity-50")}
      onChange={(e) => {
        const v = e.target.value;
        setValue(v);
        startTransition(async () => {
          const r = await updateItemPatch(
            itemId,
            field === "category"
              ? { category: v || null, area: null }
              : { area: v || null },
          );
          if (!r.ok) {
            toast.error(r.error);
            setValue(initial ?? "");
            return;
          }
          router.refresh();
        });
      }}
    >
      <option className="bg-vault-bg" value="">
        — box —
      </option>
      {options.map((o) => (
        <option key={o.key} className="bg-vault-bg" value={o.key}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}
