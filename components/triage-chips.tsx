"use client";
import { useTransition } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import { hardDeleteItem, moveItemToBox, softDeleteItem } from "@/lib/actions";

export function TriageChips({
  itemId,
  targets,
  deleteLabel = "Dismiss",
  deleteHard = false,
}: {
  itemId: string;
  targets: { label: string; box: string }[];
  /** Label for the trailing remove control (default: Dismiss). */
  deleteLabel?: string;
  /** When true, permanently deletes the row instead of soft-delete. */
  deleteHard?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className={clsx("flex gap-1", pending && "opacity-50")}>
      {targets.map((t) => (
        <button
          key={t.box}
          onClick={() =>
            startTransition(async () => {
              try {
                await moveItemToBox(itemId, t.box);
                toast.success(`Moved ${t.label.replace("→ ", "to ")}.`);
              } catch {
                toast.error("Couldn't move.");
              }
            })
          }
          className="rounded-sm border border-brass/40 px-2 py-1 font-mono text-[10px] tracking-wider text-brass hover:bg-brass/10"
        >
          {t.label}
        </button>
      ))}
      <button
        onClick={() =>
          startTransition(async () => {
            try {
              if (deleteHard) {
                await hardDeleteItem(itemId);
                toast.success("Deleted.");
              } else {
                await softDeleteItem(itemId);
                toast.success("Dismissed.");
              }
            } catch {
              toast.error(deleteHard ? "Couldn't delete." : "Couldn't dismiss.");
            }
          })
        }
        className="rounded-sm border border-paper-line px-2 py-1 font-mono text-[10px] tracking-wider text-ink-mute transition hover:border-rust hover:text-rust"
      >
        {deleteLabel}
      </button>
    </div>
  );
}
