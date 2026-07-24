"use client";
// Delete a note from within the note itself — replaces the old REMOVE
// row inside Settings > Notes. Removing the settings.documents entry is
// enough: the note stops resolving anywhere (hub, building, /documents/
// <slug>), while the underlying item/body is left alone, same as the old
// Settings behavior.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteDocument } from "@/lib/actions";

export function DeleteNoteButton({
  docKey,
  label,
  backHref,
}: {
  docKey: string;
  label: string;
  backHref: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded-sm border border-dashed border-paper-line px-3 py-1.5 font-mono text-[11px] tracking-[0.16em] text-ink-mute transition hover:border-rust hover:text-rust"
      >
        DELETE NOTE
      </button>
    );
  }

  function confirmDelete() {
    startTransition(async () => {
      try {
        await deleteDocument(docKey);
        toast.success(`"${label}" deleted.`);
        router.push(backHref);
        router.refresh();
      } catch (e: any) {
        toast.error(e?.message ?? "Couldn't delete this note.");
        setConfirming(false);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-sm border border-rust/40 bg-rust/5 px-3 py-2">
      <span className="font-mono text-[11px] tracking-[0.16em] text-rust">
        DELETE “{label}”?
      </span>
      <button
        onClick={confirmDelete}
        disabled={pending}
        className="rounded-sm border border-rust/60 px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-rust transition hover:bg-rust/10 disabled:opacity-50"
      >
        {pending ? "DELETING…" : "CONFIRM"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="font-mono text-[11px] text-ink-mute hover:text-ink"
      >
        cancel
      </button>
    </div>
  );
}
