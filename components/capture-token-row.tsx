"use client";
import { useState, useTransition } from "react";
import { rotateCaptureToken } from "@/lib/actions";

export function CaptureTokenRow({ token }: { token: string | null }) {
  const [current, setCurrent] = useState(token);
  const [reveal, setReveal] = useState(false);
  const [pending, startTransition] = useTransition();

  function rotate() {
    if (
      current &&
      !confirm("Rotate the token? Any installed Shortcut will stop working until you update it.")
    )
      return;
    startTransition(async () => {
      const next = await rotateCaptureToken();
      setCurrent(next ?? null);
      setReveal(true);
    });
  }

  const display = current
    ? reveal
      ? current
      : "•".repeat(Math.min(24, current.length))
    : "Not generated yet";

  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-ink">Bearer token</div>
          <div className="text-[13px] text-ink-dim">
            Used by the iPhone Shortcut to add field notes. Treat like a password.
          </div>
        </div>
        <div className="flex items-center gap-2">
          {current && (
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              className="rounded-sm border border-vault-line px-2 py-1 font-mono text-[10px] tracking-wider text-ink-mute hover:border-brass/40 hover:text-brass"
            >
              {reveal ? "HIDE" : "SHOW"}
            </button>
          )}
          {current && (
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(current)}
              className="rounded-sm border border-vault-line px-2 py-1 font-mono text-[10px] tracking-wider text-ink-mute hover:border-brass/40 hover:text-brass"
            >
              COPY
            </button>
          )}
          <button
            type="button"
            onClick={rotate}
            disabled={pending}
            className="rounded-sm border border-brass/40 px-2 py-1 font-mono text-[10px] tracking-wider text-brass hover:bg-brass/10 disabled:opacity-50"
          >
            {current ? "ROTATE" : "GENERATE"}
          </button>
        </div>
      </div>
      <div className="mt-2 break-all rounded-sm border border-vault-line bg-vault-bg/60 px-3 py-2 font-mono text-[12px] text-brass">
        {display}
      </div>
    </div>
  );
}
