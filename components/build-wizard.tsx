"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { toast } from "sonner";
import { formatEndOfDay12h, parseTimeOnDate } from "@/lib/daily-plan";
import { saveDayInputsPartial, applyAtmBoxBudgets } from "@/lib/actions";
import { markPreferTodayOverDropLanding } from "@/lib/vault-nav-client";
import { DropTriageRow } from "@/components/drop-triage-row";
import { EditableText } from "@/components/editable-text";
import { NewCounterItemRow } from "@/components/new-counter-item-row";
import { TodayToggle } from "./today-toggle";
import type { DayInputs, Item } from "@/lib/types";
import type { Box, EnergyType } from "@/lib/categories";
import { useShortcut } from "@/lib/shortcuts";
import { Kbd } from "./kbd";

const STEPS = [
  { n: 1, title: "End Time" },
  { n: 2, title: "Drop" },
  { n: 3, title: "Counter" },
  { n: 4, title: "ATM" },
] as const;

export function BuildWizard({
  step,
  inputs,
  dropItems,
  counterItems,
  atmItems,
  boxes,
  energies,
  stressors,
  timeSensitive,
  mustDo,
  otherAdmin,
}: {
  step: number;
  inputs: DayInputs;
  dropItems: Item[];
  counterItems: Item[];
  atmItems: Item[];
  boxes: Box[];
  energies: EnergyType[];
  stressors: Item[];
  timeSensitive: Item[];
  mustDo: Item[];
  otherAdmin: Item[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const total = STEPS.length;
  function next() {
    router.push(`/build?step=${step + 1}`);
  }

  function prev() {
    if (step === 1) {
      markPreferTodayOverDropLanding();
      router.push("/");
    } else router.push(`/build?step=${step - 1}`);
  }

  function finish() {
    markPreferTodayOverDropLanding();
    router.push("/");
  }

  // Esc → back. Enter advances on steps without editable text fields.
  useShortcut("escape", prev, {
    label: "Back / cancel",
    group: "Build day",
    options: { allowInInputs: true },
  });
  useShortcut(
    "enter",
    () => {
      if (step === 3) next();
    },
    {
      label: "Continue",
      group: "Build day",
      options: { enabled: step === 3 },
    },
  );

  return (
    <div className="relative mx-auto flex min-h-[80vh] max-w-[640px] flex-col px-4 py-12 md:px-10">
      <Progress step={step} total={total} />

      <div className="mt-12 flex-1">
        {step === 1 && (
          <DaySetupStep
            inputs={inputs}
            date={inputs.date}
            onNext={next}
            pending={pending}
            startTransition={startTransition}
          />
        )}
        {step === 2 && (
          <DropStep dropItems={dropItems} boxes={boxes} energies={energies} onNext={next} />
        )}
        {step === 3 && (
          <ReviewStep
            boxes={boxes}
            stressors={stressors}
            timeSensitive={timeSensitive}
            mustDo={mustDo}
            otherAdmin={otherAdmin}
            onNext={next}
          />
        )}
        {step === 4 && (
          <AtmStep
            atm={atmItems}
            counterItems={counterItems}
            inputs={inputs}
            boxes={boxes}
            onFinish={finish}
          />
        )}
      </div>

      <div className="mt-8 flex items-center justify-between font-mono text-[10px] tracking-[0.18em] text-ink-mute">
        <button
          onClick={prev}
          className="flex items-center gap-2 hover:text-brass"
          disabled={pending}
        >
          <Kbd keys="escape" size="xs" />
          <span>← {step === 1 ? "CANCEL" : "BACK"}</span>
        </button>
        <Link
          href="/"
          className="hover:text-brass"
          onClick={() => markPreferTodayOverDropLanding()}
        >
          SKIP &amp; OPEN VAULT
        </Link>
      </div>
    </div>
  );
}

function Progress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <div
          key={n}
          className={clsx(
            "h-[3px] flex-1 rounded-full transition",
            n < step
              ? "bg-brass"
              : n === step
                ? "bg-brass-bright"
                : "bg-vault-line",
          )}
        />
      ))}
    </div>
  );
}

// Step 1: end-of-day time only.
function DaySetupStep({
  inputs,
  date,
  onNext,
  pending,
  startTransition,
}: {
  inputs: DayInputs;
  date: string;
  onNext: () => void;
  pending: boolean;
  startTransition: (fn: () => Promise<void>) => void;
}) {
  const [endOfDay, setEndOfDay] = useState(() => {
    try {
      return formatEndOfDay12h(inputs.endOfDay, date);
    } catch {
      return inputs.endOfDay;
    }
  });
  function submit() {
    let normalizedEnd: string;
    let hoursAvailable: number;
    try {
      normalizedEnd = formatEndOfDay12h(endOfDay.trim(), date);
      const end = parseTimeOnDate(normalizedEnd, date);
      const ms = end.getTime() - Date.now();
      hoursAvailable = Math.round(Math.max(0, Math.min(24, ms / 3_600_000)) * 100) / 100;
    } catch {
      toast.error("Couldn’t read that time — try 4:30 PM.");
      return;
    }
    startTransition(async () => {
      try {
        await saveDayInputsPartial({
          date,
          hours_available: hoursAvailable,
          end_of_day: normalizedEnd,
          reference_now: new Date().toISOString(),
          reference_tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        onNext();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Couldn't save.");
      }
    });
  }

  return (
    <Step
      title="When does your day end?"
      hint="Set your end-of-day time first. Next, you will clear The Drop before choosing Counter and ATM items for today."
      pending={pending}
      onSubmit={submit}
      submitLabel="NEXT"
    >
      <div className="mt-2">
        <p className="eyebrow">End of your work day</p>
        <input
          type="text"
          value={endOfDay}
          onChange={(e) => setEndOfDay(e.target.value)}
          placeholder="e.g. 4:30 PM"
          autoComplete="off"
          className="mt-3 w-full rounded-sm border border-vault-line bg-vault-panel/60 px-4 py-3 font-mono text-[18px] text-ink outline-none placeholder:text-ink-mute focus:border-brass"
        />
      </div>
    </Step>
  );
}

function DropStep({
  dropItems,
  boxes,
  energies,
  onNext,
}: {
  dropItems: Item[];
  boxes: Box[];
  energies: EnergyType[];
  onNext: () => void;
}) {
  const router = useRouter();
  useEffect(() => {
    function onAdvance() {
      router.refresh();
    }
    window.addEventListener("vault:drop-advance", onAdvance);
    return () => window.removeEventListener("vault:drop-advance", onAdvance);
  }, [router]);

  const hasDrop = dropItems.length > 0;

  return (
    <Step
      title="Clear The Drop first"
      hint={
        hasDrop
          ? "For each Drop item, choose ATM or Counter, set minutes and box/area, then send it (or delete it)."
          : "The Drop is clear. Continue to choose what is already on your Counter."
      }
      submitLabel="ON TO THE COUNTER →"
      onSubmit={onNext}
      submitDisabled={hasDrop}
    >
      {hasDrop ? (
        <div className="space-y-2">
          {dropItems.map((item) => (
            <DropTriageRow
              key={item.id}
              item={item}
              boxes={boxes}
              energies={energies}
            />
          ))}
          <p className="pt-2 text-[12px] text-ink-mute">
            Finish triaging or deleting all Drop items to continue.
          </p>
        </div>
      ) : (
        <p className="rounded-sm border border-dashed border-vault-line/60 px-4 py-5 text-center text-ink-mute">
          No pending items in The Drop.
        </p>
      )}
    </Step>
  );
}

// Step 3: Counter review.
function ReviewStep({
  boxes,
  stressors,
  timeSensitive,
  mustDo,
  otherAdmin,
  onNext,
}: {
  boxes: Box[];
  stressors: Item[];
  timeSensitive: Item[];
  mustDo: Item[];
  otherAdmin: Item[];
  onNext: () => void;
}) {
  const total =
    stressors.length + timeSensitive.length + mustDo.length + otherAdmin.length;
  return (
    <Step
      title="What's already on the counter?"
      hint={
        total === 0
          ? "Nothing on the Counter yet — add items below, or continue with an empty plan."
          : "Edit titles and minutes as needed. Tap + TODAY on what you want scheduled; add more items anytime before you continue."
      }
      submitLabel="ON TO THE ATM →"
      onSubmit={onNext}
    >
      <div className="mb-4">
        <NewCounterItemRow boxes={boxes} />
      </div>
      <Group label="Stressors" tone="rust">
        {stressors.length === 0 ? <Empty /> : stressors.map((it) => <Row key={it.id} item={it} />)}
      </Group>
      <Group label="Time-sensitive" tone="amber">
        {timeSensitive.length === 0 ? <Empty /> : timeSensitive.map((it) => <Row key={it.id} item={it} />)}
      </Group>
      <Group label="Must-do" tone="sky">
        {mustDo.length === 0 ? <Empty /> : mustDo.map((it) => <Row key={it.id} item={it} />)}
      </Group>
      <Group label="Everything else" tone="brass">
        {otherAdmin.length === 0 ? <Empty /> : otherAdmin.map((it) => <Row key={it.id} item={it} />)}
      </Group>
    </Step>
  );
}

function Row({ item }: { item: Item }) {
  const onToday = (item.todayOrder ?? null) !== null;
  return (
    <div
      className={clsx(
        "flex items-center gap-3 rounded-sm border bg-vault-panel/40 px-3 py-2 transition",
        onToday ? "border-brass/40" : "border-vault-line/60",
      )}
    >
      {item.area && (
        <span className="shrink-0 rounded-sm border border-brass/40 px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-brass">
          {item.area}
        </span>
      )}
      <EditableText
        itemId={item.id}
        field="title"
        initial={item.title}
        className={clsx(
          "vault-task-title min-w-0 flex-1",
          onToday ? "text-ink" : "text-ink-mute",
        )}
        placeholder="(no title)"
      />
      <span className="flex shrink-0 items-baseline justify-end gap-1 whitespace-nowrap font-mono text-[11px] text-ink-mute tabular-nums">
        <EditableText
          itemId={item.id}
          field="minutes"
          initial={item.minutes}
          className="min-w-[3.25rem] w-16 max-w-[4.5rem] bg-transparent px-0 text-right text-[11px] tabular-nums"
          numeric
          placeholder="—"
        />
        <span>min</span>
      </span>
      <TodayToggle itemId={item.id} on={onToday} size="sm" />
    </div>
  );
}

function Group({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "rust" | "rust-soft" | "brass" | "sky" | "amber";
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <div className="flex items-center gap-2">
        <span
          className={clsx(
            "h-2 w-2",
            tone === "rust"
              ? "rounded-full bg-rust"
              : tone === "rust-soft"
                ? "rounded-full bg-rust/50"
                : tone === "amber"
                  ? "rounded-full bg-amber-500"
                  : tone === "sky"
                    ? "rounded-sm bg-sky-600"
                    : "rounded-sm bg-brass",
          )}
        />
        <h3 className="eyebrow">{label}</h3>
      </div>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

function Empty() {
  return <div className="text-[12px] italic text-ink-mute">(nothing here)</div>;
}

function roundHoursToMinutes(h: number): number {
  return Math.max(0, Math.round(h * 60));
}

function formatDurationFromMinutes(totalMin: number): string {
  if (totalMin <= 0) return "0 min";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m} min`;
}

function formatHoursProse(totalHours: number): string {
  return formatDurationFromMinutes(roundHoursToMinutes(totalHours));
}

function atmBoxLabel(category: string, boxes: Box[]): string {
  return boxes.find((b) => b.key === category)?.label ?? category;
}

// Step 4: ATM box-first withdrawals.
function AtmStep({
  atm,
  counterItems,
  inputs,
  boxes,
  onFinish,
}: {
  atm: Item[];
  counterItems: Item[];
  inputs: DayInputs;
  boxes: Box[];
  onFinish: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const categories = Array.from(
    new Set(
      atm
        .map((item) => item.category?.trim())
        .filter((category): category is string => Boolean(category)),
    ),
  );
  const dayBudgetHours = Math.max(0, inputs.hoursAvailable);
  const windowMinutes = roundHoursToMinutes(dayBudgetHours);
  const counterOnTodayItems = counterItems.filter(
    (i) => (i.todayOrder ?? null) !== null,
  );
  const counterOnTodayMinutes = counterOnTodayItems.reduce(
    (s, i) => s + (i.minutes ?? 0),
    0,
  );
  const counterOnTodayHours = counterOnTodayMinutes / 60;
  /** Time left for ATM after Counter items marked “on Today” in step 3. */
  const atmPoolHours = Math.max(0, dayBudgetHours - counterOnTodayHours);
  const counterExceedsWindow = counterOnTodayMinutes > windowMinutes;

  const [selected, setSelected] = useState<string[]>(() =>
    counterExceedsWindow ? [] : categories.slice(0, 1),
  );
  /** % of ATM pool to the first selected box when two are chosen (0–100). */
  const [splitPct, setSplitPct] = useState(50);
  /** % of ATM pool for the lone selected box (0–100). */
  const [singleUsePct, setSingleUsePct] = useState(100);

  function toggleCategory(category: string) {
    setSelected((prev) => {
      const exists = prev.includes(category);
      if (exists) return prev.filter((c) => c !== category);
      if (prev.length >= 2) return prev;
      const next = [...prev, category];
      if (next.length === 2) setSplitPct(50);
      return next;
    });
  }

  function hoursBudgetFor(category: string): number {
    if (selected.length === 0) return 0;
    if (selected.length === 1) {
      return selected[0] === category
        ? (atmPoolHours * singleUsePct) / 100
        : 0;
    }
    const [a, b] = selected;
    if (category === a) return (atmPoolHours * splitPct) / 100;
    if (category === b) return (atmPoolHours * (100 - splitPct)) / 100;
    return 0;
  }

  function estimateFill(category: string, hours: number) {
    const budget = Math.max(0, Math.round(hours * 60));
    const items = atm
      .filter((item) => item.category === category && (item.minutes ?? 0) > 0)
      .sort((a, b) => {
        const ao = a.atmOrder ?? Number.MAX_SAFE_INTEGER;
        const bo = b.atmOrder ?? Number.MAX_SAFE_INTEGER;
        return ao === bo ? a.createdAt.localeCompare(b.createdAt) : ao - bo;
      });
    let used = 0;
    let picked = 0;
    for (const it of items) {
      const m = it.minutes ?? 0;
      if (m <= 0) continue;
      if (used + m > budget) continue;
      used += m;
      picked += 1;
      if (used >= budget) break;
    }
    return { used, picked };
  }

  const totalAllocated = selected.reduce(
    (sum, c) => sum + hoursBudgetFor(c),
    0,
  );
  const leftoverHours = Math.max(
    0,
    dayBudgetHours - counterOnTodayHours - totalAllocated,
  );
  const atmSharePercent =
    atmPoolHours > 0 ? Math.round((totalAllocated / atmPoolHours) * 100) : 0;

  function submit() {
    const payload = selected.map((category) => ({
      category,
      hours: hoursBudgetFor(category),
    }));
    const withBudget = payload.filter((p) => p.hours > 0);
    startTransition(async () => {
      try {
        await applyAtmBoxBudgets(withBudget);
        onFinish();
      } catch (e: any) {
        toast.error(e?.message ?? "Couldn't apply ATM box budgets.");
      }
    });
  }

  return (
    <Step
      title="Pick 1-2 ATM boxes"
      submitLabel="BUILD THE DAY"
      onSubmit={submit}
      pending={pending}
    >
      {categories.length === 0 ? (
        <p className="rounded-sm border border-dashed border-vault-line/60 px-4 py-6 text-center text-ink-mute">
          No ATM boxes found yet.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                className={clsx(
                  "rounded-sm border px-3 py-2 text-[12px] transition",
                  selected.includes(category)
                    ? "border-brass bg-brass/10 text-brass-bright"
                    : "border-vault-line/60 text-ink-mute hover:border-brass/40 hover:text-brass",
                )}
              >
                {atmBoxLabel(category, boxes)}
              </button>
            ))}
          </div>

          {counterExceedsWindow && (
            <p className="rounded-sm border border-rust/40 bg-rust/5 px-3 py-2 text-[12px] text-ink-dim">
              Counter on Today is longer than your day window. ATM budget is 0
              until you take items off Today or move your end time (step 1). You
              can still build the day without picking ATM boxes.
            </p>
          )}

          {selected.length > 0 && (
            <div className="space-y-4">
              {selected.length === 1 && atmPoolHours > 0 && (
                <div className="rounded-sm border border-vault-line/60 bg-vault-panel/30 p-4">
                  <label className="block">
                    <span className="font-mono text-[10px] tracking-wider text-ink-mute">
                      How much of your ATM time goes to{" "}
                      <span className="text-ink">
                        {atmBoxLabel(selected[0], boxes)}
                      </span>
                      ?
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={singleUsePct}
                      onChange={(e) =>
                        setSingleUsePct(Number(e.target.value))
                      }
                      className="mt-3 w-full accent-brass"
                      aria-valuetext={`${singleUsePct}% of ATM pool`}
                    />
                    <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2 text-[13px] text-ink">
                      <span>
                        <span className="text-brass-bright">
                          {formatHoursProse(hoursBudgetFor(selected[0]))}
                        </span>{" "}
                        <span className="text-ink-dim">for ATM</span>
                      </span>
                      <span className="font-mono text-[11px] text-ink-mute">
                        {singleUsePct}% of {formatHoursProse(atmPoolHours)}
                      </span>
                    </div>
                  </label>
                </div>
              )}

              {selected.length === 2 && atmPoolHours > 0 && (
                <div className="rounded-sm border border-vault-line/60 bg-vault-panel/30 p-4">
                  <p className="font-mono text-[10px] tracking-wider text-ink-mute">
                    SPLIT YOUR {formatHoursProse(atmPoolHours)} ATM BUDGET
                  </p>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={splitPct}
                    onChange={(e) => setSplitPct(Number(e.target.value))}
                    className="mt-3 w-full accent-brass"
                    aria-valuetext={`${splitPct}% to ${atmBoxLabel(selected[0], boxes)}`}
                  />
                  <div className="mt-3 flex flex-wrap items-start justify-between gap-3 text-[13px]">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">
                        {atmBoxLabel(selected[0], boxes)}
                      </p>
                      <p className="mt-0.5 text-brass-bright">
                        {formatHoursProse(hoursBudgetFor(selected[0]))}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1 text-right">
                      <p className="truncate font-medium text-ink">
                        {atmBoxLabel(selected[1], boxes)}
                      </p>
                      <p className="mt-0.5 text-brass-bright">
                        {formatHoursProse(hoursBudgetFor(selected[1]))}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-ink-mute">
                    Slide toward a box to give it more of the total; the other
                    shrinks automatically.
                  </p>
                </div>
              )}

              {dayBudgetHours <= 0 && (
                <p className="rounded-sm border border-dashed border-rust/40 bg-rust/5 px-3 py-2 text-[12px] text-ink-dim">
                  No hours left in your day window (step 1). Adjust end time or
                  continue — you can still build, but ATM budgets will be 0
                  until that changes.
                </p>
              )}

              {dayBudgetHours > 0 && atmPoolHours <= 0 && !counterExceedsWindow && (
                <p className="rounded-sm border border-dashed border-vault-line/80 bg-vault-panel/30 px-3 py-2 text-[12px] text-ink-dim">
                  No time left for ATM: Counter on Today already fills your day
                  window. Take something off Today (step 3) or extend your end
                  time (step 1) to free ATM budget.
                </p>
              )}

              {selected.map((category) => {
                const hours = hoursBudgetFor(category);
                const { used, picked } = estimateFill(category, hours);
                return (
                  <div
                    key={category}
                    className="rounded-sm border border-vault-line/60 bg-vault-panel/40 p-3"
                  >
                    <p className="font-mono text-[11px] tracking-wider text-ink">
                      {atmBoxLabel(category, boxes)}
                    </p>
                    <p className="mt-2 text-[12px] text-ink-dim">
                      Likely fill (in list order, min &gt; 0):{" "}
                      <span className="text-ink">
                        {picked} task{picked === 1 ? "" : "s"} ·{" "}
                        {formatDurationFromMinutes(used)}
                      </span>
                    </p>
                  </div>
                );
              })}

              <div className="rounded-sm border border-vault-line/50 bg-vault-bg/30 px-3 py-2.5 text-[12px] text-ink-dim">
                <p>
                  <span className="text-ink">ATM pulls: </span>
                  {formatHoursProse(totalAllocated)}
                  {atmPoolHours > 0 ? (
                    <span className="text-ink-mute">
                      {" "}
                      ({atmSharePercent}% of ATM pool)
                    </span>
                  ) : null}
                </p>
                {leftoverHours > 0.0001 && (
                  <p className="mt-1">
                    <span className="text-ink">Unscheduled in your window: </span>
                    {formatHoursProse(leftoverHours)} (slack / overrun room)
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Step>
  );
}

// ─── Step shell ────────────────────────────────────────────────────────────
function Step({
  title,
  hint,
  children,
  onSubmit,
  submitLabel = "NEXT",
  pending = false,
  submitDisabled = false,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
  pending?: boolean;
  submitDisabled?: boolean;
}) {
  return (
    <div>
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        {title}
      </h1>
      {hint ? <p className="mt-2 text-ink-dim">{hint}</p> : null}
      <div className={hint ? "mt-10" : "mt-6"}>{children}</div>
      <div className="mt-12 flex justify-end">
        <button
          onClick={onSubmit}
          disabled={pending || submitDisabled}
          className="brass-button px-8 py-3 font-mono text-[10px] tracking-[0.24em] disabled:opacity-50"
        >
          {pending ? "SAVING…" : submitLabel}
        </button>
      </div>
    </div>
  );
}

