"use client";

// The "usual radio button" — one click marks a Today task done. Works
// uniformly for plain Maint Tasks items and Project-Task-linked items;
// completeTodayItem branches server-side on which kind it is. Once done,
// the item drops off today_order (or gets soft-deleted, for project
// tasks) so it disappears from the card on the next render — the toast's
// Undo action is the only way back for Maint Tasks.

import { useState, useTransition } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import { completeTodayItem, undoTodayItemDone } from "@/lib/actions";

export function TodayDoneToggle({ itemId }: { itemId: string }) {
  const [pending, startTransition] = useTransition();
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const disabled = pending || Date.now() < cooldownUntil;

  return (
    <button
      type="button"
      title="Mark done"
      aria-label="Mark done"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        // Prevent rapid double-clicks while the row is about to vanish.
        setCooldownUntil(Date.now() + 700);
        startTransition(async () => {
          try {
            const { archivedAs } = await completeTodayItem(itemId);
            if (archivedAs === "maint") {
              toast.success("Done — moved to your Done log.", {
                action: {
                  label: "Undo",
                  onClick: () => {
                    startTransition(async () => {
                      await undoTodayItemDone(itemId);
                    });
                  },
                },
              });
            } else {
              toast.success("Done — struck through on the Project Plan.");
            }
          } catch (e: any) {
            toast.error(e?.message ?? "Couldn't mark done.");
          }
        });
      }}
      className={clsx(
        "h-5 w-5 shrink-0 rounded-full border transition disabled:cursor-not-allowed disabled:opacity-60",
        "border-brass/40 hover:border-brass",
      )}
    />
  );
}
