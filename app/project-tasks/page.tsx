import Link from "next/link";
import clsx from "clsx";
import { getItemsByBox } from "@/lib/data";
import { getBoxes } from "@/lib/categories";
import { EditableText } from "@/components/editable-text";
import { AreaPill } from "@/components/area-pill";
import { NewAtmItemRow } from "@/components/new-atm-item-row";
import { AtmCategorySortableList } from "@/components/atm-category-sortable-list";
import type { Item } from "@/lib/types";

// Convert a BOX_KEY → slug for the vault drilldown URL.
function slugify(key: string): string {
  return key.toLowerCase().replace(/_/g, "-").replace(/\//g, "-");
}

type AtmFilter =
  | "all"
  | "picked"
  | "unpicked"
  | "quick";

const FILTERS: { key: AtmFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "picked", label: "Picked for today" },
  { key: "unpicked", label: "Not picked" },
  { key: "quick", label: "Quick (5–15)" },
];

const VALID_FILTERS: readonly AtmFilter[] = [
  "all",
  "picked",
  "unpicked",
  "quick",
];

const UNCATEGORIZED = "__none__";
const ATM_CATEGORY_ORDER = [
  "STONEWATER BOOKS",
  "ECOM & ECOSHIP",
  "WRITING",
  "READ / WATCH",
  "FRIENDS & FAMILY",
  "LEISURE",
  "HOME & GARDEN",
] as const;

function normalizeLabel(v: string): string {
  return v.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function coerceFilter(raw: string | undefined): AtmFilter {
  const r = raw ?? "all";
  return VALID_FILTERS.includes(r as AtmFilter) ? (r as AtmFilter) : "all";
}

function decodeCategoryParam(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  return raw === UNCATEGORIZED ? "" : raw;
}

/** e.g. 120 → "2 hours", 90 → "1 hour, 30 minutes", 45 → "45 minutes". */
function formatHoursMinutesProse(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0 minutes";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} hour${h === 1 ? "" : "s"}`);
  if (m > 0) parts.push(`${m} minute${m === 1 ? "" : "s"}`);
  return parts.join(", ");
}

function applyAtmFilter(items: Item[], f: AtmFilter): Item[] {
  switch (f) {
    case "picked":
      return items.filter((i) => (i.todayOrder ?? null) !== null);
    case "unpicked":
      return items.filter((i) => (i.todayOrder ?? null) === null);
    case "quick":
      return items.filter(
        (i) => (i.minutes ?? 0) >= 5 && (i.minutes ?? 0) <= 15,
      );
    case "all":
    default:
      return items;
  }
}

function filterSummary(f: AtmFilter): string {
  if (f === "all") return "FILTER";
  return `FILTER · ${f.replace(/-/g, " ").toUpperCase()}`;
}

export default async function AtmPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const active = coerceFilter(sp.filter);
  const categoryDecoded = decodeCategoryParam(sp.category);

  const [list, boxes] = await Promise.all([
    getItemsByBox("ATM"),
    getBoxes(),
  ]);
  const filtered = applyAtmFilter(list, active);

  const labelByKey = new Map(boxes.map((b) => [b.key, b.label]));

  const categoryKeys = [
    ...new Set(list.map((it) => it.category ?? "")),
  ].sort((a, b) => {
    if (a === "" && b !== "") return 1;
    if (a !== "" && b === "") return -1;
    return a.localeCompare(b);
  });
  const orderedCategoryKeys = [
    ...categoryKeys.filter((k) => k !== "").sort((a, b) => {
      const la = labelByKey.get(a) ?? a;
      const lb = labelByKey.get(b) ?? b;
      const ia = ATM_CATEGORY_ORDER.findIndex(
        (x) => normalizeLabel(x) === normalizeLabel(la),
      );
      const ib = ATM_CATEGORY_ORDER.findIndex(
        (x) => normalizeLabel(x) === normalizeLabel(lb),
      );
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return la.localeCompare(lb);
    }),
    ...(categoryKeys.includes("") ? [""] : []),
  ];

  const groups = new Map<string, Item[]>();
  for (const it of filtered) {
    const key = it.category ?? "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(it);
  }
  const selectedCategoryItems =
    categoryDecoded === undefined ? [] : groups.get(categoryDecoded) ?? [];
  const selectedCategoryTotalMinutes = selectedCategoryItems.reduce(
    (sum, i) => sum + (i.minutes ?? 0),
    0,
  );
  const selectedCategoryLabel =
    categoryDecoded === ""
      ? "Uncategorized"
      : categoryDecoded
        ? (labelByKey.get(categoryDecoded) ?? categoryDecoded)
        : null;

  function atmHref(f: AtmFilter, extra?: { category?: string | null }) {
    const p = new URLSearchParams();
    if (f !== "all") p.set("filter", f);
    if (extra?.category !== undefined && extra?.category !== null) {
      p.set(
        "category",
        extra.category === "" ? UNCATEGORIZED : extra.category,
      );
    } else if (extra?.category === null) {
      p.delete("category");
    }
    const q = p.toString();
    return q ? `/project-tasks?${q}` : "/project-tasks";
  }

  return (
    <div className="mx-auto max-w-[960px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        Project Tasks
      </h1>
      <p className="mt-1 text-[13px] text-ink-dim">
        Pull out whatever you&apos;d like to work on today. Nothing here is
        an obligation.
      </p>

      <details className="group mt-6" open>
        <summary className="cursor-pointer list-none font-mono text-[10px] tracking-[0.24em] text-ink-mute hover:text-brass">
          <span className="inline-block transition-transform group-open:rotate-90">
            ›
          </span>{" "}
          {filterSummary(active)}
        </summary>
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={atmHref(f.key, { category: categoryDecoded ?? null })}
                className={clsx(
                  "rounded-sm border px-4 py-1.5 font-mono text-[11px] tracking-wider transition",
                  active === f.key
                    ? "border-brass bg-brass/10 text-brass"
                    : "border-vault-line text-ink-mute hover:border-brass/40 hover:text-brass",
                )}
              >
                {f.label}
              </Link>
            ))}
          </div>
        </div>
      </details>

      <div className="mt-6">
        <NewAtmItemRow boxes={boxes} initialCategory={categoryDecoded ?? ""} />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 rounded-sm border border-dashed border-vault-line/60 px-4 py-6 text-center text-ink-mute">
          Nothing matches this filter.
        </p>
      ) : (
        <>
          <div className="mt-6 eyebrow text-ink-mute">— Choose a box —</div>
          <div className="mt-3 grid w-full grid-cols-2 gap-2 justify-items-stretch sm:grid-cols-4">
            {orderedCategoryKeys.map((cat) => {
              const label =
                cat === "" ? "Uncategorized" : (labelByKey.get(cat) ?? cat);
              return (
                <Link
                  key={cat || "__uncat__"}
                  href={atmHref(active, { category: cat })}
                  className={clsx(
                    "group relative flex min-h-[100px] w-full min-w-0 flex-col justify-between rounded-sm border bg-vault-panel/40 px-3 py-3 text-left transition",
                    "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-brass/70",
                    categoryDecoded === cat
                      ? "border-brass/50 bg-vault-panel/70 ring-1 ring-brass/25"
                      : "border-vault-line/60 hover:border-brass/40 hover:bg-vault-panel/60",
                  )}
                >
                  <h3 className="min-w-0 truncate text-[16px] font-medium leading-tight text-ink sm:text-[17px]">
                    {label}
                  </h3>
                  <div className="mt-2 flex items-baseline justify-end font-mono text-[10px] tracking-wider text-ink-mute">
                    <span>
                      {groups.get(cat)?.length ?? 0} item
                      {(groups.get(cat)?.length ?? 0) === 1 ? "" : "s"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {categoryDecoded !== undefined && (
            <section className="mt-6 rounded-sm border border-vault-line/80 bg-vault-panel/30 p-4 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-vault-line/50 pb-4">
                <div>
                  <div className="eyebrow text-ink-mute">— In this box —</div>
                  <h2 className="serif-h mt-1 text-[26px] leading-tight text-ink md:text-[30px]">
                    {selectedCategoryLabel}
                  </h2>
                  <p className="mt-1 font-mono text-[10px] text-ink-mute">
                    {selectedCategoryItems.length} item
                    {selectedCategoryItems.length === 1 ? "" : "s"} ~{" "}
                    {formatHoursMinutesProse(selectedCategoryTotalMinutes)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {categoryDecoded &&
                    categoryDecoded !== "" &&
                    labelByKey.has(categoryDecoded) && (
                      <Link
                        href={`/boxes/${slugify(categoryDecoded)}`}
                        className="rounded-sm border border-vault-line px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-ink-mute transition hover:border-brass/40 hover:text-brass"
                      >
                        Open full page
                      </Link>
                    )}
                  <Link
                    href={atmHref(active, { category: null })}
                    className="rounded-sm border border-vault-line px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-ink-mute transition hover:border-brass/40 hover:text-brass"
                  >
                    Close
                  </Link>
                </div>
              </div>

              {selectedCategoryItems.length === 0 ? (
                <p className="mt-4 text-[13px] text-ink-mute">
                  No items in this box for the current filter.
                </p>
              ) : (
                <div className="mt-4">
                  <AtmCategorySortableList
                    items={selectedCategoryItems}
                    boxes={boxes}
                  />
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
