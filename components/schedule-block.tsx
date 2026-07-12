"use client";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setItemState, softDeleteItem } from "@/lib/actions";
import { EditableText } from "@/components/editable-text";
import type { ScheduledBlock } from "@/lib/daily-plan";

const BUCKET_COLOR: Record<string, string> = {
  STRESSOR: "border-l-rust",
  TIME_SENSITIVE: "border-l-amber-500",
  MUST_DO: "border-l-sky-600",
  OTHER_ADMIN: "border-l-ink-mute",
  ATM_PICK: "border-l-teal",
  CUSTOM: "border-l-ink-mute",
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function formatAreaLabel(raw: string): string {
  return raw
    .trim()
    .replace(/__+/g, " & ")
    .replace(/_/g, " ")
    .toLowerCase();
}

// Calmer block: one click marks done. Secondary actions (Skip / Delete)
// hidden under a quiet "···" — discoverable but not visible at rest.
export function ScheduleBlock({
  block,
  state = "upcoming",
}: {
  block: ScheduledBlock;
  state?: "upcoming" | "active" | "done" | "skipped" | "overrun";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const isDone = state === "done";
  const doneButtonDisabled = pending || Date.now() < cooldownUntil;

  return (
    <div
      className={clsx(
        "group relative flex items-center gap-4 rounded-sm border-l-2 bg-paper-panel/60 px-4 py-3 transition",
        BUCKET_COLOR[block.bucket] ?? "border-l-ink-mute",
        isDone && "opacity-50",
        state === "active" &&
          "ring-1 ring-brass/70 shadow-[0_0_20px_rgba(201,161,74,0.18)]",
        state === "skipped" && "border-dashed opacity-40",
        pending && "opacity-70",
      )}
    >
      <div className="flex w-16 shrink-0 flex-col items-end font-mono text-[11px] tracking-wider text-ink-mute">
        <span>{fmtTime(block.start)}</span>
        {block.overflow && (
          <span className="mt-0.5 text-[9px] tracking-wider text-rust/80">
            past EOD
          </span>
        )}
      </div>
      <button
        title={
          isDone
            ? "Mark not done"
            : "Mark done — the item stays in your boxes"
        }
        onClick={() => {
          if (doneButtonDisabled) return;
          // Prevent rapid follow-up clicks while rows are reordering.
          setCooldownUntil(Date.now() + 700);
          startTransition(async () => {
            try {
              await setItemState(
                block.itemId,
                isDone ? "upcoming" : "done",
              );
              if (!isDone) {
                toast.success("Done. Still safe in your boxes.", {
                  action: {
                    label: "Undo",
                    onClick: () => {
                      startTransition(async () => {
                        await setItemState(block.itemId, "upcoming");
                      });
                    },
                  },
                });
              }
            } catch (e: any) {
              toast.error(e?.message ?? "Couldn't mark done.");
            }
          });
        }}
        disabled={doneButtonDisabled}
        className={clsx(
          "h-5 w-5 shrink-0 rounded-full border transition disabled:cursor-not-allowed disabled:opacity-60",
          isDone
            ? "border-brass bg-brass"
            : "border-brass/40 hover:border-brass",
        )}
        aria-label="Mark done"
      />
      <div className="min-w-0 flex-1">
        <EditableText
          itemId={block.itemId}
          field="title"
          initial={block.title}
          multiline
          className={clsx(
            "paper-task-title w-full whitespace-normal break-words px-0 leading-snug",
            isDone && "line-through text-ink-mute",
          )}
          placeholder="(no title)"
        />
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-mute">
          {block.area && (
            <span className="font-mono text-[10px] tracking-wider">
              {formatAreaLabel(block.area)}
            </span>
          )}
          <span>{block.minutes} min</span>
        </div>
      </div>
      <div className="relative">
        <button
          title="More"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-sm font-mono text-[14px] text-ink-mute opacity-30 transition hover:bg-paper-bg/40 hover:text-brass group-hover:opacity-100"
        >
          ···
        </button>
        {menuOpen && (
          <div
            onClick={() => setMenuOpen(false)}
            className="absolute right-0 top-9 z-10 flex w-32 flex-col gap-px rounded-sm border border-paper-line bg-paper-panel shadow-xl"
          >
            <MenuButton
              onClick={() =>
                startTransition(async () => {
                  await setItemState(block.itemId, "skipped");
                  router.refresh();
                })
              }
            >
              Skip today
            </MenuButton>
            <MenuButton
              onClick={() =>
                startTransition(async () => {
                  await softDeleteItem(block.itemId);
                })
              }
            >
              Delete
            </MenuButton>
          </div>
        )}
      </div>
    </div>
  );
}

function MenuButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 text-left text-[12px] text-ink hover:bg-paper-bg/60 hover:text-brass"
    >
      {children}
    </button>
  );
}
