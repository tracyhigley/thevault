"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

// Lands here after the user clicks the password-reset link in their email.
// Supabase puts a recovery session into the URL hash; the SDK picks it up
// automatically. We just need them to type a new password.

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wait for Supabase to consume the recovery hash.
    const sb = supabaseBrowser();
    sb.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else setError("Reset link is invalid or has expired. Request a new one.");
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don’t match.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    setPending(true);
    const sb = supabaseBrowser();
    const { error } = await sb.auth.updateUser({ password });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-[420px] flex-col items-center justify-center px-6">
      <div className="eyebrow">— Set a new password —</div>
      <h1 className="serif-h mt-2 text-[32px]">New key.</h1>

      <form onSubmit={submit} className="mt-6 w-full space-y-3">
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password (8+ chars)"
          disabled={!ready}
          className="w-full rounded-sm border border-paper-line bg-paper-panel/60 px-4 py-3 text-ink outline-none focus:border-brass disabled:opacity-50"
        />
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm password"
          disabled={!ready}
          className="w-full rounded-sm border border-paper-line bg-paper-panel/60 px-4 py-3 text-ink outline-none focus:border-brass disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={pending || !ready}
          className="brass-button w-full px-6 py-3 font-mono text-[10px] tracking-[0.24em] disabled:opacity-50"
        >
          {pending ? "..." : "SAVE PASSWORD"}
        </button>
      </form>

      <div className="mt-6 min-h-[20px] text-center text-[12px]">
        {error && <p className="text-rust">⚠ {error}</p>}
      </div>
    </div>
  );
}
