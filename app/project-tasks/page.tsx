// Project Tasks — a rollup of whatever you've checked off as active on
// projects that are currently under construction, grouped by building.
// Deliberately mirrors the Project Plans look (color bar, serif heading)
// since this is meant to feel like the same system, just filtered down to
// "what to actually pull from right now."

import Link from "next/link";
import { getBuildings } from "@/lib/categories";
import { getProjects } from "@/lib/projects";
import { ProjectTaskRollupItem } from "@/components/project-task-rollup-item";

type Row = {
  projectId: string;
  projectTitle: string;
  taskId: string;
  text: string;
};

export default async function ProjectTasksPage() {
  const [buildings, projects] = await Promise.all([
    getBuildings(),
    getProjects(),
  ]);

  const active = projects.filter((p) => p.phase === "building");

  const byBuilding = new Map<string, Row[]>();
  for (const p of active) {
    const onList = p.tasks.filter((t) => t.onTaskList);
    if (onList.length === 0) continue;
    const rows = byBuilding.get(p.building) ?? [];
    for (const t of onList) {
      rows.push({
        projectId: p.id,
        projectTitle: p.title,
        taskId: t.id,
        text: t.text,
      });
    }
    byBuilding.set(p.building, rows);
  }

  const buildingsWithTasks = buildings.filter(
    (b) => (byBuilding.get(b.key)?.length ?? 0) > 0,
  );
  const totalTasks = [...byBuilding.values()].reduce(
    (sum, rows) => sum + rows.length,
    0,
  );

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-10">
      <div className="eyebrow">— Project Tasks —</div>
      <h1 className="serif-h mt-2 text-[28px] leading-tight md:text-[36px]">
        What you&apos;ve pulled off the drafting table.
      </h1>
      <p className="text-ink-dim mt-1 text-[13px]">Current Project Tasks</p>

      {buildingsWithTasks.length === 0 ? (
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
        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {buildingsWithTasks.map((b) => {
            const rows = byBuilding.get(b.key) ?? [];
            return (
              <div
                key={b.key}
                className="border-paper-line bg-paper-panel rounded-sm border px-4 py-4"
              >
                <div
                  className="h-1.5 w-6 rounded-full"
                  style={{ background: b.color ?? "#b5853a" }}
                />
                <div className="serif-h text-ink mt-3 text-[19px] leading-snug">
                  {b.label}
                </div>
                <div className="divide-paper-line/50 mt-3 divide-y">
                  {rows.map((r) => (
                    <ProjectTaskRollupItem
                      key={r.taskId}
                      projectId={r.projectId}
                      taskId={r.taskId}
                      text={r.text}
                      projectTitle={r.projectTitle}
                      projectHref={`/project-plans/project/${r.projectId}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalTasks > 0 ? (
        <p className="text-ink-mute mt-6 text-[13px]">
          {totalTasks} task{totalTasks === 1 ? "" : "s"} pulled from{" "}
          {buildingsWithTasks.length} building
          {buildingsWithTasks.length === 1 ? "" : "s"}.
        </p>
      ) : null}
    </div>
  );
}
