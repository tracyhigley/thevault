// DONE — the archive of finished Admin Tasks (and one-off custom blocks)
// checked off from Today's docket. Grouped under a heading for the
// calendar date each item was finished, newest date first. Project Tasks
// never land here — finishing one strikes it through on its Project Plan
// instead (see completeTodayItem in lib/actions.ts).

import { format, parse } from "date-fns";
import { getDoneItems } from "@/lib/data";
import { DAY_TIMEZONE } from "@/lib/day-timezone";
import { ymdInTz } from "@/lib/calendar-day-bounds";
import { DeleteItemButton } from "@/components/delete-item-button";
import { UndoDoneButton } from "@/components/undo-done-button";
import type { Item } from "@/lib/types";

function dateHeading(ymd: string): string {
  const d = parse(ymd, "yyyy-MM-dd", new Date());
  return format(d, "EEEE, MMMM d, yyyy");
}

export default async function DonePage() {
  const items = await getDoneItems();

  // items arrive newest-first from getDoneItems, so building groups in
  // that same pass keeps dates newest-first too.
  const groups: { ymd: string; items: Item[] }[] = [];
  for (const it of items) {
    const ymd = it.actualEnd
      ? ymdInTz(new Date(it.actualEnd), DAY_TIMEZONE)
      : "Undated";
    const last = groups[groups.length - 1];
    if (last && last.ymd === ymd) {
      last.items.push(it);
    } else {
      groups.push({ ymd, items: [it] });
    }
  }

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        Done.
      </h1>
      <p className="mt-1 text-[13px] text-ink-dim">
        Admin Tasks checked off from Today — proof it gets done.
      </p>

      {groups.length === 0 ? (
        <p className="mt-10 text-[13px] text-ink-mute">
          Nothing finished yet. The first one will land here.
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          {groups.map((g) => (
            <div key={g.ymd}>
              <p className="font-mono text-[10px] tracking-[0.18em] text-ink-mute">
                {g.ymd === "Undated" ? "UNDATED" : dateHeading(g.ymd).toUpperCase()}
              </p>
              <div className="mt-2 space-y-2">
                {g.items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center gap-3 rounded-sm border border-paper-line bg-paper-panel px-4 py-3"
                  >
                    <span className="mr-1 text-teal">✓</span>
                    <div className="min-w-0 flex-1">
                      <div className="paper-task-title line-through text-ink-mute">
                        {it.title}
                      </div>
                      {it.minutes != null && (
                        <div className="mt-0.5 text-[11px] text-ink-mute">
                          {it.minutes} min
                        </div>
                      )}
                    </div>
                    <UndoDoneButton itemId={it.id} />
                    <DeleteItemButton itemId={it.id} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
