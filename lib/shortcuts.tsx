// Global keyboard shortcuts.
//
// Each component calls `useShortcut(keys, handler, meta)` to bind a key.
// All bindings get registered in a context so the cheat-sheet (?) can list
// them grouped by section.
//
// Key formats:
//   "u"           — single key
//   "?"           — single key (shift handled automatically)
//   "g d"         — sequence (press g, then d within ~1.5s)
//   "mod+k"       — ⌘ on mac, ctrl elsewhere
//   "shift+enter" — modifier combo
//
// Inputs / textareas / contenteditable are skipped automatically so typing
// "u" in a textarea doesn't fire the urgent toggle. Mod-combos still fire
// even while focused in a field (so ⌘K still opens quick-add).

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type ShortcutMeta = {
  keys: string;
  label: string;
  group?: string; // e.g. "Navigate", "Drop", "Build day"
  /** Hide from cheat sheet — use sparingly. */
  hidden?: boolean;
};

type RegistryEntry = ShortcutMeta & { id: number };

type Ctx = {
  register: (meta: ShortcutMeta) => number;
  unregister: (id: number) => void;
  list: RegistryEntry[];
  cheatOpen: boolean;
  setCheatOpen: (v: boolean) => void;
};

const ShortcutsCtx = createContext<Ctx | null>(null);

let _id = 0;

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<RegistryEntry[]>([]);
  const [cheatOpen, setCheatOpen] = useState(false);

  const register = useCallback((meta: ShortcutMeta) => {
    const id = ++_id;
    setList((xs) => [...xs, { ...meta, id }]);
    return id;
  }, []);
  const unregister = useCallback((id: number) => {
    setList((xs) => xs.filter((x) => x.id !== id));
  }, []);

  const value = useMemo(
    () => ({ register, unregister, list, cheatOpen, setCheatOpen }),
    [register, unregister, list, cheatOpen],
  );
  return <ShortcutsCtx.Provider value={value}>{children}</ShortcutsCtx.Provider>;
}

function useShortcutsCtx() {
  const ctx = useContext(ShortcutsCtx);
  if (!ctx) throw new Error("ShortcutsProvider missing");
  return ctx;
}

export function useShortcutRegistry() {
  return useShortcutsCtx();
}

// ---- key parsing & matching --------------------------------------------------

type Parsed = {
  type: "single" | "combo" | "sequence";
  parts: { key: string; mod: boolean; shift: boolean; alt: boolean }[];
};

function parsePart(s: string) {
  const tokens = s.split("+").map((t) => t.trim().toLowerCase());
  let mod = false;
  let shift = false;
  let alt = false;
  let key = "";
  for (const t of tokens) {
    if (t === "mod" || t === "cmd" || t === "ctrl" || t === "meta") mod = true;
    else if (t === "shift") shift = true;
    else if (t === "alt" || t === "option") alt = true;
    else key = t;
  }
  return { key, mod, shift, alt };
}

export function parseKeys(keys: string): Parsed {
  if (keys.includes(" ")) {
    return {
      type: "sequence",
      parts: keys.split(/\s+/).map(parsePart),
    };
  }
  const part = parsePart(keys);
  return { type: part.mod || part.shift || part.alt ? "combo" : "single", parts: [part] };
}

function eventKey(e: KeyboardEvent): string {
  const k = e.key;
  if (k === " ") return "space";
  if (k === "ArrowUp") return "up";
  if (k === "ArrowDown") return "down";
  if (k === "ArrowLeft") return "left";
  if (k === "ArrowRight") return "right";
  return k.toLowerCase();
}

function isTypingTarget(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (t.isContentEditable) return true;
  return false;
}

// ---- the hook ----------------------------------------------------------------

type Options = {
  /** When true, fire even if focus is in an input. Defaults to true for combos with mod, false otherwise. */
  allowInInputs?: boolean;
  /** When false, the binding is inert. Useful for row-focus-gated shortcuts. */
  enabled?: boolean;
};

// Sequence buffer is shared globally so multiple useShortcut calls can match
// against the same in-flight sequence.
const seqBuf: { keys: string[]; lastAt: number } = { keys: [], lastAt: 0 };
const SEQ_TIMEOUT_MS = 1500;

export function useShortcut(
  keys: string,
  handler: (e: KeyboardEvent) => void,
  meta?: Omit<ShortcutMeta, "keys"> & { options?: Options },
) {
  const { register, unregister } = useShortcutsCtx();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const enabled = meta?.options?.enabled ?? true;
  const label = meta?.label ?? "";
  const group = meta?.group;
  const hidden = meta?.hidden;
  const allowInInputs = meta?.options?.allowInInputs;

  // Register for cheat sheet
  useEffect(() => {
    if (!enabled || !label) return;
    const id = register({ keys, label, group, hidden });
    return () => unregister(id);
  }, [enabled, keys, label, group, hidden, register, unregister]);

  // Bind keydown
  useEffect(() => {
    if (!enabled) return;
    const parsed = parseKeys(keys);

    function onKey(e: KeyboardEvent) {
      // Determine if we should fire while typing
      const typing = isTypingTarget(e);
      const isComboWithMod = parsed.type === "combo" && parsed.parts[0].mod;
      const allow = allowInInputs ?? isComboWithMod;
      if (typing && !allow) return;

      const k = eventKey(e);

      if (parsed.type === "sequence") {
        // Update shared buffer
        const now = Date.now();
        if (now - seqBuf.lastAt > SEQ_TIMEOUT_MS) seqBuf.keys = [];
        // Don't pollute buffer with modifier-only keys
        if (k === "shift" || k === "control" || k === "alt" || k === "meta") return;
        // Append only if no modifiers (sequences don't use them)
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        // Avoid double-appending: if this is a fresh keystroke, append.
        // We keep the buffer flat — every shortcut listener sees the same buffer.
        if (seqBuf.lastAt !== now || seqBuf.keys[seqBuf.keys.length - 1] !== k) {
          seqBuf.keys.push(k);
          seqBuf.lastAt = now;
          // Trim so it never grows unbounded
          if (seqBuf.keys.length > 8) seqBuf.keys.splice(0, seqBuf.keys.length - 8);
        }

        const want = parsed.parts.map((p) => p.key);
        const tail = seqBuf.keys.slice(-want.length);
        if (tail.length === want.length && tail.every((x, i) => x === want[i])) {
          e.preventDefault();
          seqBuf.keys = []; // consume
          handlerRef.current(e);
        }
        return;
      }

      const part = parsed.parts[0];
      const modOk = part.mod ? e.metaKey || e.ctrlKey : !(e.metaKey || e.ctrlKey);
      const shiftOk = part.shift ? e.shiftKey : true; // single keys allow shift (e.g. "?")
      const altOk = part.alt ? e.altKey : !e.altKey;
      // For "?" specifically, shift will be held — we handle by matching key directly
      if (k !== part.key) return;
      if (!modOk || !altOk) return;
      if (part.shift && !shiftOk) return;
      e.preventDefault();
      handlerRef.current(e);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, keys, allowInInputs]);
}

// ---- helper: render-friendly key parts --------------------------------------

export function keyParts(keys: string): string[][] {
  // Returns [[key, ...]] per chord, e.g. "g d" → [["g"], ["d"]], "mod+k" → [["⌘", "K"]]
  if (keys.includes(" ")) return keys.split(/\s+/).map((p) => keyPartsForChord(p));
  return [keyPartsForChord(keys)];
}

function keyPartsForChord(s: string): string[] {
  const parts = s.split("+").map((t) => t.trim().toLowerCase());
  const out: string[] = [];
  const isMac =
    typeof navigator !== "undefined" && /mac|iphone|ipad/i.test(navigator.platform);
  for (const t of parts) {
    if (t === "mod" || t === "cmd" || t === "meta") out.push(isMac ? "⌘" : "Ctrl");
    else if (t === "ctrl") out.push("Ctrl");
    else if (t === "shift") out.push("⇧");
    else if (t === "alt" || t === "option") out.push(isMac ? "⌥" : "Alt");
    else if (t === "enter") out.push("↵");
    else if (t === "escape" || t === "esc") out.push("Esc");
    else if (t === "space") out.push("Space");
    else if (t === "up") out.push("↑");
    else if (t === "down") out.push("↓");
    else if (t === "left") out.push("←");
    else if (t === "right") out.push("→");
    else out.push(t.length === 1 ? t.toUpperCase() : t);
  }
  return out;
}
