"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { removeMember } from "@/lib/actions";

export function RemoveMemberButton({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      title={`Remove ${email}`}
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            `Remove ${email}? They'll lose access to this blueprint. Their items stay.`,
          )
        )
          return;
        startTransition(async () => {
          try {
            await removeMember(userId);
            toast.success(`Removed ${email}.`);
          } catch (err: any) {
            toast.error(err?.message ?? "Couldn't remove member.");
          }
        });
      }}
      className="rounded-sm border border-paper-line px-2 py-1 font-mono text-[10px] tracking-wider text-ink-mute transition hover:border-rust hover:text-rust disabled:opacity-50"
    >
      REMOVE
    </button>
  );
}
