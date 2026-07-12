"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { depositText } from "@/lib/actions";

export default function DepositPage() {
  return (
    <Suspense fallback={null}>
      <DepositInner />
    </Suspense>
  );
}

function DepositInner() {
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

  async function deposit(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setPending(true);
    try {
      await depositText(t, "mailslot");
      toast.success("Deposited.");
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
      <div className="eyebrow">— Mail slot —</div>
      <h1 className="serif-h mt-2 text-[36px] leading-tight">Deposit.</h1>
      <p className="text-ink-dim">
        Drops straight into The Drop. Triage later.
      </p>

      <form onSubmit={deposit} className="mt-8 space-y-3">
        <textarea
          autoFocus
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Drop a thought…"
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
            DEPOSIT
          </button>
        </div>
      </form>
    </div>
  );
}
