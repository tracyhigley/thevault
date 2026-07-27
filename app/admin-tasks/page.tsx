import { Fragment } from "react";
import Link from "next/link";
import clsx from "clsx";
import { getItemsByBox } from "@/lib/data";
import { getBuildings } from "@/lib/categories";
import { EditableText, EditableFlag } from "@/components/editable-text";
import { AreaPill } from "@/components/area-pill";
import { NewCounterItemRow } from "@/components/new-counter-item-row";
import {
  CounterSectionedLists,
  type CounterSectionGroup,
} from "@/components/counter-sectioned-lists";
import type { SortableItem } from "@/components/sortable-list";
import { TodayToggle } from "@/components/today-toggle";
import { CounterDoneButton } from "@/components/counter-done-button";
import { DeleteItemButton } from "@/components/delete-item-button";
import type { Item } from "@/lib/types";

type Filter =
  | "all"
  | "stress"
  | "urgent"
  | "must"
  | "should"
  | "quick"
  | "byarea";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "stress", label: "Stress" },
  { key: "urgent", label: "Urgent" },
  { key: "must", label: "Must" },
  { key: "quick", label: "Quick (5–15)" },
];

const VALID_FILTERS: readonly Filter[] = [
  "all",
  "stress",
  "urgent",
  "must",
  "should",
  "quick",
  "byarea",
];

function sumMinutes(items: Item[]): number {
  return items.reduce((sum, item) => sum + (item.minutes ?? 0), 0);
}

function formatMinutesShort(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

/** Next may pass a single string or repeated keys as `string[]`. */
function firstQuery(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function coerceFilter(raw: string | undefined): Filter {
  const r = raw ?? "all";
  return VALID_FILTERS.includes(r as Filter) ? (r as Filter) : "all";
}

/**
 * Filter semantics match the row chrome on Admin Tasks:
 *   Stress  → both flags (rust “stressor” strip)
 *   Urgent  → urgent only, not must (amber strip)
 *   Must    → must only, not urgent (sky strip)
 *   Should  → any item marked should (emerald strip when should-only)
 * Items with both flags appear only under Stress (and All), not under Urgent or Must.
 */
function applyFilter(items: Item[], f: Filter, area?: string): Item[] {
  switch (f) {
    case "stress":
      return items.filter((i) => i.urgent && i.must);
    case "urgent":
      return items.filter((i) => i.urgent && !i.must);
    case "must":
      return items.filter((i) => i.must && !i.urgent);
    case "should":
      return items.filter((i) => i.should);
    case "quick":
      return items.filter(
        (i) => (i.minutes ?? 0) >= 5 && (i.minutes ?? 0) <= 15,
      );
    case "byarea":
      return area ? items.filter((i) => i.area === area) : items;
    case "all":
    default:
      return items;
  }
}

/** Preserve `filtered` iteration order within each triage bucket. */
function partitionCounterItemsPreservingOrder(items: Item[]) {
  const stress: Item[] = [];
  const urgent: Item[] = [];
  const must: Item[] = [];
  const should: Item[] = [];
  const plain: Item[] = [];
  for (const it of items) {
    if (it.urgent && it.must) stress.push(it);
    else if (it.urgent && !it.must) urgent.push(it);
    else if (it.must && !it.urgent) must.push(it);
    else if (it.should) should.push(it);
    else plain.push(it);
  }
  return { stress, urgent, must, should, plain };
}

export default async function CounterPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; area?: string }>;
}) {
  const sp = await searchParams;
  const active = coerceFilter(firstQuery(sp.filter));
  const area = firstQuery(sp.area);
  const [all, buildings] = await Promise.all([
    getItemsByBox("COUNTER"),
    getBuildings(),
  ]);
  const filtered = applyFilter(all, active, area);
  const areas = buildings
    .filter((b) => all.some((it) => it.area === b.key))
    .map((b) => ({ key: b.key, label: b.label }));
  const filterTotals: Partial<Record<Filter, number>> = {
    all: sumMinutes(all),
    stress: sumMinutes(applyFilter(all, "stress")),
    urgent: sumMinutes(applyFilter(all, "urgent")),
    must: sumMinutes(applyFilter(all, "must")),
    should: sumMinutes(applyFilter(all, "should")),
    quick: sumMinutes(applyFilter(all, "quick")),
  };
  const todayMinutes = sumMinutes(
    all.filter((it) => (it.todayOrder ?? null) !== null),
  );

  const boxOpts = buildings.map((b) => ({ key: b.key, label: b.label }));
  const { stress, urgent, must, should, plain } =
    partitionCounterItemsPreservingOrder(filtered);

  const counterGroups: CounterSectionGroup[] = [];
  if (stress.length > 0) {
    counterGroups.push({
      key: "stress",
      title: "Stressors",
      items: stress.map(
        (it): SortableItem => ({
          id: it.id,
          content: <CounterRow item={it} boxes={boxOpts} />,
        }),
      ),
    });
  }
  if (urgent.length > 0) {
    counterGroups.push({
      key: "urgent",
      title: "Other Urgent",
      items: urgent.map(
        (it): SortableItem => ({
          id: it.id,
          content: <CounterRow item={it} boxes={boxOpts} />,
        }),
      ),
    });
  }
  if (must.length > 0) {
    counterGroups.push({
      key: "must",
      title: "Other Must-Do",
      items: must.map(
        (it): SortableItem => ({
          id: it.id,
          content: <CounterRow item={it} boxes={boxOpts} />,
        }),
      ),
    });
  }
  if (should.length > 0) {
    counterGroups.push({
      key: "should",
      title: "Other Should",
      items: should.map(
        (it): SortableItem => ({
          id: it.id,
          content: <CounterRow item={it} boxes={boxOpts} />,
        }),
      ),
    });
  }
  if (plain.length > 0) {
    counterGroups.push({
      key: "plain",
      title: "Other",
      items: plain.map(
        (it): SortableItem => ({
          id: it.id,
          content: <CounterRow item={it} boxes={boxOpts} />,
        }),
      ),
    });
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        Admin Tasks
      </h1>
      <p className="text-ink-dim mt-1 text-[13px]">
        Obligations — what has to happen.
      </p>

      <details className="group mt-6" open>
        <summary className="text-ink-mute hover:text-brass cursor-pointer list-none font-mono text-[10px] tracking-[0.24em]">
          <span className="inline-block transition-transform group-open:rotate-90">
            ›
          </span>{" "}
          {active === "all" ? "FILTER" : `FILTER · ${active.toUpperCase()}`}
        </summary>
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Fragment key={f.key}>
                <Link
                  href={
                    f.key === "all"
                      ? "/admin-tasks"
                      : `/admin-tasks?filter=${f.key}`
                  }
                  className={clsx(
                    "rounded-sm border px-4 py-1.5 font-mono text-[11px] tracking-wider transition",
                    active === f.key
                      ? "border-brass bg-brass/10 text-brass"
                      : "border-paper-line text-ink-mute hover:border-brass/40 hover:text-brass",
                  )}
                >
                  {`${f.label}: ${formatMinutesShort(filterTotals[f.key] ?? 0)}`}
                </Link>
                {f.key === "all" ? (
                  <span
                    className="border-paper-line text-ink-mute rounded-sm border px-4 py-1.5 font-mono text-[11px] tracking-wider"
                    title="Total minutes across everything marked Today"
                  >
                    {`Today: ${formatMinutesShort(todayMinutes)}`}
                  </span>
                ) : null}
              </Fragment>
            ))}
          </div>
          {areas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {areas.map((a) => (
                <Link
                  key={a.key}
                  href={`/admin-tasks?filter=byarea&area=${encodeURIComponent(a.key)}`}
                  className={clsx(
                    "rounded-sm border px-4 py-1.5 font-mono text-[11px] tracking-wider transition",
                    active === "byarea" && area === a.key
                      ? "border-brass bg-brass/10 text-brass"
                      : "border-paper-line text-ink-mute hover:border-brass/40 hover:text-brass",
                  )}
                >
                  {a.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </details>

      <div className="mt-6">
        <div className="mb-3">
          <NewCounterItemRow boxes={boxOpts} initialArea={area ?? ""} />
        </div>
        {filtered.length === 0 ? (
          <p className="text-ink-mute mt-4 text-[13px]">
            {active === "all"
              ? "Nothing on Admin Tasks yet."
              : "No items match this filter."}
          </p>
        ) : (
          <CounterSectionedLists
            listKey={`${active}:${area ?? ""}`}
            syncSignature={counterGroups
              .map((g) => `${g.key}:${g.items.map((i) => i.id).join(",")}`)
              .join("|")}
            groups={counterGroups}
          />
        )}
      </div>
    </div>
  );
}

/** Matches Project Tasks row `AreaPill` chip sizing. */
const COUNTER_AREA_PILL_CLASS =
  // Wider so long area labels (e.g. "Home & Garden") don't truncate.
  "!max-h-7 max-w-[9.25rem] shrink-0 !py-0.5 !pl-1.5 !pr-1 !text-[9px] !leading-tight border-brass/40 bg-paper-bg/20";

function CounterRow({
  item,
  boxes,
}: {
  item: Item;
  boxes: { key: string; label: string }[];
}) {
  const stressor = item.urgent && item.must;
  const mustOnly = item.must && !item.urgent;
  const urgentOnly = item.urgent && !item.must;
  const shouldOnly = item.should && !item.urgent && !item.must;
  const onToday = (item.todayOrder ?? null) !== null;
  return (
    <div
      className={clsx(
        "bg-paper-panel/40 flex min-w-0 items-start gap-3 rounded-sm border px-3 py-2 transition",
        onToday
          ? "border-brass/40"
          : stressor
            ? "border-rust/30"
            : mustOnly
              ? "border-sky-600/35"
              : urgentOnly
                ? "border-amber-500/45"
                : shouldOnly
                  ? "border-emerald-600/40"
                  : "border-paper-line/60",
      )}
    >
      {stressor || item.urgent || item.must || item.should ? (
        <div
          className={clsx(
            "w-1 shrink-0 self-stretch rounded-sm",
            stressor
              ? "bg-rust"
              : mustOnly
                ? "bg-sky-600"
                : urgentOnly
                  ? "bg-amber-500"
                  : "bg-emerald-600",
          )}
          aria-hidden
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-3">
          <AreaPill
            itemId={item.id}
            initial={item.area}
            options={boxes}
            className={COUNTER_AREA_PILL_CLASS}
          />
          <EditableText
            itemId={item.id}
            field="title"
            initial={item.title}
            className={clsx(
              "paper-task-title min-w-0 flex-1 truncate",
              onToday ? "text-ink" : "text-ink-mute",
            )}
            placeholder="(no title)"
          />
          <span className="text-ink-mute flex shrink-0 items-baseline justify-end gap-1 font-mono text-[11px] whitespace-nowrap tabular-nums">
            <EditableText
              itemId={item.id}
              field="minutes"
              initial={item.minutes}
              className="w-16 max-w-[4.5rem] min-w-[3.25rem] bg-transparent px-0 text-right text-[11px] tabular-nums"
              numeric
              placeholder="—"
            />
            <span>min</span>
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <EditableFlag
              itemId={item.id}
              field="urgent"
              initial={item.urgent}
              kind="urgent"
              className="text-amber-700"
            />
            <EditableFlag
              itemId={item.id}
              field="must"
              initial={item.must}
              kind="must"
              className="text-sky-600"
            />
            <EditableFlag
              itemId={item.id}
              field="should"
              initial={item.should}
              kind="should"
              className="text-green-500"
            />
          </div>
          <TodayToggle itemId={item.id} on={onToday} size="sm" />
          <CounterDoneButton itemId={item.id} />
          <DeleteItemButton itemId={item.id} />
        </div>
      </div>
    </div>
  );
}
