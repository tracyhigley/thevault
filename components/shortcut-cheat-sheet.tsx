"use client";

import { useEffect } from "react";
import { useShortcut, useShortcutRegistry } from "@/lib/shortcuts";
import { Kbd } from "./kbd";

// The cheat sheet itself (`?` opens it). Lives at root layout.
export function ShortcutCheatSheet() {
  const { list, cheatOpen, setCheatOpen } = useShortcutRegistry();

  useShortcut("?", () => setCheatOpen(true), {
    label: "Show keyboard shortcuts",
    group: "Help",
  });
  useShortcut("escape", () => cheatOpen && setCheatOpen(false), {
    label: "",
    options: { enabled: cheatOpen, allowInInputs: true },
  });

  useEffect(() => {
    if (!cheatOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cheatOpen]);

  if (!cheatOpen) return null;

  // Group entries
  const groups = new Map<string, typeof list>();
  for (const e of list) {
    if (e.hidden || !e.label) continue;
    const g = e.group ?? "Other";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(e);
  }
  // Stable group order
  const order = ["Help", "Navigate", "Capture", "Field Notes", "Build day", "Maint Tasks", "Project Tasks", "Other"];
  const sortedKeys = Array.from(groups.keys()).sort(
    (a, b) => (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b)),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-paper-bg/80 backdrop-blur"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setCheatOpen(false);
      }}
    >
      <div className="mt-20 max-h-[80vh] w-full max-w-[720px] overflow-y-auto rounded-sm border border-brass/40 bg-paper-panel/95 p-6 shadow-2xl">
        <div className="flex items-baseline justify-between">
          <div className="eyebrow">— Keyboard shortcuts —</div>
          <button
            onClick={() => setCheatOpen(false)}
            className="font-mono text-[10px] tracking-[0.18em] text-ink-mute hover:text-brass"
          >
            ESC ✕
          </button>
        </div>
        <h2 className="serif-h mt-2 text-[24px] text-ink">Use the keyboard.</h2>
        <p className="mt-1 text-[13px] text-ink-dim">
          Most things in The Blueprint have a key. Press <Kbd keys="?" /> any time to see this list.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {sortedKeys.map((g) => (
            <section key={g}>
              <div className="eyebrow text-brass">— {g} —</div>
              <ul className="mt-3 space-y-2">
                {groups.get(g)!.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-3 border-b border-paper-line/40 pb-1.5"
                  >
                    <span className="text-[13px] text-ink">{e.label}</span>
                    <Kbd keys={e.keys} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
