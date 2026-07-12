"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

// useSearchParams forces dynamic rendering and must sit inside a Suspense
// boundary so Next can statically prerender the surrounding shell.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);
    const sb = supabaseBrowser();

    if (mode === "signin") {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      setPending(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push(next);
      router.refresh();
    } else {
      const { error } = await sb.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      setPending(false);
      if (error) {
        setError(error.message);
        return;
      }
      // If "Confirm email" is on in Supabase, the user has to verify first.
      // If off, sign them straight in.
      const { data } = await sb.auth.getSession();
      if (data.session) {
        router.push(next);
        router.refresh();
      } else {
        setInfo("Account created. Check your email to confirm, then sign in.");
        setMode("signin");
      }
    }
  }

  async function reset() {
    setError(null);
    setInfo(null);
    if (!email) {
      setError("Enter your email first, then click Forgot password.");
      return;
    }
    setPending(true);
    const sb = supabaseBrowser();
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setPending(false);
    if (error) setError(error.message);
    else setInfo("Reset link sent. Check your email.");
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-[420px] flex-col items-center justify-center px-6">
      <div className="eyebrow">— The Blueprint —</div>
      <h1 className="serif-h mt-2 text-[36px]">Open the door.</h1>

      <div className="mt-6 flex gap-1 rounded-sm border border-vault-line p-0.5">
        <Tab active={mode === "signin"} onClick={() => setMode("signin")}>
          Sign in
        </Tab>
        <Tab active={mode === "signup"} onClick={() => setMode("signup")}>
          Sign up
        </Tab>
      </div>

      <form onSubmit={submit} className="mt-6 w-full space-y-3">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-sm border border-vault-line bg-vault-panel/60 px-4 py-3 text-ink outline-none focus:border-brass"
        />
        <input
          type="password"
          required
          minLength={mode === "signup" ? 8 : 1}
          autoComplete={
            mode === "signin" ? "current-password" : "new-password"
          }
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={
            mode === "signup" ? "Choose a password (8+ chars)" : "Password"
          }
          className="w-full rounded-sm border border-vault-line bg-vault-panel/60 px-4 py-3 text-ink outline-none focus:border-brass"
        />
        <button
          type="submit"
          disabled={pending}
          className="brass-button w-full px-6 py-3 font-mono text-[10px] tracking-[0.24em] disabled:opacity-50"
        >
          {pending
            ? "..."
            : mode === "signin"
              ? "OPEN"
              : "CREATE ACCOUNT"}
        </button>
      </form>

      {mode === "signin" && (
        <button
          onClick={reset}
          disabled={pending}
          className="mt-4 font-mono text-[10px] tracking-[0.18em] text-ink-mute hover:text-brass"
        >
          FORGOT PASSWORD
        </button>
      )}

      <div className="mt-6 min-h-[20px] text-center text-[12px]">
        {info && <p className="text-brass">{info}</p>}
        {error && <p className="text-rust">⚠ {error}</p>}
      </div>

      <p className="mt-8 max-w-[320px] text-center text-[11px] text-ink-mute">
        Want a magic link instead?{" "}
        <Link href="/login/magic" className="hover:text-brass underline">
          Use email-only sign in
        </Link>
        .
      </p>
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex-1 rounded-sm px-4 py-1.5 font-mono text-[10px] tracking-[0.18em] transition",
        active
          ? "bg-brass/15 text-brass"
          : "text-ink-mute hover:text-brass",
      )}
    >
      {children}
    </button>
  );
}
