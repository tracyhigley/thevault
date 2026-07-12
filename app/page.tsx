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
import { VAULT_SKIP_DROP_LANDING_COOKIE } from "@/lib/vault-nav";
import { BuildPromptGreeting } from "@/components/build-prompt-greeting";
import { vaultTodayYmd, vaultZonedDayOfMonth } from "@/lib/vault-day";

const DAY_GREETINGS = ["Today", "Today is going to be great!", "Have fun today"];

export default async function DocketPage() {
  const date = vaultTodayYmd();
  const cookieStore = await cookies();
  const skipDropLanding =
    cookieStore.get(VAULT_SKIP_DROP_LANDING_COOKIE)?.value === "1";

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

  const greeting =
    DAY_GREETINGS[vaultZonedDayOfMonth() % DAY_GREETINGS.length];

  return (
    <div className="mx-auto max-w-[820px] px-4 py-6 md:px-10 md:py-10">
      <UnsealGlow />
      <div className="flex items-baseline justify-between">
        <div>
          <div className="serif-h text-[28px] text-ink md:text-[32px]">
            {greeting}
          </div>
          <DocketDayRange
            date={inputs.date}
            hoursAvailable={inputs.hoursAvailable}
            endOfDay={inputs.endOfDay}
          />
        </div>
        <Link
          href="/build?step=1"
          title="Press g b"
          className="font-mono text-[10px] tracking-[0.18em] text-ink-mute hover:text-brass"
        >
          ↻ REBUILD DAY
        </Link>
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
      <div className="absolute inset-0 -z-0 lamp-glow opacity-50" />
      <div className="relative">
        <BuildPromptGreeting />
        <h1 className="serif-h mt-3 text-[36px] leading-tight text-ink md:text-[48px]">
          Let&rsquo;s build today.
        </h1>
        <p className="mt-3 max-w-[480px] text-ink-dim">
          Answer your questions to begin building your day.
        </p>
        <Link
          href="/build?step=1"
          className="brass-button mt-10 inline-block px-8 py-3 font-mono text-[10px] tracking-[0.24em]"
        >
          BUILD TODAY
        </Link>
        <p className="mt-4 font-mono text-[10px] tracking-[0.18em] text-ink-mute">
          Or{" "}
          <Link href="/boxes" className="hover:text-brass">
            open the boxes
          </Link>{" "}
          to browse without building.
        </p>
      </div>
    </div>
  );
}

