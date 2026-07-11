"use client";

import { useRouter } from "next/navigation";
import { markPreferTodayOverDropLanding } from "@/lib/vault-nav-client";
import { useShortcut } from "@/lib/shortcuts";

// Registers the global navigation + capture shortcuts.
// Mounted once in app/layout.tsx.
export function GlobalShortcuts() {
  const router = useRouter();
  const go = (path: string) => () => router.push(path);

  useShortcut(
    "g d",
    () => {
      markPreferTodayOverDropLanding();
      router.push("/");
    },
    { label: "Today (Docket)", group: "Navigate" },
  );
  useShortcut("g r", go("/drop"), { label: "Drop", group: "Navigate" });
  useShortcut("g c", go("/counter"), { label: "Counter", group: "Navigate" });
  useShortcut("g a", go("/atm"), { label: "ATM", group: "Navigate" });
  useShortcut("g e", go("/documents"), { label: "DOCUMENTS", group: "Navigate" });
  useShortcut("g k", go("/calendar"), { label: "Calendar", group: "Navigate" });
  useShortcut("g p", go("/plan"), { label: "Master Plan", group: "Navigate" });
  useShortcut("g s", go("/settings"), { label: "Settings", group: "Navigate" });
  useShortcut("g b", go("/build?step=1"), { label: "Build day", group: "Navigate" });

  // Quick-deposit (n) opens the same surface as ⌘K. CmdK component listens
  // for a custom event so this stays decoupled.
  useShortcut(
    "n",
    () => window.dispatchEvent(new CustomEvent("vault:open-cmdk")),
    { label: "Quick deposit (mail slot)", group: "Capture" },
  );

  return null;
}
