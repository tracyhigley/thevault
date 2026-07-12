"use client";

// Five capture mechanisms, ordered by platform. Each card is a self-contained
// recipe — one verb at the top ("Install on iPhone"), 2-3 numbered steps,
// optional copyable snippet pre-filled with the user's actual token and ID.

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import clsx from "clsx";

type Platform = "ios" | "mac" | "other";

export function ConnectDeviceCards({
  userId,
  token,
  baseUrl,
}: {
  userId: string;
  token: string | null;
  baseUrl: string;
}) {
  const [platform, setPlatform] = useState<Platform>("other");
  const [standalone, setStandalone] = useState(false);
  const [revealToken, setRevealToken] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    const isMac = /Mac/.test(ua) && !isIOS;
    setPlatform(isIOS ? "ios" : isMac ? "mac" : "other");
    setStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        // iOS Safari pre-ships this non-standard prop
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (navigator as any).standalone === true,
    );
  }, []);

  const cards: Array<{ key: string; node: React.ReactNode }> = [
    {
      key: "ios-install",
      node: (
        <InstallIPhoneCard standalone={standalone && platform === "ios"} />
      ),
    },
    {
      key: "mac-install",
      node: <InstallMacCard standalone={standalone && platform === "mac"} />,
    },
    {
      key: "ios-shortcut",
      node: (
        <IOSShortcutCard
          userId={userId}
          token={token}
          baseUrl={baseUrl}
          revealToken={revealToken}
          setRevealToken={setRevealToken}
        />
      ),
    },
    {
      key: "mac-capture",
      node: (
        <MacCaptureCard
          userId={userId}
          token={token}
          baseUrl={baseUrl}
          revealToken={revealToken}
          setRevealToken={setRevealToken}
        />
      ),
    },
    {
      key: "bookmarklet",
      node: <BookmarkletCard baseUrl={baseUrl} />,
    },
  ];

  // Reorder by detected platform.
  const order =
    platform === "ios"
      ? ["ios-install", "ios-shortcut", "bookmarklet", "mac-install", "mac-capture"]
      : platform === "mac"
        ? ["mac-install", "mac-capture", "bookmarklet", "ios-install", "ios-shortcut"]
        : ["ios-install", "mac-install", "ios-shortcut", "mac-capture", "bookmarklet"];

  return (
    <>
      {!token && (
        <div className="mt-8 rounded-sm border border-rust/40 bg-rust/5 px-4 py-3 text-[12px] text-ink-dim">
          You don&rsquo;t have a capture token yet. Generate one on{" "}
          <Link href="/settings" className="text-brass hover:underline">
            Settings → General
          </Link>{" "}
          first — the iPhone Shortcut and Mac quick-capture both need it.
        </div>
      )}

      <div className="mt-8 space-y-4">
        {order.map((k) => {
          const c = cards.find((c) => c.key === k);
          return c ? <div key={k}>{c.node}</div> : null;
        })}
      </div>
    </>
  );
}

// ---- shared building blocks --------------------------------------------------

function Card({
  badge,
  title,
  subtitle,
  done,
  children,
}: {
  badge: string;
  title: string;
  subtitle: string;
  done?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-sm border border-vault-line/60 bg-vault-panel/30">
      <header className="flex items-start justify-between gap-4 border-b border-vault-line/40 px-4 py-3">
        <div className="min-w-0">
          <div className="eyebrow text-brass">— {badge} —</div>
          <h2 className="serif-h mt-1 text-[20px] text-ink">{title}</h2>
          <p className="mt-0.5 text-[13px] text-ink-dim">{subtitle}</p>
        </div>
        {done && (
          <span className="shrink-0 rounded-sm border border-teal/40 bg-teal/10 px-2 py-0.5 font-mono text-[10px] tracking-wider text-teal">
            ✓ INSTALLED
          </span>
        )}
      </header>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-2 text-[13px] text-ink-dim">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-brass/40 font-mono text-[10px] text-brass">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">{it}</div>
        </li>
      ))}
    </ol>
  );
}

function CodeBlock({
  code,
  label,
}: {
  code: string;
  label?: string;
}) {
  function copy() {
    navigator.clipboard
      .writeText(code)
      .then(() => toast.success("Copied."))
      .catch(() => toast.error("Couldn't copy."));
  }
  return (
    <div className="mt-2 overflow-hidden rounded-sm border border-vault-line bg-vault-bg/60">
      {label && (
        <div className="flex items-center justify-between border-b border-vault-line/50 px-3 py-1 font-mono text-[10px] tracking-wider text-ink-mute">
          <span>{label}</span>
          <button
            onClick={copy}
            className="hover:text-brass"
          >
            COPY
          </button>
        </div>
      )}
      <pre className="overflow-x-auto px-3 py-2 font-mono text-[11px] leading-relaxed text-brass">
        {code}
      </pre>
      {!label && (
        <div className="border-t border-vault-line/50 px-3 py-1 text-right">
          <button
            onClick={copy}
            className="font-mono text-[10px] tracking-wider text-ink-mute hover:text-brass"
          >
            COPY
          </button>
        </div>
      )}
    </div>
  );
}

function MaskedToken({
  token,
  reveal,
  onToggle,
}: {
  token: string | null;
  reveal: boolean;
  onToggle: () => void;
}) {
  if (!token) {
    return (
      <span className="font-mono text-[11px] text-rust">
        — no token, generate on Settings → General —
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[11px]">
      <span className="text-brass">
        {reveal ? token : "•".repeat(Math.min(20, token.length))}
      </span>
      <button
        onClick={onToggle}
        className="rounded-sm border border-vault-line px-1.5 py-0.5 text-[9px] tracking-wider text-ink-mute hover:border-brass/40 hover:text-brass"
      >
        {reveal ? "HIDE" : "SHOW"}
      </button>
    </span>
  );
}

// ---- individual cards -------------------------------------------------------

function InstallIPhoneCard({ standalone }: { standalone: boolean }) {
  return (
    <Card
      badge="iPhone"
      title="Add The Vault to your home screen."
      subtitle="Opens like an app — no Safari chrome, no tabs, lock-screen friendly."
      done={standalone}
    >
      <Steps
        items={[
          <>
            Open this site in <strong className="text-ink">Safari</strong> on
            your iPhone (Chrome won&rsquo;t install it).
          </>,
          <>
            Tap the <strong className="text-ink">Share</strong> button (square
            with arrow up).
          </>,
          <>
            Scroll down, tap{" "}
            <strong className="text-ink">Add to Home Screen</strong>, then tap{" "}
            <strong className="text-ink">Add</strong>.
          </>,
          <>
            Long-press the new icon → <em>Edit Home Screen</em> to drop it in
            the dock for one-tap access.
          </>,
        ]}
      />
    </Card>
  );
}

function InstallMacCard({ standalone }: { standalone: boolean }) {
  return (
    <Card
      badge="Mac"
      title="Dock The Vault as a desktop app."
      subtitle="Lives in your Dock, opens in its own window, ⌘-tab-able."
      done={standalone}
    >
      <Steps
        items={[
          <>
            <strong className="text-ink">Safari</strong> (easiest): with this
            site open, File → <em>Add to Dock…</em> (macOS Sonoma+).{" "}
            <strong className="text-ink">Chrome</strong>: look for the install
            icon in the address bar, or ⋮ → <em>Cast, save and share</em> →{" "}
            <em>Install page as app…</em> (only after the page has loaded once
            with the update that adds install support). If Install is missing,
            use <em>Create shortcut…</em> and turn on{" "}
            <em>Open as window</em>.
          </>,
          <>
            Right-click the new Dock icon → <em>Options</em> →{" "}
            <em>Keep in Dock</em> so it sticks.
          </>,
          <>
            Pair with <span className="font-mono text-brass">⌘K</span> inside
            the app for quick capture, or use Spotlight (⌘ Space → &ldquo;Vault&rdquo;)
            to launch.
          </>,
        ]}
      />
    </Card>
  );
}

function IOSShortcutCard({
  userId,
  token,
  baseUrl,
  revealToken,
  setRevealToken,
}: {
  userId: string;
  token: string | null;
  baseUrl: string;
  revealToken: boolean;
  setRevealToken: (v: boolean) => void;
}) {
  const apiUrl = `${baseUrl}/api/capture`;
  return (
    <Card
      badge="iPhone · Siri"
      title="“Hey Siri, add to field notes.”"
      subtitle="Build a one-step Apple Shortcut that drops dictated text straight into Field Notes."
    >
      <div className="space-y-4">
        <div className="rounded-sm border border-vault-line/60 bg-vault-bg/40 px-3 py-2">
          <div className="font-mono text-[10px] tracking-wider text-ink-mute">
            Your details
          </div>
          <dl className="mt-1 space-y-1 text-[12px]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <dt className="text-ink-mute">URL</dt>
              <dd className="font-mono text-[11px] text-brass">{apiUrl}</dd>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <dt className="text-ink-mute">User ID</dt>
              <dd className="font-mono text-[11px] text-brass">
                {userId || "(sign in first)"}
              </dd>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <dt className="text-ink-mute">Bearer token</dt>
              <dd>
                <MaskedToken
                  token={token}
                  reveal={revealToken}
                  onToggle={() => setRevealToken(!revealToken)}
                />
              </dd>
            </div>
          </dl>
        </div>

        <Steps
          items={[
            <>
              On your iPhone, open the{" "}
              <strong className="text-ink">Shortcuts</strong> app and tap{" "}
              <strong className="text-ink">+</strong> (top right).
            </>,
            <>
              Add action <strong className="text-ink">Dictate Text</strong> →
              language: English. Set <em>Stop Listening</em> to{" "}
              <em>On Tap</em> (or <em>After Pause</em> if you prefer).
            </>,
            <>
              Add action <strong className="text-ink">Get Contents of URL</strong>.
              Configure:
              <ul className="mt-1 ml-3 list-disc space-y-0.5 text-[12px]">
                <li>URL: <span className="font-mono text-brass">{apiUrl}</span></li>
                <li>Method: <span className="font-mono text-brass">POST</span></li>
                <li>
                  Headers: <span className="font-mono text-brass">Authorization</span>{" "}
                  = <span className="font-mono text-brass">Bearer YOUR-TOKEN</span>{" "}
                  (paste from above), and{" "}
                  <span className="font-mono text-brass">Content-Type</span> ={" "}
                  <span className="font-mono text-brass">application/json</span>
                </li>
                <li>
                  Request body: <em>JSON</em> with three fields:
                  <ul className="ml-3 list-disc">
                    <li>
                      <span className="font-mono text-brass">text</span> →{" "}
                      <em>Dictated Text</em> (magic variable)
                    </li>
                    <li>
                      <span className="font-mono text-brass">source</span> →{" "}
                      <span className="font-mono text-brass">siri</span>
                    </li>
                    <li>
                      <span className="font-mono text-brass">userId</span> →{" "}
                      <span className="font-mono text-brass">{userId || "your-user-id"}</span>
                    </li>
                  </ul>
                </li>
              </ul>
            </>,
            <>
              Tap <strong className="text-ink">Show Notification</strong>{" "}
              (optional) so you get a confirmation. Name the shortcut{" "}
              <strong className="text-ink">Add to Field Notes</strong> and save.
            </>,
            <>
              Now you can: say{" "}
              <em>“Hey Siri, add to field notes”</em>, run from the Lock-Screen
              widget, add to a Home Screen widget, or wire to the Action Button.
            </>,
          ]}
        />

        <details className="rounded-sm border border-vault-line/60 bg-vault-bg/40 px-3 py-2">
          <summary className="cursor-pointer font-mono text-[10px] tracking-wider text-ink-mute hover:text-brass">
            Test from a terminal first
          </summary>
          <CodeBlock
            label="curl test (will create a real Field Notes item)"
            code={`curl -X POST '${apiUrl}' \\
  -H 'Authorization: Bearer ${token ?? "YOUR-TOKEN"}' \\
  -H 'Content-Type: application/json' \\
  -d '{"text":"hello from terminal","source":"shortcut","userId":"${userId || "your-user-id"}"}'`}
          />
        </details>
      </div>
    </Card>
  );
}

function MacCaptureCard({
  userId,
  token,
  baseUrl,
  revealToken,
  setRevealToken,
}: {
  userId: string;
  token: string | null;
  baseUrl: string;
  revealToken: boolean;
  setRevealToken: (v: boolean) => void;
}) {
  const apiUrl = `${baseUrl}/api/capture`;
  const t = token ?? "YOUR-TOKEN";
  const u = userId || "your-user-id";

  const raycastSnippet = `# Raycast → Create Script Command → Bash
# @raycast.title Add to Field Notes
# @raycast.mode silent
# @raycast.argument1 { "type": "text", "placeholder": "thought" }
# @raycast.icon 🗝️

curl -s -X POST '${apiUrl}' \\
  -H "Authorization: Bearer ${t}" \\
  -H "Content-Type: application/json" \\
  -d "$(printf '{"text":%s,"source":"shortcut","userId":"${u}"}' "$(printf %s "$1" | jq -Rs .)")"`;

  const automatorSnippet = `#!/bin/bash
# Save as a Quick Action (Automator → "Run Shell Script")
# Pass: input as arguments
TEXT="$1"
curl -s -X POST '${apiUrl}' \\
  -H "Authorization: Bearer ${t}" \\
  -H "Content-Type: application/json" \\
  -d "$(printf '{"text":%s,"source":"shortcut","userId":"${u}"}' "$(printf %s "$TEXT" | jq -Rs .)")"`;

  return (
    <Card
      badge="Mac · Quick capture"
      title="Capture a thought without switching windows."
      subtitle="One hotkey from anywhere — Raycast, Alfred, or a built-in macOS Shortcut."
    >
      <div className="space-y-4">
        <div className="rounded-sm border border-vault-line/60 bg-vault-bg/40 px-3 py-2 text-[12px]">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-ink-mute">Bearer token</span>
            <MaskedToken
              token={token}
              reveal={revealToken}
              onToggle={() => setRevealToken(!revealToken)}
            />
          </div>
        </div>

        <div>
          <h3 className="font-mono text-[10px] tracking-wider text-brass">
            OPTION A · macOS Shortcuts (built-in, no install)
          </h3>
          <Steps
            items={[
              <>
                Open <strong className="text-ink">Shortcuts.app</strong> → New
                Shortcut.
              </>,
              <>
                Add <strong className="text-ink">Ask for Input</strong> (Text)
                → prompt: &ldquo;Add to Field Notes&rdquo;.
              </>,
              <>
                Add <strong className="text-ink">Get Contents of URL</strong>{" "}
                with the same config as the iPhone shortcut above (URL, POST,
                Authorization header, JSON body with{" "}
                <span className="font-mono text-brass">text</span> →{" "}
                <em>Provided Input</em>).
              </>,
              <>
                <strong className="text-ink">Shortcut Details</strong> →
                assign a keyboard shortcut (e.g. ⌃⌥⌘ V) and check{" "}
                <em>Pin in Menu Bar</em>.
              </>,
            ]}
          />
        </div>

        <div>
          <h3 className="font-mono text-[10px] tracking-wider text-brass">
            OPTION B · Raycast script command
          </h3>
          <p className="mt-1 text-[13px] text-ink-dim">
            Create → Script Command → paste this. Bind a hotkey in Raycast
            preferences.
          </p>
          <CodeBlock label="add-to-field-notes.sh" code={raycastSnippet} />
        </div>

        <details className="rounded-sm border border-vault-line/60 bg-vault-bg/40 px-3 py-2">
          <summary className="cursor-pointer font-mono text-[10px] tracking-wider text-ink-mute hover:text-brass">
            OPTION C · Automator Quick Action (system-wide)
          </summary>
          <p className="mt-2 text-[13px] text-ink-dim">
            Automator → New Quick Action → Workflow receives <em>text</em> in
            any application → drag <strong>Run Shell Script</strong> → paste
            below. Save as &ldquo;Add to Field Notes&rdquo;. Then System Settings →
            Keyboard → Shortcuts → Services → bind a key.
          </p>
          <CodeBlock label="quick-action.sh" code={automatorSnippet} />
        </details>
      </div>
    </Card>
  );
}

function BookmarkletCard({ baseUrl }: { baseUrl: string }) {
  // A click-and-drag bookmarklet that opens the mail slot pre-filled with the
  // current page's selection / URL.
  const code = `javascript:(function(){var s=window.getSelection&&String(window.getSelection())||'';var t=encodeURIComponent((s?s+' — ':'')+document.title+' '+location.href);location.href='${baseUrl}/deposit?t='+t;})();`;

  return (
    <Card
      badge="Anywhere · Bookmarklet"
      title="Drag to your bookmark bar."
      subtitle="One click on any page deposits the title + URL (or selected text) into Field Notes."
    >
      <p className="text-[13px] text-ink-dim">
        Drag the gold button below onto your bookmarks bar. It works in any
        browser on any device.
      </p>
      <div className="mt-3">
        <a
          href={code}
          onClick={(e) => {
            e.preventDefault();
            toast.info("Drag this to your bookmarks bar instead of clicking.");
          }}
          className={clsx(
            "inline-block rounded-sm border border-brass/60 bg-brass/10 px-4 py-2 font-mono text-[11px] tracking-[0.18em] text-brass",
            "cursor-grab hover:bg-brass/20 active:cursor-grabbing",
          )}
        >
          🗝️ Add to Field Notes
        </a>
      </div>
      <details className="mt-3 rounded-sm border border-vault-line/60 bg-vault-bg/40 px-3 py-2">
        <summary className="cursor-pointer font-mono text-[10px] tracking-wider text-ink-mute hover:text-brass">
          Show the raw code
        </summary>
        <CodeBlock code={code} />
      </details>
    </Card>
  );
}
