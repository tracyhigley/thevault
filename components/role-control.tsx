"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setMemberRole } from "@/lib/actions";

// Auto-submit on change. Lives in a client component so the onChange
// handler actually runs in the browser — the parent Members page is a
// Server Component, where event handlers are no-ops.
export function RoleControl({
  userId,
  role,
}: {
  userId: string;
  role: "owner" | "editor";
}) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      defaultValue={role}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as "owner" | "editor";
        startTransition(async () => {
          try {
            await setMemberRole(userId, next);
            toast.success(`Set to ${next}.`);
          } catch (err: any) {
            toast.error(err?.message ?? "Couldn't update role.");
          }
        });
      }}
      className="bg-transparent font-mono text-[10px] tracking-wider text-brass disabled:opacity-50"
    >
      <option className="bg-paper-bg" value="editor">
        EDITOR
      </option>
      <option className="bg-paper-bg" value="owner">
        OWNER
      </option>
    </select>
  );
}
