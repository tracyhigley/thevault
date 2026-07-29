"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { undoTodayItemDone } from "@/lib/actions";

/** Puts a finished Admin Task back on today's plan as upcoming. */
export function UndoDoneButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      title="Move back to Today"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          try {
            await undoTodayItemDone(itemId);
            toast.success("Moved back to Today.");
            router.refresh();
          } catch (e: any) {
            toast.error(e?.message ?? "Couldn't undo done.");
          }
        });
      }}
      className="shrink-0 rounded-sm border border-paper-line/70 px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] text-ink-mute transition hover:border-brass/50 hover:text-brass disabled:opacity-40"
    >
      UNDO
    </button>
  );
}
