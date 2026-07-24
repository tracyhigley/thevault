"use client";

import { toast } from "sonner";
import { DOCUMENT_TABLE_MARKDOWN } from "@/lib/document-table-template";

export function CopyTableMarkdownButton() {
  function copy() {
    void navigator.clipboard
      .writeText(DOCUMENT_TABLE_MARKDOWN)
      .then(() =>
        toast.success("Copied. Open a note, tap EDIT, and paste."),
      )
      .catch(() => toast.error("Couldn't copy."));
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="w-fit rounded-sm border border-paper-line bg-paper-panel/40 px-3 py-1.5 text-[12px] text-ink-mute transition hover:border-brass/40 hover:text-brass"
    >
      Copy table markdown
    </button>
  );
}
