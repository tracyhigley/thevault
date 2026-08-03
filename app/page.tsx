// The Docket — today's tasks, grouped into three cards (The Gymnasium,
// Maint Tasks, Project Tasks). App home.
//
// If today's day_inputs row hasn't been built yet, show a single calm
// "Build my day" entry. Once she's been through the wizard, show the cards.
//
// No more timed schedule — tasks used to be laid out as blocks against a
// start/end clock. Now each card is just "what's marked Today from this
// source," in whatever order she's dragged it to.

import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getItemsByBox, getDayInputs } from "@/lib/data";
import { getBuildings } from "@/lib/categories";
import { getProjects } from "@/lib/projects";
import { CustomBlockForm } from "@/components/custom-block-form";
import { DocketDayRange } from "@/components/docket-day-range";
import { UnsealGlow } from "@/components/unseal-glow";
import { SortableList, type SortableItem } from "@/components/sortable-list";
import { TodayDoneToggle } from "@/components/today-done-toggle";
import { AreaPill } from "@/components/area-pill";
import { BuildingTag } from "@/components/building-tag";
import { EditableText } from "@/components/editable-text";
import { EditableProjectTaskMinutes } from "@/components/editable-project-task-minutes";
import type { DayInputs } from "@/lib/types";
import { fmtHoursFromMinutes, fmtHoursNumber } from "@/lib/format-hours";
import { SKIP_FIELD_NOTES_LANDING_COOKIE } from "@/lib/nav-cookies";
import { BuildPromptGreeting } from "@/components/build-prompt-greeting";
import { DayScratchpad } from "@/components/day-scratchpad";
import { todayYmd, zonedDayOfMonth } from "@/lib/day-timezone";

const DAY_GREETINGS = [
  "Today",
  "Today is going to be great!",
  "Have fun today",
];

type TodayRow = {
  itemId: string;
  title: string;
  minutes: number | null;
  area?: string | null; // raw building key — Maint Tasks rows only
  buildingLabel?: string;
  buildingColor?: string;
  projectId?: string; // set for Project Tasks rows
  taskId?: string; // set for Project Tasks rows (== item.sourceTaskId)
};

export default async function DocketPage() {
  const date = todayYmd();
  const cookieStore = await cookies();
  const skipDropLanding =
    cookieStore.get(SKIP_FIELD_NOTES_LANDING_COOKIE)?.value === "1";

  const [counterItems, dayRow, dropItems, buildings, projects] =
    await Promise.all([
      getItemsByBox("COUNTER"),
      getDayInputs(date),
      getItemsByBox("DROP"),
      getBuildings(),
      getProjects(),
    ]);

  // Anything in Field Notes → open there first (fresh session / login). Once you’ve
  // built today, respect “take me to Today” via cookie from nav / wizard exit.
  if (dropItems.length > 0 && (!dayRow || !skipDropLanding)) {
    redirect("/field-notes");
  }

  // No day built yet → calm entry.
  if (!dayRow) {
    return <BuildPrompt />;
  }

  const inputs: DayInputs = {
    date,
    hoursAvailable: Number(dayRow.hours_available),
    creative: dayRow.creative as DayInputs["creative"],
    probSolv: dayRow.prob_solv as DayInputs["probSolv"],
    tieBreak: dayRow.tie_break as DayInputs["tieBreak"],
    endOfDay: dayRow.end_of_day,
  };

  const greeting = DAY_GREETINGS[zonedDayOfMonth() % DAY_GREETINGS.length];

  const buildingByKey = new Map(buildings.map((b) => [b.key, b]));
  const gymBuilding = buildings.find((b) => b.key === "THE_GYMNASIUM");

  const projectByTaskId = new Map<string, { id: string; building: string }>();
  for (const p of projects) {
    for (const t of p.tasks) {
      projectByTaskId.set(t.id, { id: p.id, building: p.building });
    }
  }

  // Everything currently on today's plan, still open (not done/skipped).
  const todayItems = counterItems.filter(
    (it) =>
      (it.todayOrder ?? null) !== null &&
      it.state !== "done" &&
      it.state !== "skipped",
  );

  const gymRows: TodayRow[] = [];
  const maintRows: TodayRow[] = [];
  const projectRows: TodayRow[] = [];

  for (const it of todayItems) {
    if (it.sourceTaskId) {
      // Project Task pulled onto Today — building lives on the project.
      const proj = projectByTaskId.get(it.sourceTaskId);
      const building = proj ? buildingByKey.get(proj.building) : undefined;
      const row: TodayRow = {
        itemId: it.id,
        title: it.title,
        minutes: it.minutes ?? null,
        buildingLabel: building?.label ?? proj?.building,
        buildingColor: building?.color,
        projectId: proj?.id,
        taskId: it.sourceTaskId,
      };
      if (gymBuilding && proj?.building === gymBuilding.key) {
        gymRows.push(row);
      } else {
        projectRows.push(row);
      }
    } else {
      // Maint task (incl. custom quick-adds) — building lives on the item.
      const building = it.area ? buildingByKey.get(it.area) : undefined;
      const row: TodayRow = {
        itemId: it.id,
        title: it.title,
        minutes: it.minutes ?? null,
        area: it.area ?? null,
        buildingLabel: building?.label ?? it.area ?? undefined,
        buildingColor: building?.color,
      };
      if (gymBuilding && it.area === gymBuilding.key) {
        gymRows.push(row);
      } else {
        maintRows.push(row);
      }
    }
  }

  const buildingOpts = buildings.map((b) => ({ key: b.key, label: b.label }));

  const totalTodayMinutes = todayItems.reduce(
    (sum, it) => sum + (it.minutes ?? 0),
    0,
  );

  return (
    <div className="mx-auto max-w-[820px] px-4 py-6 md:px-10 md:py-10">
      <UnsealGlow />
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <div className="serif-h text-ink text-[28px] md:text-[32px]">
            {greeting}
          </div>
          <DocketDayRange
            date={inputs.date}
            hoursAvailable={inputs.hoursAvailable}
            endOfDay={inputs.endOfDay}
          />
          <Link
            href="/build?step=1"
            title="Press g b"
            className="text-ink-mute hover:text-brass mt-2 block font-mono text-[10px] tracking-[0.18em]"
          >
            ↻ REBUILD DAY
          </Link>
          <p className="text-ink-dim mt-2 text-[13px]">
            {fmtHoursFromMinutes(totalTodayMinutes)} hours out of{" "}
            {fmtHoursNumber(inputs.hoursAvailable)} available hours.
          </p>
        </div>
        <DayScratchpad date={inputs.date} className="min-w-0 flex-1" />
      </div>

      <div className="mt-8 space-y-6">
        <TodayCard
          title="The Gymnasium"
          color={gymBuilding?.color}
          rows={gymRows}
          buildingMode="none"
          buildingOpts={buildingOpts}
          emptyLabel="Nothing marked Today for The Gymnasium."
        />
        <TodayCard
          title="Maint Tasks"
          rows={maintRows}
          buildingMode="editable"
          buildingOpts={buildingOpts}
          emptyLabel="Nothing marked Today from Maint Tasks."
          footer={
            <div className="mt-3">
              <CustomBlockForm />
            </div>
          }
        />
        <TodayCard
          title="Project Tasks"
          rows={projectRows}
          buildingMode="tag"
          buildingOpts={buildingOpts}
          emptyLabel="Nothing marked Today from Project Tasks."
        />
      </div>
    </div>
  );
}

function sumMinutes(rows: TodayRow[]): number {
  return rows.reduce((sum, r) => sum + (r.minutes ?? 0), 0);
}

function TodayCard({
  title,
  color,
  rows,
  buildingMode,
  buildingOpts,
  emptyLabel,
  footer,
}: {
  title: string;
  color?: string;
  rows: TodayRow[];
  buildingMode: "editable" | "tag" | "none";
  buildingOpts: { key: string; label: string }[];
  emptyLabel: string;
  footer?: React.ReactNode;
}) {
  const items: SortableItem[] = rows.map((row) => ({
    id: row.itemId,
    content: (
      <TodayRowContent
        row={row}
        buildingMode={buildingMode}
        buildingOpts={buildingOpts}
      />
    ),
  }));

  return (
    <div className="border-paper-line/60 bg-paper-panel/20 rounded-sm border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {color && (
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: color }}
              aria-hidden
            />
          )}
          <h2 className="serif-h text-ink text-[18px]">{title}</h2>
        </div>
        <span className="text-ink-mute shrink-0 font-mono text-[11px] tracking-wider tabular-nums">
          {fmtHoursFromMinutes(sumMinutes(rows))}h
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-ink-mute text-[13px]">{emptyLabel}</p>
      ) : (
        <SortableList items={items} />
      )}
      {footer}
    </div>
  );
}

const ROW_AREA_PILL_CLASS =
  "!max-h-7 max-w-[9.25rem] shrink-0 !py-0.5 !pl-1.5 !pr-1 !text-[9px] !leading-tight border-brass/40 bg-paper-bg/20";

function TodayRowContent({
  row,
  buildingMode,
  buildingOpts,
}: {
  row: TodayRow;
  buildingMode: "editable" | "tag" | "none";
  buildingOpts: { key: string; label: string }[];
}) {
  return (
    <div className="bg-paper-panel/40 flex min-w-0 items-center gap-3 rounded-sm border border-paper-line/60 px-3 py-2">
      <TodayDoneToggle itemId={row.itemId} />
      {buildingMode === "editable" && (
        <AreaPill
          itemId={row.itemId}
          initial={row.area}
          options={buildingOpts}
          className={ROW_AREA_PILL_CLASS}
        />
      )}
      {buildingMode === "tag" && row.buildingLabel && (
        <BuildingTag label={row.buildingLabel} color={row.buildingColor} />
      )}
      <EditableText
        itemId={row.itemId}
        field="title"
        initial={row.title}
        className="paper-task-title min-w-0 flex-1 truncate"
        placeholder="(no title)"
      />
      <span className="text-ink-mute flex shrink-0 items-baseline justify-end gap-1 font-mono text-[11px] whitespace-nowrap tabular-nums">
        {row.projectId && row.taskId ? (
          <EditableProjectTaskMinutes
            projectId={row.projectId}
            taskId={row.taskId}
            initial={row.minutes}
          />
        ) : (
          <EditableText
            itemId={row.itemId}
            field="minutes"
            initial={row.minutes}
            numeric
            className="w-16 max-w-[4.5rem] min-w-[3.25rem] bg-transparent px-0 text-right text-[11px] tabular-nums"
            placeholder="—"
          />
        )}
        <span>min</span>
      </span>
    </div>
  );
}

function BuildPrompt() {
  return (
    <div className="relative mx-auto flex min-h-[80vh] max-w-[640px] flex-col items-start justify-center px-4 md:px-10">
      <div className="lamp-glow absolute inset-0 -z-0 opacity-50" />
      <div className="relative">
        <BuildPromptGreeting />
        <h1 className="serif-h text-ink mt-3 text-[36px] leading-tight md:text-[48px]">
          Let&rsquo;s build today.
        </h1>
        <p className="text-ink-dim mt-3 max-w-[480px]">
          Answer your questions to begin building your day.
        </p>
        <Link
          href="/build?step=1"
          className="brass-button mt-10 inline-block px-8 py-3 font-mono text-[10px] tracking-[0.24em]"
        >
          BUILD TODAY
        </Link>
      </div>
    </div>
  );
}
