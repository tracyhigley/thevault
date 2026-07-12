// Wizard: build today — set end time, clear Field Notes, review Admin Tasks, pick Project Tasks.

import { redirect } from "next/navigation";
import { getDayInputs, getItemsByBox, getSettings } from "@/lib/data";
import { defaultDayInputs } from "@/lib/data";
import { classify } from "@/lib/daily-plan";
import { getBoxes, getEnergies } from "@/lib/categories";
import { BuildWizard } from "@/components/build-wizard";
import type { DayInputs } from "@/lib/types";
import { vaultTodayYmd } from "@/lib/vault-day";

export default async function BuildDayPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step: stepParam } = await searchParams;
  const date = vaultTodayYmd();
  let s = Number(stepParam ?? 1);
  if (!Number.isFinite(s) || s < 1) s = 1;
  const step = Math.max(1, Math.min(4, s));

  const [dayRow, dropItems, counterItems, atmItems, boxes, energies, settings] =
    await Promise.all([
    getDayInputs(date),
    getItemsByBox("DROP"),
    getItemsByBox("COUNTER"),
    getItemsByBox("ATM"),
    getBoxes(),
    getEnergies(),
    getSettings(),
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

  if (step > 4) redirect("/");

  return (
    <BuildWizard
      step={step}
      inputs={inputs}
      dropItems={dropItems}
      counterItems={counterItems}
      atmItems={atmItems}
      boxes={boxes}
      energies={energies}
      stressors={classified.stressors}
      timeSensitive={classified.timeSensitive}
      mustDo={classified.mustDo}
      otherAdmin={classified.otherAdmin}
    />
  );
}
