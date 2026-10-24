// Wizard: build today — set end time, clear Field Notes, review Maint Tasks,
// then see what's left in the day. (Project tasks are no longer pulled here:
// checking a task on its Project Plan puts it on Today directly.)

import { redirect } from "next/navigation";
import { getDayInputs, getItemsByBox, getSettings } from "@/lib/data";
import { defaultDayInputs } from "@/lib/data";
import { getBuildings } from "@/lib/categories";
import { getProjects } from "@/lib/projects";
import {
  underConstructionGroups,
  underConstructionMinutes,
} from "@/lib/under-construction";
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
  const step = Math.max(1, Math.min(4, s));

  const [
    dayRow,
    dropItems,
    counterItems,
    buildings,
    settings,
    projects,
  ] = await Promise.all([
    getDayInputs(date),
    getItemsByBox("DROP"),
    getItemsByBox("COUNTER"),
    getBuildings(),
    getSettings(),
    getProjects(),
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
  // ones already on today's plan — but it's the "Maint Tasks" step, so it
  // mirrors the same exclusions as the standalone Maint Tasks page: items
  // linked to a Project Task pulled onto Today (see addProjectTaskToToday),
  // custom blocks added from the Docket, and items already finished via
  // completeTodayItem (state "done" — finished, not re-offered
  // here every time the wizard runs). `counterItems` itself stays
  // unfiltered for the Time Left step, which needs every Today item
  // regardless of source.
  const maintReviewItems = counterItems.filter(
    (it) =>
      !it.sourceTaskId && it.tag !== "CUSTOM_BLOCK" && it.state !== "done",
  );

  // Checked Project Plan tasks shown on Today (same set the Today page's
  // Currently Under Construction card shows) — counted in Time Left.
  const projectMinutes = underConstructionMinutes(
    underConstructionGroups(projects, date),
  );

  if (step > 4) redirect("/");

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
      maintItems={maintReviewItems}
      projectMinutes={projectMinutes}
    />
  );
}
