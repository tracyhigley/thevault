// Project Tasks — a flat rollup of whatever you've checked off as active on
// projects that are currently under construction. Deliberately styled like
// Admin Tasks (same row chrome, minutes, Today/Done/delete) since this is
// meant to feel like the same system, just filtered down to "what to
// actually pull from right now" — with each task's building shown as a
// small tag on the row itself instead of grouping tasks under it.

import Link from "next/link";
import { getBuildings } from "@/lib/categories";
import { getProjects } from "@/lib/projects";
import { getProjectTaskTodayLinks } from "@/lib/plan-actions";
import { ProjectTaskRollupItem } from "@/components/project-task-rollup-item";

type Row = {
  projectId: string;
  taskId: string;
  text: string;
  minutes: number | null;
  createdAt: string;
  buildingLabel: string;
  buildingColor?: string;
  projectTitle: string;
  onToday: boolean;
};

export default async function ProjectTasksPage() {
  const [buildings, projects, todayLinks] = await Promise.all([
    getBuildings(),
    getProjects(),
    getProjectTaskTodayLinks(),
  ]);

  const buildingByKey = new Map(buildings.map((b) => [b.key, b]));
  const active = projects.filter((p) => p.phase === "building");

  const rows: Row[] = [];
  for (const p of active) {
    const building = buildingByKey.get(p.building);
    for (const t of p.tasks) {
      if (!t.onTaskList) continue;
      rows.push({
        projectId: p.id,
        taskId: t.id,
        text: t.text,
        minutes: t.minutes,
        createdAt: t.createdAt,
        buildingLabel: building?.label ?? p.building,
        buildingColor: building?.color,
        projectTitle: p.title,
        onToday: todayLinks[t.id]?.onToday ?? false,
      });
    }
  }

  // One flat list, oldest-pulled first — no grouping by building.
  rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const buildingLabelsWithTasks = new Set(rows.map((r) => r.buildingLabel));
  const buildingCount = buildingLabelsWithTasks.size;
  const emptyBuildings = buildings.filter(
    (b) => !buildingLabelsWithTasks.has(b.label),
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-10">
      <div className="eyebrow">— Project Tasks —</div>
      <h1 className="serif-h mt-2 text-[28px] leading-tight md:text-[36px]">
        What you&apos;ve pulled off the drafting table.
      </h1>
      <p className="text-ink-dim mt-1 text-[13px]">Current Project Tasks</p>

      {rows.length === 0 ? (
        <div className="border-paper-line bg-paper-panel/40 mt-10 rounded-sm border border-dashed p-8 text-center">
          <p className="text-ink-dim">
            Nothing pulled onto the page right now.
          </p>
          <p className="text-ink-mute mt-2 text-[13px]">
            Open a project that&apos;s under construction and check off a task
            there to see it here.
          </p>
          <Link
            href="/project-plans"
            className="text-brass hover:text-brass-bright mt-3 inline-block font-mono text-[11px] tracking-[0.2em]"
          >
            GO TO PROJECT PLANS
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-2">
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

      {rows.length > 0 ? (
        <>
          <p className="text-ink-mute mt-6 text-[13px]">
            {rows.length} task{rows.length === 1 ? "" : "s"} pulled from{" "}
            {buildingCount} building
            {buildingCount === 1 ? "" : "s"}.
          </p>
          {emptyBuildings.length > 0 ? (
            <p className="text-ink-mute mt-1 text-[13px]">
              Nothing pulled from{" "}
              {emptyBuildings.map((b) => b.label).join(", ")}.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
