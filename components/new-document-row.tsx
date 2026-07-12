"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { appendDocument } from "@/lib/actions";
import { Select } from "@/components/ui";
import { DOCUMENT_FOLDERS } from "@/lib/document-folders";

export function NewDocumentRow({
  initialFolder = "",
}: {
  initialFolder?: string;
}) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [folder, setFolder] = useState(initialFolder);
  const [pending, startTransition] = useTransition();

  function add() {
    const t = label.trim();
    if (!t || !folder) return;
    startTransition(async () => {
      try {
        await appendDocument(t, folder);
        setLabel("");
        router.refresh();
        toast.success("Document added.");
      } catch (e: unknown) {
        toast.error(
          e instanceof Error ? e.message : "Couldn’t add the document.",
        );
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-sm border border-dashed border-paper-line/60 bg-paper-panel/20 px-4 py-2 transition hover:border-brass/40">
      <span className="font-mono text-[10px] tracking-wider text-ink-mute">
        +
      </span>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        placeholder="+ New document"
        className="paper-task-title min-w-[220px] flex-1 bg-transparent text-ink placeholder:text-ink-mute outline-none"
      />
      <Select
        value={folder}
        onChange={(e) => setFolder(e.target.value)}
        tone="brass"
        className="w-[14rem] shrink-0 px-2 py-1 font-mono text-[10px]"
        aria-label="Folder for new document"
      >
        <option value="" className="bg-paper-bg">
          — choose folder —
        </option>
        {DOCUMENT_FOLDERS.map((f) => (
          <option key={f.key} value={f.key} className="bg-paper-bg">
            {f.label}
          </option>
        ))}
      </Select>
      <button
        type="button"
        onClick={add}
        disabled={pending || !label.trim() || !folder}
        className="rounded-sm border border-brass/40 px-3 py-1 font-mono text-[10px] tracking-[0.16em] text-brass transition hover:bg-brass/10 disabled:opacity-40"
      >
        ADD
      </button>
      {pending && (
        <span className="font-mono text-[10px] text-brass">saving…</span>
      )}
    </div>
  );
}
