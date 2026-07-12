"use client";

import { useShortcutRegistry } from "@/lib/shortcuts";
import { Kbd } from "./kbd";

// Tiny floating reminder so the user notices the keyboard is hot.
// Bottom-left so it stays out of the toaster's way.
export function ShortcutsHintBar() {
  const { setCheatOpen, cheatOpen } = useShortcutRegistry();
  if (cheatOpen) return null;
  return (
    <button
      onClick={() => setCheatOpen(true)}
      className="fixed bottom-3 left-3 z-30 hidden items-center gap-2 rounded-full border border-paper-line/60 bg-paper-panel/70 px-3 py-1.5 font-mono text-[10px] tracking-wider text-ink-mute backdrop-blur transition hover:border-brass/40 hover:text-brass md:inline-flex"
      title="Keyboard shortcuts"
    >
      <Kbd keys="?" size="xs" />
      <span>shortcuts</span>
    </button>
  );
}
