// Calendar planning surface — plan each day: pick a building, optionally a
// project inside it, or type your own text for the day. Pure planning data;
// doesn't affect Today's schedule.

import { getBuildings } from "@/lib/categories";
import { getCalendarRange } from "@/lib/calendar-planning";
import { getProjects } from "@/lib/projects";
import { CalendarBoard } from "@/components/calendar-board";

export default async function CalendarPage() {
  const [boxes, weeks, allProjects] = await Promise.all([
    getBuildings(),
    getCalendarRange({ weeksBefore: 13, weeksAfter: 16 }),
    getProjects(),
  ]);
  const projects = allProjects.map((p) => ({
    id: p.id,
    title: p.title,
    building: p.building,
    phase: p.phase,
  }));

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-10">
      <div className="eyebrow">— Calendar —</div>
      <h1 className="serif-h mt-2 text-[32px] leading-tight md:text-[40px]">
        Plan the days ahead.
      </h1>
      <p className="text-ink-dim mt-2">
        Pick a building for each day, then optionally a project inside it, and
        add any text you like for that day — an appointment, a reminder.
      </p>

      <CalendarBoard initialWeeks={weeks} boxes={boxes} projects={projects} />
    </div>
  );
}
