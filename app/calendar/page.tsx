// Calendar planning surface — block out which project each week is for,
// with the ability to override individual days. Pure planning data; doesn't
// affect Today's schedule.

import { getBoxes } from "@/lib/categories";
import { getCalendarRange } from "@/lib/calendar-planning";
import { CalendarBoard } from "@/components/calendar-board";

export default async function CalendarPage() {
  const [boxes, weeks] = await Promise.all([
    getBoxes(),
    getCalendarRange({ weeksBefore: 13, weeksAfter: 16 }),
  ]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-10">
      <div className="eyebrow">— Calendar —</div>
      <h1 className="serif-h mt-2 text-[32px] leading-tight md:text-[40px]">
        Block out the weeks ahead.
      </h1>
      <p className="mt-2 text-ink-dim">
        Set a project for the whole week — every day inherits. Tap a single
        day to override it just for that day.
      </p>

      <CalendarBoard initialWeeks={weeks} boxes={boxes} />
    </div>
  );
}
