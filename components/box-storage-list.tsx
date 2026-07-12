"use client";

import { useRouter } from "next/navigation";
import { NewItemRow } from "@/components/new-item-row";
import { EditableText } from "@/components/editable-text";
import { TriageChips } from "@/components/triage-chips";
import type { BoxKey, Item } from "@/lib/types";

export function BoxStorageList({
  boxKey,
  title,
  items,
}: {
  boxKey: BoxKey;
  title: string;
  items: Item[];
}) {
  const router = useRouter();

  return (
    <div className="space-y-2">
      <NewItemRow
        box={boxKey}
        placeholder={`+ New in ${title}`}
        onCreated={() => router.refresh()}
      />
      {items.map((it) => (
        <div
          key={it.id}
          className="flex flex-wrap items-start gap-3 rounded-sm border border-vault-line bg-vault-panel/40 px-4 py-3"
        >
          {it.potential && (
            <span
              className="shrink-0 font-mono text-[11px] tracking-wider text-brass"
              title={`Potential: ${it.potential}/5`}
            >
              {"★".repeat(it.potential)}
              <span className="text-brass/30">
                {"★".repeat(5 - it.potential)}
              </span>
            </span>
          )}
          <span className="flex shrink-0 items-baseline gap-1 font-mono text-[10px] text-ink-mute">
            <EditableText
              itemId={it.id}
              field="minutes"
              initial={it.minutes}
              className="w-12 text-right"
              numeric
              placeholder="—"
            />
            <span>min</span>
          </span>
          {it.person && (
            <span className="shrink-0 rounded-sm border border-brass/30 px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-brass">
              {it.person}
            </span>
          )}
          <p
            className="vault-task-title min-w-[200px] flex-1 whitespace-pre-wrap break-words text-ink"
            title={it.title}
          >
            {it.title}
          </p>
          <TriageChips
            itemId={it.id}
            targets={[{ label: "→ Field Notes", box: "DROP" }]}
            deleteLabel="Delete"
            deleteHard
          />
        </div>
      ))}
    </div>
  );
}
