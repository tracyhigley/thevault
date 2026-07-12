"use client";
import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function MagicLinkPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    setError(null);
    const sb = supabaseBrowser();
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setStatus("error");
      setError(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-[420px] flex-col items-center justify-center px-6">
      <div className="eyebrow">— Magic link —</div>
      <h1 className="serif-h mt-2 text-[32px]">No password.</h1>
      <p className="mt-2 text-center text-ink-dim">
        We&rsquo;ll email a one-time link.
      </p>

      <form onSubmit={send} className="mt-6 w-full space-y-3">
        <input
          autoFocus
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-sm border border-vault-line bg-vault-panel/60 px-4 py-3 text-ink outline-none focus:border-brass"
        />
        <button
          type="submit"
          className="brass-button w-full px-6 py-3 font-mono text-[10px] tracking-[0.24em]"
        >
          SEND MAGIC LINK
        </button>
      </form>

      <div className="mt-6 min-h-[20px] text-center text-[12px]">
        {status === "sent" && (
          <p className="text-brass">✓ Check your inbox.</p>
        )}
        {status === "error" && error && (
          <p className="text-rust">⚠ {error}</p>
        )}
      </div>

      <Link
        href="/login"
        className="mt-8 font-mono text-[10px] tracking-[0.18em] text-ink-mute hover:text-brass"
      >
        ← USE PASSWORD INSTEAD
      </Link>
    </div>
  );
}
