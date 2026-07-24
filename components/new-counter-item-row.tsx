"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createItem } from "@/lib/actions";
import { CounterFlagDraft } from "@/components/editable-text";
import {
  MinutesInlineInput,
  parseMinutesField,
} from "@/components/minutes-inline-input";
import { Select } from "@/components/ui";

export function NewCounterItemRow({
  boxes,
  initialArea = "",
}: {
  boxes: { key: string; label: string }[];
  initialArea?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [area, setArea] = useState(initialArea);
  const [minutes, setMinutes] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [must, setMust] = useState(false);
  const [should, setShould] = useState(false);
  const [pending, startTransition] = useTransition();

  function add() {
    const t = title.trim();
    if (!t || !area) return;
    startTransition(async () => {
      const m = parseMinutesField(minutes);
      await createItem("COUNTER", t, {
        area,
        category: null,
        urgent,
        must,
        should,
        ...(m !== undefined ? { minutes: m } : {}),
      });
      setTitle("");
      setMinutes("");
      setUrgent(false);
      setMust(false);
      setShould(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-sm border border-dashed border-paper-line/60 bg-paper-panel/20 px-4 py-2 transition hover:border-brass/40">
      <span className="font-mono text-[10px] tracking-wider text-ink-mute">+</span>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        placeholder="+ New admin task"
        className="paper-task-title min-w-[220px] flex-1 bg-transparent text-ink placeholder:text-ink-mute outline-none"
      />
      <Select
        value={area}
        onChange={(e) => setArea(e.target.value)}
        tone="brass"
        className="w-[13rem] shrink-0 px-2 py-1 font-mono text-[10px]"
        aria-label="Pick building for new admin task"
      >
        <option value="" className="bg-paper-bg">
          — pick building —
        </option>
        {boxes.map((b) => (
          <option key={b.key} value={b.key} className="bg-paper-bg">
            {b.label}
          </option>
        ))}
      </Select>
      <MinutesInlineInput
        value={minutes}
        onChange={setMinutes}
        aria-label="Minutes for new admin task"
      />
      <div className="flex shrink-0 items-center gap-1">
        <CounterFlagDraft
          on={urgent}
          onChange={setUrgent}
          kind="urgent"
          activeClassName="text-amber-700"
        />
        <CounterFlagDraft
          on={must}
          onChange={setMust}
          kind="must"
          activeClassName="text-sky-600"
        />
        <CounterFlagDraft
          on={should}
          onChange={setShould}
          kind="should"
          activeClassName="text-green-500"
        />
      </div>
      <button
        type="button"
        onClick={add}
        disabled={pending || !title.trim() || !area}
        className="rounded-sm border border-brass/40 px-3 py-1 font-mono text-[10px] tracking-[0.16em] text-brass transition hover:bg-brass/10 disabled:opacity-40"
      >
        ADD
      </button>
      {pending && (
        <span className="font-mono text-[10px] text-brass">saving…</span>
      )}
    </div>
  );
}
