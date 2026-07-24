"use client";
// Turns a note into a real project. Lives on the note detail page — the
// note's text rides along as the new project's sketch. Nothing about the
// note itself changes; this only adds a project.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createProjectFromNote } from "@/lib/plan-actions";

export function ConvertToProjectButton({
  title,
  body,
  buildings,
}: {
  title: string;
  body: string;
  buildings: { key: string; label: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [building, setBuilding] = useState(buildings[0]?.key ?? "");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="border-brass/40 text-brass/80 hover:border-brass hover:text-brass rounded-sm border border-dashed px-3 py-1.5 font-mono text-[11px] tracking-[0.16em] transition"
      >
        CONVERT TO PROJECT
      </button>
    );
  }

  if (!buildings.length) {
    return (
      <p className="text-ink-mute text-[13px]">
        Add a building in Settings → Buildings before converting notes into
        projects.
      </p>
    );
  }

  function convert() {
    startTransition(async () => {
      try {
        const id = await createProjectFromNote(building, title, body);
        toast.success(
          "Saved as a new idea in Project Plans. This note is still here too.",
        );
        if (id) router.push(`/project-plans/project/${id}`);
        setOpen(false);
      } catch (e: any) {
        toast.error(e?.message ?? "Couldn't convert this note.");
      }
    });
  }

  return (
    <div className="border-brass/30 bg-brass/5 flex flex-wrap items-center gap-2 rounded-sm border px-3 py-2">
      <span className="text-ink-mute font-mono text-[11px] tracking-[0.16em]">
        FILE UNDER
      </span>
      <select
        value={building}
        onChange={(e) => setBuilding(e.target.value)}
        className="border-paper-line bg-paper-bg/60 text-ink focus:border-brass rounded-sm border px-2 py-1 font-mono text-[12px] outline-none"
      >
        {buildings.map((b) => (
          <option key={b.key} value={b.key}>
            {b.label}
          </option>
        ))}
      </select>
      <button
        onClick={convert}
        disabled={pending}
        className="brass-button px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] disabled:opacity-50"
      >
        {pending ? "SAVING…" : "CREATE PROJECT"}
      </button>
      <button
        onClick={() => setOpen(false)}
        className="text-ink-mute hover:text-ink font-mono text-[11px]"
      >
        cancel
      </button>
    </div>
  );
}
