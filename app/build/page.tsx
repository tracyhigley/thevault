// Wizard: build today — set end time, clear Field Notes, review Admin Tasks,
// pull Project Tasks, then see what's left in the day.

import { redirect } from "next/navigation";
import { getDayInputs, getItemsByBox, getSettings } from "@/lib/data";
import { defaultDayInputs } from "@/lib/data";
import { classify } from "@/lib/daily-plan";
import { getBuildings, getEnergies } from "@/lib/categories";
import { getProjects } from "@/lib/projects";
import { getProjectTaskTodayLinks } from "@/lib/plan-actions";
import { BuildWizard } from "@/components/build-wizard";
import type { DayInputs } from "@/lib/types";
import { todayYmd } from "@/lib/day-timezone";

export default async function BuildDayPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step: stepParam } = await searchParams;
  const date = todayYmd();
  let s = Number(stepParam ?? 1);
  if (!Number.isFinite(s) || s < 1) s = 1;
  const step = Math.max(1, Math.min(5, s));

  const [
    dayRow,
    dropItems,
    counterItems,
    buildings,
    energies,
    settings,
    projects,
    todayLinks,
  ] = await Promise.all([
    getDayInputs(date),
    getItemsByBox("DROP"),
    getItemsByBox("COUNTER"),
    getBuildings(),
    getEnergies(),
    getSettings(),
    getProjects(),
    getProjectTaskTodayLinks(),
  ]);

  const dayRaw = dayRow ?? {
    ...defaultDayInputs(date),
    hours_available: settings?.default_hours ?? 7,
    end_of_day: settings?.default_end_of_day ?? "16:30",
  };
  const inputs: DayInputs = {
    date,
    hoursAvailable: Number(dayRaw.hours_available),
    creative: dayRaw.creative as DayInputs["creative"],
    probSolv: dayRaw.prob_solv as DayInputs["probSolv"],
    tieBreak: dayRaw.tie_break as DayInputs["tieBreak"],
    endOfDay: dayRaw.end_of_day,
  };

  // Wizard review wants every counter item (for opt-in), not just the
  // ones already on today's plan.
  const classified = classify(counterItems, /* todayOnly */ false);

  // Flatten Project Plans' onTaskList tasks the same way the standalone
  // Project Tasks page does: one list, building tag per row, sorted
  // oldest-pulled-first.
  const buildingByKey = new Map(buildings.map((b) => [b.key, b]));
  const active = projects.filter((p) => p.phase === "building");
  const projectRows = active
    .flatMap((p) =>
      p.tasks
        .filter((t) => t.onTaskList)
        .map((t) => {
          const building = buildingByKey.get(p.building);
          return {
            projectId: p.id,
            taskId: t.id,
            text: t.text,
            minutes: t.minutes,
            createdAt: t.createdAt,
            buildingLabel: building?.label ?? p.building,
            buildingColor: building?.color,
            projectTitle: p.title,
            onToday: todayLinks[t.id]?.onToday ?? false,
          };
        }),
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  if (step > 5) redirect("/");

  // Nothing to triage — skip the dead Field Notes step in both directions
  // (arriving fresh, or having just cleared the last item mid-step).
  if (step === 2 && dropItems.length === 0) redirect("/build?step=3");

  return (
    <BuildWizard
      step={step}
      inputs={inputs}
      dropItems={dropItems}
      counterItems={counterItems}
      buildings={buildings}
      energies={energies}
      stressors={classified.stressors}
      timeSensitive={classified.timeSensitive}
      mustDo={classified.mustDo}
      otherAdmin={classified.otherAdmin}
      projectRows={projectRows}
    />
  );
}
