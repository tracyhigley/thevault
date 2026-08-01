// The Docket — today's timed schedule. App home.
//
// If today's day_inputs row hasn't been built yet, show a single calm
// "Build my day" entry. Once she's been through the wizard, show the schedule.

import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getItemsByBox, getDayInputs } from "@/lib/data";
import { CustomBlockForm } from "@/components/custom-block-form";
import { DocketSchedule } from "@/components/docket-schedule";
import { DocketDayRange } from "@/components/docket-day-range";
import { UnsealGlow } from "@/components/unseal-glow";
import type { DayInputs } from "@/lib/types";
import { SKIP_FIELD_NOTES_LANDING_COOKIE } from "@/lib/nav-cookies";
import { BuildPromptGreeting } from "@/components/build-prompt-greeting";
import { DayScratchpad } from "@/components/day-scratchpad";
import { todayYmd, zonedDayOfMonth } from "@/lib/day-timezone";

const DAY_GREETINGS = [
  "Today",
  "Today is going to be great!",
  "Have fun today",
];

export default async function DocketPage() {
  const date = todayYmd();
  const cookieStore = await cookies();
  const skipDropLanding =
    cookieStore.get(SKIP_FIELD_NOTES_LANDING_COOKIE)?.value === "1";

  const [counterItems, atmItems, dayRow, dropItems] = await Promise.all([
    getItemsByBox("COUNTER"),
    getItemsByBox("ATM"),
    getDayInputs(date),
    getItemsByBox("DROP"),
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
        </div>
        <DayScratchpad date={inputs.date} className="min-w-0 flex-1" />
      </div>

      <DocketSchedule
        counterItems={counterItems}
        atmItems={atmItems}
        inputs={inputs}
      >
        <CustomBlockForm date={inputs.date} />
      </DocketSchedule>
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
