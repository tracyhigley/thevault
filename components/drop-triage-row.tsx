"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import clsx from "clsx";
import { hardDeleteItem, triageDropItem } from "@/lib/actions";
import { EditableText } from "@/components/editable-text";
import { FlagIcon, type FlagKind } from "@/components/flag-icons";
import { Kbd } from "@/components/kbd";
import { useShortcut } from "@/lib/shortcuts";
import type { Box, Destination, EnergyType } from "@/lib/categories";
import type { Item } from "@/lib/types";

// Field Notes row, two compact lines:
//
//   [edge]  [PROJECT TASKS|ADMIN TASKS]  Title (editable)              [Box ▼]
//           ⏱ 30m   urgent / must / should (Admin Tasks)     Delete · Send
//
// 4-px coloured left edge tracks the destination so a glance reads where
// each row will land. The destination toggle is the only place the user
// decides; the rest is metadata.

export function DropTriageRow({
  item,
  boxes,
  energies: _energies,
}: {
  item: Item;
  boxes: Box[];
  energies: EnergyType[];
}) {
  const [boxKey, setBoxKey] = useState<string>(
    item.area ?? item.category ?? "",
  );
  const [dest, setDest] = useState<Destination>("COUNTER");
  const [minutes, setMinutes] = useState<string>(
    item.minutes != null ? String(item.minutes) : "",
  );
  const [urgent, setUrgent] = useState(item.urgent);
  const [must, setMust] = useState(item.must);
  const [should, setShould] = useState(item.should);
  const [pending, startTransition] = useTransition();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const boxSelectRef = useRef<HTMLSelectElement>(null);
  const minutesInputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  // Track whether the focused element lives inside this row so per-row
  // shortcuts only fire on the row the user is looking at.
  useEffect(() => {
    function check() {
      const el = document.activeElement;
      setFocused(!!wrapperRef.current?.contains(el));
    }
    document.addEventListener("focusin", check);
    document.addEventListener("focusout", check);
    return () => {
      document.removeEventListener("focusin", check);
      document.removeEventListener("focusout", check);
    };
  }, []);

  // The row-level shortcuts. Only one row's listeners fire because they're
  // all gated on `focused`. Inputs auto-skip — typing "u" in the title
  // contenteditable won't toggle Urgent.
  useShortcut("1", () => setDest("ATM"), {
    label: "Send to Project Tasks",
    group: "Field Notes",
    options: { enabled: focused },
  });
  useShortcut("2", () => setDest("COUNTER"), {
    label: "Send to Admin Tasks",
    group: "Field Notes",
    options: { enabled: focused },
  });
  useShortcut("u", () => dest === "COUNTER" && setUrgent((v) => !v), {
    label: "Toggle Urgent",
    group: "Field Notes",
    options: { enabled: focused && dest === "COUNTER" },
  });
  useShortcut("m", () => dest === "COUNTER" && setMust((v) => !v), {
    label: "Toggle Must",
    group: "Field Notes",
    options: { enabled: focused && dest === "COUNTER" },
  });
  useShortcut("s", () => dest === "COUNTER" && setShould((v) => !v), {
    label: "Toggle Should",
    group: "Field Notes",
    options: { enabled: focused && dest === "COUNTER" },
  });
  useShortcut("enter", () => send(), {
    label: "Send",
    group: "Field Notes",
    // Only at row-level (don't conflict with EditableText's blur-on-Enter).
    options: { enabled: focused },
  });
  useShortcut("b", () => boxSelectRef.current?.focus(), {
    label: "Focus box dropdown",
    group: "Field Notes",
    options: { enabled: focused },
  });
  useShortcut("t", () => minutesInputRef.current?.focus(), {
    label: "Focus minutes",
    group: "Field Notes",
    options: { enabled: focused },
  });
  useShortcut("x", () => deleteThought(), {
    label: "Delete thought",
    group: "Field Notes",
    options: { enabled: focused },
  });
  // Escape from inside a field returns focus to the row wrapper, so j/k
  // work again immediately.
  useShortcut("escape", () => wrapperRef.current?.focus(), {
    label: "Back to row",
    group: "Field Notes",
    options: { enabled: focused, allowInInputs: true },
  });

  function send() {
    if (!boxKey) {
      toast.error("Pick a box first.");
      // Drop the user into the box select so they can pick by keyboard.
      boxSelectRef.current?.focus();
      return;
    }
    startTransition(async () => {
      try {
        await triageDropItem(item.id, {
          box_key: boxKey,
          dest,
          minutes: minutes ? Number(minutes) : null,
          energy: null,
          urgent: dest === "COUNTER" ? urgent : false,
          must: dest === "COUNTER" ? must : false,
          should: dest === "COUNTER" ? should : false,
        });
        const label = boxes.find((b) => b.key === boxKey)?.label ?? boxKey;
        toast.success(
          dest === "COUNTER"
            ? `Sent to Admin Tasks · ${label}.`
            : `Sent to Project Tasks · ${label}.`,
        );
        window.dispatchEvent(new CustomEvent("vault:drop-advance"));
      } catch (e: any) {
        toast.error(e?.message ?? "Couldn't send.");
      }
    });
  }

  function deleteThought() {
    startTransition(async () => {
      try {
        await hardDeleteItem(item.id);
        toast.success("Deleted.");
        window.dispatchEvent(new CustomEvent("vault:drop-advance"));
      } catch (e: any) {
        toast.error(e?.message ?? "Couldn't delete.");
      }
    });
  }

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      data-drop-row="true"
      className={clsx(
        "group relative overflow-hidden rounded-sm border bg-vault-panel/40 transition hover:bg-vault-panel/60 outline-none",
        // The whole row is focusable. When the wrapper itself is focused
        // (j/k navigation), give it a strong brass ring so the user sees
        // exactly which thought is "armed". When focus is on a child
        // input, dim it.
        "focus:ring-2 focus:ring-brass focus-within:ring-1 focus-within:ring-brass/40",
        dest === "COUNTER" ? "border-rust/30" : "border-teal/30",
      )}
    >
      {/* Coloured left edge — the at-a-glance signal */}
      <div
        className={clsx(
          "absolute left-0 top-0 bottom-0 w-[4px]",
          dest === "COUNTER" ? "bg-rust" : "bg-teal",
        )}
      />

      {/* Line 1 — destination + title + box (the primary path) */}
      <div className="flex items-center gap-3 pl-6 pr-4 py-2.5">
        <DestSegment dest={dest} onChange={setDest} />
        <EditableText
          itemId={item.id}
          field="title"
          initial={item.title}
          className="min-w-0 flex-1 vault-task-title"
          placeholder="(no title)"
        />
        <select
          ref={boxSelectRef}
          value={boxKey}
          onChange={(e) => setBoxKey(e.target.value)}
          className={clsx(
            "shrink-0 rounded-sm border px-2 py-1 font-mono text-[11px] outline-none transition focus:border-brass",
            boxKey
              ? "border-brass/50 text-brass"
              : "border-vault-line text-ink-mute",
          )}
        >
          <option value="" className="bg-vault-bg">
            — pick box —
          </option>
          {boxes.map((b) => (
            <option key={b.key} value={b.key} className="bg-vault-bg">
              {b.label}
            </option>
          ))}
        </select>
      </div>

      {/* Line 2 — metadata + actions, anchored right */}
      <div className="flex flex-wrap items-center gap-3 border-t border-vault-line/30 bg-vault-bg/20 pl-6 pr-3 py-1.5">
        <Minutes
          value={minutes}
          onChange={setMinutes}
          inputRef={minutesInputRef}
        />

        {dest === "COUNTER" && (
          <div className="flex items-center gap-1">
            <FlagToggle
              on={urgent}
              onChange={setUrgent}
              kind="urgent"
              label="Urgent (U)"
              color="text-amber-700"
            />
            <FlagToggle
              on={must}
              onChange={setMust}
              kind="must"
              label="Must (M)"
              color="text-sky-600"
            />
            <FlagToggle
              on={should}
              onChange={setShould}
              kind="should"
              label="Should (S)"
              color="text-green-500"
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={deleteThought}
            disabled={pending}
            title="Delete"
            className="rounded-sm px-2 py-1 font-mono text-[10px] tracking-wider text-ink-mute/60 transition hover:bg-rust/10 hover:text-rust"
          >
            DELETE
          </button>
          <button
            onClick={send}
            disabled={pending || !boxKey}
            title="Press Enter"
            className="brass-button flex items-center gap-1.5 px-3 py-1 font-mono text-[10px] tracking-[0.18em] disabled:opacity-40"
          >
            {pending ? (
              "..."
            ) : (
              <>
                <span>→ SEND</span>
                {focused && <Kbd keys="enter" size="xs" className="text-[#2a1c08]/70" />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Compact two-button segmented control. Active half is filled with its
// destination color so it reads from across the screen.
function DestSegment({
  dest,
  onChange,
}: {
  dest: Destination;
  onChange: (next: Destination) => void;
}) {
  return (
    <div className="flex shrink-0 overflow-hidden rounded-sm border border-vault-line/60 bg-vault-bg/40">
      <SegmentButton
        active={dest === "ATM"}
        onClick={() => onChange("ATM")}
        accent="teal"
        hint="1"
      >
        PROJECT TASKS
      </SegmentButton>
      <SegmentButton
        active={dest === "COUNTER"}
        onClick={() => onChange("COUNTER")}
        accent="rust"
        hint="2"
      >
        ADMIN TASKS
      </SegmentButton>
    </div>
  );
}

function SegmentButton({
  active,
  onClick,
  accent,
  hint,
  children,
}: {
  active: boolean;
  onClick: () => void;
  accent: "teal" | "rust";
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={hint ? `Press ${hint}` : undefined}
      className={clsx(
        "px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] transition",
        active && accent === "teal" && "bg-teal text-vault-bg",
        active && accent === "rust" && "bg-rust text-vault-bg",
        !active && "text-ink-mute/70 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

// Minutes input with inline ⏱ glyph + unit suffix.
function Minutes({
  value,
  onChange,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-baseline gap-1 rounded-sm border bg-vault-bg/40 px-1.5 py-0.5 transition focus-within:border-brass",
        value ? "border-brass/40" : "border-vault-line",
      )}
    >
      <span
        className={clsx(
          "font-mono text-[10px]",
          value ? "text-brass/70" : "text-ink-mute/60",
        )}
      >
        ⏱
      </span>
      <input
        ref={inputRef}
        type="number"
        min={0}
        max={1440}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className="w-10 bg-transparent text-right font-mono text-[11px] text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
      />
      <span className="font-mono text-[9px] text-ink-mute/60">min</span>
    </span>
  );
}

function FlagToggle({
  on,
  onChange,
  kind,
  label,
  color,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  kind: FlagKind;
  label: string;
  color: string;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      title={label}
      className={clsx(
        "flex h-6 w-6 items-center justify-center rounded-sm border leading-none transition",
        on
          ? `border-current ${color}`
          : "border-vault-line text-ink-mute/40 hover:border-brass/40 hover:text-ink-mute",
      )}
    >
      <FlagIcon kind={kind} filled={on} size={12} />
    </button>
  );
}
