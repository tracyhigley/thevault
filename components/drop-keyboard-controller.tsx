"use client";

// Page-level keyboard navigation for Field Notes.
//
// Each DropTriageRow's wrapper carries data-drop-row + tabIndex=0. This
// controller sits at the page level and:
//   - focuses the first row on mount
//   - j / arrow-down  → focus the next row
//   - k / arrow-up    → focus the previous row
//   - listens for `field-notes:advance` events fired by rows after a send /
//     delete; on revalidation the row leaves the DOM, so we just refocus
//     the new first row.
//
// The controller renders nothing.

import { useEffect } from "react";
import { useShortcut } from "@/lib/shortcuts";

export function DropKeyboardController() {
  // Auto-focus the first row when the page mounts. Run once; subsequent
  // re-renders (e.g. after a row sends + revalidates) are handled by the
  // advance listener below.
  useEffect(() => {
    const first = document.querySelector<HTMLElement>("[data-drop-row]");
    first?.focus();
  }, []);

  // After a row finishes a destructive action, the row likely unmounts on
  // revalidate. Wait a tick so the new DOM is settled, then focus the new
  // first row.
  useEffect(() => {
    function onAdvance() {
      requestAnimationFrame(() => {
        const next = document.querySelector<HTMLElement>("[data-drop-row]");
        next?.focus();
      });
    }
    window.addEventListener("field-notes:advance", onAdvance);
    return () => window.removeEventListener("field-notes:advance", onAdvance);
  }, []);

  function focusByOffset(delta: 1 | -1) {
    const rows = Array.from(
      document.querySelectorAll<HTMLElement>("[data-drop-row]"),
    );
    if (!rows.length) return;
    const active = document.activeElement as HTMLElement | null;
    // Find the row that contains current focus.
    const idx = rows.findIndex((r) => r === active || r.contains(active));
    let next: number;
    if (idx === -1) next = delta > 0 ? 0 : rows.length - 1;
    else next = (idx + delta + rows.length) % rows.length;
    rows[next].focus();
  }

  useShortcut("j", () => focusByOffset(1), {
    label: "Next thought",
    group: "Field Notes",
  });
  useShortcut("k", () => focusByOffset(-1), {
    label: "Previous thought",
    group: "Field Notes",
  });
  useShortcut("down", () => focusByOffset(1), {
    label: "",
    hidden: true,
  });
  useShortcut("up", () => focusByOffset(-1), {
    label: "",
    hidden: true,
  });

  return null;
}
