"use client";
// Soft-deletes a project (reversible from the DB). Keeps a confirm — unlike
// Field Notes dismiss, this is infrequent and the project may hold real writing.

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteProject } from "@/lib/plan-actions";

export function DeleteProjectButton({
  projectId,
  backHref,
}: {
  projectId: string;
  backHref: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function remove() {
    if (
      !confirm(
        "Remove this project from your project plans? Its notes go with it (recoverable if you change your mind).",
      )
    )
      return;
    startTransition(async () => {
      try {
        await deleteProject(projectId);
        router.push(backHref);
      } catch (e: any) {
        toast.error(e?.message ?? "Couldn't remove the project.");
      }
    });
  }

  return (
    <button
      onClick={remove}
      disabled={pending}
      className="rounded-sm border border-vault-line px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-ink-mute transition hover:border-rust hover:text-rust disabled:opacity-50"
    >
      REMOVE FROM PROJECT PLANS
    </button>
  );
}
