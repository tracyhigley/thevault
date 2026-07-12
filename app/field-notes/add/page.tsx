"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { addFieldNote } from "@/lib/actions";

export default function AddFieldNotePage() {
  return (
    <Suspense fallback={null}>
      <AddFieldNoteInner />
    </Suspense>
  );
}

function AddFieldNoteInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);

  // Bookmarklet drops the page title + URL via ?t=
  useEffect(() => {
    const t = params.get("t");
    if (t && !text) setText(decodeURIComponent(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setPending(true);
    try {
      await addFieldNote(t, "mailslot");
      toast.success("Added.");
      setText("");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-[600px] px-10 py-16">
      <div className="eyebrow">— Field Notes —</div>
      <h1 className="serif-h mt-2 text-[36px] leading-tight">Add a field note.</h1>
      <p className="text-ink-dim">
        Goes straight into Field Notes. Sort later.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-3">
        <textarea
          autoFocus
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a field note…"
          className="w-full rounded-sm border border-vault-line bg-vault-panel/60 px-4 py-3 text-ink outline-none focus:border-brass"
        />
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-ink-mute">
            {pending ? "Saving…" : ""}
          </span>
          <button
            type="submit"
            disabled={pending}
            className="brass-button px-6 py-2 font-mono text-[10px] tracking-[0.24em] disabled:opacity-50"
          >
            ADD
          </button>
        </div>
      </form>
    </div>
  );
}
