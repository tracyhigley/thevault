"use client";
import { useState, useTransition } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import { pickFromAtm } from "@/lib/actions";

export function AtmPickButton({
  itemId,
  picked: initial,
  size = "default",
}: {
  itemId: string;
  picked: boolean;
  /** `compact` matches build-wizard Today row action sizing. */
  size?: "default" | "compact";
}) {
  const [picked, setPicked] = useState(initial);
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => {
        const next = !picked;
        setPicked(next);
        startTransition(async () => {
          try {
            await pickFromAtm(itemId, next);
            toast.success(next ? "On today's plan." : "Returned to Project Tasks.");
          } catch (e: any) {
            toast.error(e?.message ?? "Couldn't update.");
          }
        });
      }}
      className={clsx(
        "shrink-0 whitespace-nowrap rounded-sm border font-mono tracking-wider transition",
        size === "compact" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-[10px]",
        picked
          ? "border-brass bg-brass/20 text-brass"
          : "border-brass/30 text-brass/80 hover:bg-brass/10",
        pending && "opacity-60",
      )}
    >
      {picked ? "✓ For today" : "Let's do this today"}
    </button>
  );
}
