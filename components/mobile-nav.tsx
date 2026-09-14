"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useShortcut } from "@/lib/shortcuts";
import { markPreferTodayOverDropLanding } from "@/lib/nav-client";
import { buildItems } from "./top-bar-nav";

// Below `lg` (phones and portrait tablets) the horizontal TopBarNav row is
// hidden (see top-bar-nav.tsx) and this hamburger + slide-out drawer takes
// over instead -- same NavItem list, just rendered as a tappable list
// rather than a cramped scrolling row. At `lg` and up this renders nothing.

export function MobileNav({ fiftyFdHref }: { fiftyFdHref: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const items = buildItems(fiftyFdHref);

  // Closing on route change covers link taps; this also catches back/forward
  // navigation and any programmatic redirect while the drawer is open.
  useEffect(() => {
    setOpen(false);
  }, [path]);

  useShortcut("escape", () => setOpen(false), {
    label: "",
    options: { enabled: open, allowInInputs: true },
  });

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-paper-line text-ink transition hover:border-brass"
      >
        <span className="relative block h-3.5 w-4.5">
          <span
            className={clsx(
              "absolute left-0 top-0 block h-[1.5px] w-full bg-current transition",
              open && "top-[6px] rotate-45",
            )}
          />
          <span
            className={clsx(
              "absolute left-0 top-[6px] block h-[1.5px] w-full bg-current transition",
              open && "opacity-0",
            )}
          />
          <span
            className={clsx(
              "absolute left-0 top-3 block h-[1.5px] w-full bg-current transition",
              open && "top-[6px] -rotate-45",
            )}
          />
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-paper-bg/80 backdrop-blur"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <nav
            aria-label="Main"
            className="flex h-full w-[78vw] max-w-[320px] flex-col gap-1 overflow-y-auto border-l border-brass/40 bg-paper-panel/95 p-5 shadow-2xl"
          >
            <div className="eyebrow mb-2">— Navigate —</div>
            {items.map((item) => {
              const active = item.match(path);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (item.href === "/") markPreferTodayOverDropLanding();
                    setOpen(false);
                  }}
                  className={clsx(
                    "rounded-sm border px-3 py-2.5 font-mono text-[11px] tracking-[0.14em] transition",
                    active
                      ? "border-brass bg-brass/10 text-brass"
                      : "border-transparent text-ink-mute hover:border-paper-line hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
