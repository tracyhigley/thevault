"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { softDeleteItem } from "@/lib/actions";

/** Removes the item from Admin Tasks — same data path as delete, different intent. */
export function CounterDoneButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label="Mark done"
      title="Done"
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("Mark this done? It will be removed from Admin Tasks."))
          return;
        startTransition(async () => {
          await softDeleteItem(itemId);
          router.refresh();
        });
      }}
      className="shrink-0 rounded-sm border border-emerald-600/35 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-emerald-700 transition hover:bg-emerald-600/10 hover:text-emerald-800 disabled:opacity-40"
    >
      Done
    </button>
  );
}
