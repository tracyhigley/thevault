"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { toast } from "sonner";
import { DraftingScene } from "./drafting-scene";
import { depositText } from "@/lib/actions";
import { markPreferTodayOverDropLanding } from "@/lib/vault-nav-client";

export function SealedScreen({
  sealed,
  itemCount,
  animate,
  unsealAction,
  sealAction,
}: {
  sealed: boolean;
  itemCount: number;
  animate: boolean;
  unsealAction: () => Promise<void>;
  sealAction: () => Promise<void>;
}) {
  const router = useRouter();
  const [time, setTime] = useState(() => formatNow());
  const [text, setText] = useState("");
  const [depositPending, setDepositPending] = useState(false);
  const [pending, startTransition] = useTransition();
  const [sealMessageVisible, setSealMessageVisible] = useState(!animate);

  useEffect(() => {
    const id = setInterval(() => setTime(formatNow()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Reveal the message after the dial finishes its sweep.
  useEffect(() => {
    if (!animate) {
      setSealMessageVisible(true);
      return;
    }
    const t = setTimeout(() => setSealMessageVisible(true), 1100);
    return () => clearTimeout(t);
  }, [animate]);

  async function deposit(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setDepositPending(true);
    try {
      await depositText(t, "sealed");
      toast.success("Deposited.");
      setText("");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setDepositPending(false);
    }
  }

  function unseal() {
    startTransition(async () => {
      await unsealAction();
      router.push("/?just=unsealed");
    });
  }

  function seal() {
    startTransition(async () => {
      await sealAction();
      router.push("/sealed?just=sealed");
    });
  }

  return (
    <div className="sealed-blueprint-scheme relative min-h-[100vh] overflow-hidden bg-vault-bg text-ink">
      {/* Subtle vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(143,165,99,0.06),_transparent_70%)]" />

      {/* Minimal sealed-mode header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
            <rect x="1.5" y="1.5" width="19" height="19" rx="4" stroke="#8FA563" strokeWidth="1.4" />
            <path d="M6 14 L6 6 L14 6" stroke="#8FA563" strokeWidth="1.2" fill="none" />
            <circle cx="14.5" cy="14.5" r="1.6" fill="#8FA563" />
          </svg>
          <span className="serif-h text-[20px] text-ink/70">The Blueprint</span>
        </Link>
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 font-mono text-[11px] tracking-[0.24em] text-ink-mute">
          <LampGlyphTiny lit={!sealed} />
          <span>{sealed ? "FILED" : "DRAFTING"}</span>
          <span>·</span>
          <span>{time}</span>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-vault-line bg-vault-panel/80 text-brass-bright/80">
          T
        </div>
      </header>

      {/* Center stage */}
      <div className="relative z-10 mx-auto flex max-w-[640px] flex-col items-center px-4 pb-16 pt-8 md:pt-12">
        <DraftingScene sealed={sealed} animate={animate} maxWidth={560} />

        <div
          className={clsx(
            "mt-10 flex flex-col items-center text-center transition-opacity duration-700",
            sealMessageVisible ? "opacity-100" : "opacity-0",
          )}
        >
          <span className="eyebrow text-ink-mute">
            {sealed ? "— Lights out at the board —" : "— Still at the drafting table —"}
          </span>
          <h1 className="serif-h mt-3 text-[32px] leading-[1.15] text-ink md:text-[44px]">
            {sealed ? (
              <>
                The plans are filed.
                <br />
                You can put the pencil down.
              </>
            ) : (
              <>Ready to call it a day?</>
            )}
          </h1>
          <p className="mt-5 max-w-[460px] text-ink-dim">
            {sealed
              ? `${itemCount} items on file. Nothing needs your attention until tomorrow's first line.`
              : `${itemCount} items on the board. Filing rolls up today's sheets. The drop slot still works.`}
          </p>

          {/* Deposit slot — works while sealed */}
          {sealed && (
            <div className="mt-8 w-full max-w-[520px]">
              <form
                onSubmit={(e) => void deposit(e)}
                className="flex items-center gap-2 rounded-sm border border-vault-line bg-vault-panel/40 px-4 py-2"
              >
                <MailSlotIcon />
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Add a line to the blueprint…"
                  autoComplete="off"
                  enterKeyHint="send"
                  disabled={depositPending}
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-mute disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={depositPending || !text.trim()}
                  className="shrink-0 rounded-sm border border-brass/50 bg-brass/15 px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-brass hover:bg-brass/25 disabled:pointer-events-none disabled:opacity-40"
                >
                  {depositPending ? "…" : "FILE"}
                </button>
              </form>
              <p className="mt-2 hidden text-center font-mono text-[10px] tracking-[0.2em] text-ink-mute md:block">
                ⌘K opens the drop slot anywhere.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex items-center gap-3">
            {sealed ? (
              <button
                onClick={unseal}
                disabled={pending}
                className="brass-button flex items-center gap-2 px-6 py-3 font-mono text-[10px] tracking-[0.24em] text-[#2a1c08] disabled:opacity-50"
              >
                <span aria-hidden>↑</span>
                TURN THE LIGHTS BACK ON
              </button>
            ) : (
              <>
                <button
                  onClick={seal}
                  disabled={pending}
                  className="brass-button flex items-center gap-2 px-6 py-3 font-mono text-[10px] tracking-[0.24em] text-[#2a1c08] disabled:opacity-50"
                >
                  <span aria-hidden>↓</span>
                  LIGHTS OUT
                </button>
                <Link
                  href="/"
                  className="rounded-sm border border-vault-line px-5 py-3 font-mono text-[10px] tracking-[0.24em] text-ink-mute hover:border-brass/40 hover:text-brass"
                  onClick={() => markPreferTodayOverDropLanding()}
                >
                  CANCEL
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function formatNow() {
  const d = new Date();
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function LampGlyphTiny({ lit }: { lit: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path
        d="M2 2 L9 5 L4 7 Z"
        stroke="currentColor"
        strokeWidth="1.2"
        fill={lit ? "currentColor" : "none"}
        fillOpacity={lit ? 0.35 : 0}
      />
      <circle cx="4.5" cy="6" r={lit ? 1.4 : 0.9} fill="currentColor" />
      <line x1="4.5" y1="7.4" x2="4.5" y2="12.5" stroke="currentColor" strokeWidth="1.1" />
      <line x1="2" y1="12.5" x2="7" y2="12.5" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

function MailSlotIcon() {
  return (
    <svg
      width="14"
      height="12"
      viewBox="0 0 14 12"
      fill="none"
      className="shrink-0 text-brass/60"
    >
      <rect
        x="0.75"
        y="0.75"
        width="12.5"
        height="10.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M1 3l6 4 6-4"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  );
}
