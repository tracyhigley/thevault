"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { toast } from "sonner";
import { formatEndOfDay12h, parseTimeOnDate } from "@/lib/daily-plan";
import { saveDayInputsPartial } from "@/lib/actions";
import { markPreferTodayOverDropLanding } from "@/lib/nav-client";
import { DropTriageRow } from "@/components/drop-triage-row";
import { EditableText } from "@/components/editable-text";
import { NewCounterItemRow } from "@/components/new-counter-item-row";
import { TodayToggle } from "./today-toggle";
import { ProjectTaskRollupItem } from "./project-task-rollup-item";
import type { DayInputs, Item } from "@/lib/types";
import type { Box, EnergyType } from "@/lib/categories";
import { useShortcut } from "@/lib/shortcuts";
import { Kbd } from "./kbd";

const STEPS = [
  { n: 1, title: "End Time" },
  { n: 2, title: "Field Notes" },
  { n: 3, title: "Admin Tasks" },
  { n: 4, title: "Project Tasks" },
  { n: 5, title: "Time Left" },
] as const;

export type ProjectTaskRow = {
  projectId: string;
  taskId: string;
  text: string;
  minutes: number | null;
  buildingLabel: string;
  buildingColor?: string;
  projectTitle: string;
  onToday: boolean;
};

export function BuildWizard({
  step,
  inputs,
  dropItems,
  counterItems,
  buildings,
  energies,
  stressors,
  timeSensitive,
  mustDo,
  otherAdmin,
  projectRows,
}: {
  step: number;
  inputs: DayInputs;
  dropItems: Item[];
  counterItems: Item[];
  buildings: Box[];
  energies: EnergyType[];
  stressors: Item[];
  timeSensitive: Item[];
  mustDo: Item[];
  otherAdmin: Item[];
  projectRows: ProjectTaskRow[];
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
      if (step === 3 || step === 4) next();
    },
    {
      label: "Continue",
      group: "Build day",
      options: { enabled: step === 3 || step === 4 },
    },
  );

  return (
    <div className="relative mx-auto flex min-h-[80vh] max-w-[1100px] flex-col px-4 py-12 md:px-10">
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
          <DropStep
            dropItems={dropItems}
            buildings={buildings}
            energies={energies}
            onNext={next}
          />
        )}
        {step === 3 && (
          <ReviewStep
            buildings={buildings}
            stressors={stressors}
            timeSensitive={timeSensitive}
            mustDo={mustDo}
            otherAdmin={otherAdmin}
            onNext={next}
          />
        )}
        {step === 4 && <ProjectTasksStep rows={projectRows} onNext={next} />}
        {step === 5 && (
          <TimeLeftStep
            inputs={inputs}
            counterItems={counterItems}
            onFinish={finish}
          />
        )}
      </div>

      <div className="text-ink-mute mt-8 flex items-center justify-between font-mono text-[10px] tracking-[0.18em]">
        <button
          onClick={prev}
          className="hover:text-brass flex items-center gap-2"
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
          SKIP &amp; OPEN
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
                : "bg-paper-line",
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
      hoursAvailable =
        Math.round(Math.max(0, Math.min(24, ms / 3_600_000)) * 100) / 100;
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
      hint="Set your end-of-day time first. Next, you will clear Field Notes before choosing Admin Tasks and Project Tasks items for today."
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
          className="border-paper-line bg-paper-panel/60 text-ink placeholder:text-ink-mute focus:border-brass mt-3 w-full rounded-sm border px-4 py-3 font-mono text-[18px] outline-none"
        />
      </div>
    </Step>
  );
}

function DropStep({
  dropItems,
  buildings,
  energies,
  onNext,
}: {
  dropItems: Item[];
  buildings: Box[];
  energies: EnergyType[];
  onNext: () => void;
}) {
  const router = useRouter();
  useEffect(() => {
    function onAdvance() {
      router.refresh();
    }
    window.addEventListener("field-notes:advance", onAdvance);
    return () => window.removeEventListener("field-notes:advance", onAdvance);
  }, [router]);

  const hasDrop = dropItems.length > 0;

  return (
    <Step
      title="Clear Field Notes first"
      hint={
        hasDrop
          ? "For each Field Notes item, choose Project Tasks or Admin Tasks, set minutes and building, then send it (or delete it)."
          : "Field Notes is clear. Continue to choose what is already on your Admin Tasks."
      }
      submitLabel="ON TO ADMIN TASKS →"
      onSubmit={onNext}
      submitDisabled={hasDrop}
    >
      {hasDrop ? (
        <div className="space-y-2">
          {dropItems.map((item) => (
            <DropTriageRow
              key={item.id}
              item={item}
              boxes={buildings}
              energies={energies}
            />
          ))}
          <p className="text-ink-mute pt-2 text-[12px]">
            Finish triaging or deleting all Field Notes items to continue.
          </p>
        </div>
      ) : (
        <p className="border-paper-line/60 text-ink-mute rounded-sm border border-dashed px-4 py-5 text-center">
          No pending items in Field Notes.
        </p>
      )}
    </Step>
  );
}

// Step 3: Admin Tasks review.
function ReviewStep({
  buildings,
  stressors,
  timeSensitive,
  mustDo,
  otherAdmin,
  onNext,
}: {
  buildings: Box[];
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
      title="What's already on Admin Tasks?"
      hint={
        total === 0
          ? "Nothing on Admin Tasks yet — add items below, or continue with an empty plan."
          : "Edit titles and minutes as needed. Tap + TODAY on what you want scheduled; add more items anytime before you continue."
      }
      submitLabel="ON TO PROJECT TASKS →"
      onSubmit={onNext}
    >
      <div className="mb-4">
        <NewCounterItemRow boxes={buildings} />
      </div>
      <Group label="Stressors" tone="rust">
        {stressors.length === 0 ? (
          <Empty />
        ) : (
          stressors.map((it) => <Row key={it.id} item={it} />)
        )}
      </Group>
      <Group label="Time-sensitive" tone="amber">
        {timeSensitive.length === 0 ? (
          <Empty />
        ) : (
          timeSensitive.map((it) => <Row key={it.id} item={it} />)
        )}
      </Group>
      <Group label="Must-do" tone="sky">
        {mustDo.length === 0 ? (
          <Empty />
        ) : (
          mustDo.map((it) => <Row key={it.id} item={it} />)
        )}
      </Group>
      <Group label="Everything else" tone="brass">
        {otherAdmin.length === 0 ? (
          <Empty />
        ) : (
          otherAdmin.map((it) => <Row key={it.id} item={it} />)
        )}
      </Group>
    </Step>
  );
}

function Row({ item }: { item: Item }) {
  const onToday = (item.todayOrder ?? null) !== null;
  return (
    <div
      className={clsx(
        "bg-paper-panel/40 flex items-center gap-3 rounded-sm border px-3 py-2 transition",
        onToday ? "border-brass/40" : "border-paper-line/60",
      )}
    >
      {item.area && (
        <span className="border-brass/40 text-brass shrink-0 rounded-sm border px-1.5 py-0.5 font-mono text-[9px] tracking-wider">
          {item.area}
        </span>
      )}
      <EditableText
        itemId={item.id}
        field="title"
        initial={item.title}
        className={clsx(
          "paper-task-title min-w-0 flex-1",
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
              ? "bg-rust rounded-full"
              : tone === "rust-soft"
                ? "bg-rust/50 rounded-full"
                : tone === "amber"
                  ? "rounded-full bg-amber-500"
                  : tone === "sky"
                    ? "rounded-sm bg-sky-600"
                    : "bg-brass rounded-sm",
          )}
        />
        <h3 className="eyebrow">{label}</h3>
      </div>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

function Empty() {
  return <div className="text-ink-mute text-[12px] italic">(nothing here)</div>;
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

// Step 4: pull tasks off Project Plans, same row + + TODAY toggle as the
// standalone Project Tasks page.
function ProjectTasksStep({
  rows,
  onNext,
}: {
  rows: ProjectTaskRow[];
  onNext: () => void;
}) {
  return (
    <Step
      title="Anything to pull from Project Plans?"
      hint={
        rows.length === 0
          ? "Nothing pulled onto Project Tasks yet — check off a task on a project that's under construction, or continue with none."
          : "Tap + TODAY on anything you want to work on today."
      }
      submitLabel="ON TO TIME LEFT →"
      onSubmit={onNext}
    >
      {rows.length === 0 ? (
        <p className="border-paper-line/60 text-ink-mute rounded-sm border border-dashed px-4 py-6 text-center">
          Nothing on Project Tasks right now.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <ProjectTaskRollupItem
              key={r.taskId}
              projectId={r.projectId}
              taskId={r.taskId}
              text={r.text}
              minutes={r.minutes}
              buildingLabel={r.buildingLabel}
              buildingColor={r.buildingColor}
              projectTitle={r.projectTitle}
              onToday={r.onToday}
            />
          ))}
        </div>
      )}
    </Step>
  );
}

// Step 5: no more slider — just the leftover time in the day window, with
// a way to go pull more from Project Plans or head straight to Today.
function TimeLeftStep({
  inputs,
  counterItems,
  onFinish,
}: {
  inputs: DayInputs;
  counterItems: Item[];
  onFinish: () => void;
}) {
  const windowMinutes = roundHoursToMinutes(Math.max(0, inputs.hoursAvailable));
  const onTodayMinutes = counterItems
    .filter((i) => (i.todayOrder ?? null) !== null)
    .reduce((s, i) => s + (i.minutes ?? 0), 0);
  const leftoverMinutes = windowMinutes - onTodayMinutes;

  return (
    <div>
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        {leftoverMinutes > 0
          ? "Time left in your day"
          : leftoverMinutes === 0
            ? "Your day is fully booked"
            : "You're over your day window"}
      </h1>
      <p className="text-ink-dim mt-2">
        {leftoverMinutes > 0
          ? `${formatDurationFromMinutes(leftoverMinutes)} still open after Admin Tasks and Project Tasks on Today.`
          : leftoverMinutes === 0
            ? "Admin Tasks and Project Tasks on Today exactly fill your day window."
            : `Admin Tasks and Project Tasks on Today run ${formatDurationFromMinutes(-leftoverMinutes)} past your day window.`}
      </p>

      <div className="border-paper-line/60 bg-paper-panel/40 mt-10 rounded-sm border p-6 text-center">
        <p className="text-ink-mute font-mono text-[10px] tracking-[0.2em]">
          ON TODAY SO FAR
        </p>
        <p className="serif-h text-ink mt-2 text-[32px]">
          {formatDurationFromMinutes(onTodayMinutes)}
        </p>
        <p className="text-ink-mute mt-1 text-[12px]">
          of {formatDurationFromMinutes(windowMinutes)} available
        </p>
      </div>

      <div className="mt-12 flex flex-wrap justify-end gap-3">
        <Link
          href="/project-plans"
          className="border-paper-line text-ink-mute hover:border-brass/40 hover:text-brass rounded-sm border px-6 py-3 text-center font-mono text-[10px] tracking-[0.2em] transition"
        >
          ADD MORE FROM PROJECT PLANS
        </Link>
        <button
          onClick={onFinish}
          className="brass-button px-8 py-3 font-mono text-[10px] tracking-[0.24em]"
        >
          GO TO TODAY →
        </button>
      </div>
    </div>
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
      {hint ? <p className="text-ink-dim mt-2">{hint}</p> : null}
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
