// Project Tasks — a rollup of whatever you've checked off as active on
// projects that are currently under construction. Deliberately styled like
// Admin Tasks (same row chrome, minutes, Today/Done/delete) since this is
// meant to feel like the same system, just filtered down to "what to
// actually pull from right now." Tasks are grouped under one card per
// project (so a project with several tasks pulled shows one title header,
// not a repeated one per row). Any project that's under construction but
// has nothing checked off gets flagged at the bottom, so it doesn't quietly
// fall off the radar.

import Link from "next/link";
import { getBuildings } from "@/lib/categories";
import { getProjects } from "@/lib/projects";
import { getProjectTaskTodayLinks } from "@/lib/plan-actions";
import { ReorderableProjectTaskGroups } from "@/components/reorderable-project-task-groups";

type GroupTask = {
  taskId: string;
  text: string;
  minutes: number | null;
  createdAt: string;
  onToday: boolean;
};

type Group = {
  projectId: string;
  projectTitle: string;
  buildingLabel: string;
  buildingColor?: string;
  tasks: GroupTask[];
  earliestCreatedAt: string;
  taskGroupOrder: number | null;
};

export default async function ProjectTasksPage() {
  const [buildings, projects, todayLinks] = await Promise.all([
    getBuildings(),
    getProjects(),
    getProjectTaskTodayLinks(),
  ]);

  const buildingByKey = new Map(buildings.map((b) => [b.key, b]));
  const active = projects.filter((p) => p.phase === "building");

  const groups: Group[] = [];
  for (const p of active) {
    const pulled = p.tasks.filter((t) => t.onTaskList);
    if (pulled.length === 0) continue;
    const building = buildingByKey.get(p.building);
    const tasks: GroupTask[] = pulled
      .map((t) => ({
        taskId: t.id,
        text: t.text,
        minutes: t.minutes,
        createdAt: t.createdAt,
        onToday: todayLinks[t.id]?.onToday ?? false,
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    groups.push({
      projectId: p.id,
      projectTitle: p.title,
      buildingLabel: building?.label ?? p.building,
      buildingColor: building?.color,
      tasks,
      earliestCreatedAt: tasks[0].createdAt,
      taskGroupOrder: p.taskGroupOrder,
    });
  }

  // Drag order wins once set; otherwise oldest-pulled project first — same
  // feel as the old flat, oldest-first sort, just applied at the group level.
  groups.sort((a, b) => {
    if (a.taskGroupOrder != null && b.taskGroupOrder != null) {
      return a.taskGroupOrder - b.taskGroupOrder;
    }
    if (a.taskGroupOrder != null) return -1;
    if (b.taskGroupOrder != null) return 1;
    return a.earliestCreatedAt.localeCompare(b.earliestCreatedAt);
  });

  const totalTasks = groups.reduce((n, g) => n + g.tasks.length, 0);
  const buildingLabelsWithTasks = new Set(groups.map((g) => g.buildingLabel));
  const buildingCount = buildingLabelsWithTasks.size;
  const emptyBuildings = buildings.filter(
    (b) => !buildingLabelsWithTasks.has(b.label),
  );

  // Under-construction projects with nothing pulled onto this page — the
  // gap this page exists to catch.
  const unflaggedProjects = active.filter(
    (p) => !p.tasks.some((t) => t.onTaskList),
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-10">
      <div className="eyebrow">— Project Tasks —</div>
      <h1 className="serif-h mt-2 text-[28px] leading-tight md:text-[36px]">
        What you&apos;ve pulled off the drafting table.
      </h1>
      <p className="text-ink-dim mt-1 text-[13px]">Current Project Tasks</p>

      {groups.length === 0 ? (
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
        <div className="mt-8">
          <ReorderableProjectTaskGroups
            groups={groups.map((g) => ({
              projectId: g.projectId,
              projectTitle: g.projectTitle,
              buildingLabel: g.buildingLabel,
              buildingColor: g.buildingColor,
              tasks: g.tasks.map((t) => ({
                taskId: t.taskId,
                text: t.text,
                minutes: t.minutes,
                onToday: t.onToday,
              })),
            }))}
          />
        </div>
      )}

      {groups.length > 0 ? (
        <>
          <p className="text-ink-mute mt-6 text-[13px]">
            {totalTasks} task{totalTasks === 1 ? "" : "s"} pulled from{" "}
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

      {unflaggedProjects.length > 0 ? (
        <div className="border-rust bg-rust/10 mt-10 rounded-sm border-2 px-4 py-3">
          <div className="text-rust font-mono text-[10px] tracking-[0.2em] uppercase">
            ⚠ Under construction, nothing pulled here
          </div>
          <p className="text-ink mt-1 text-[13px]">
            {unflaggedProjects.length === 1
              ? "This project is under construction but has no tasks checked off onto this page:"
              : "These projects are under construction but have no tasks checked off onto this page:"}
          </p>
          <ul className="mt-2 space-y-1">
            {unflaggedProjects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/project-plans/project/${p.id}`}
                  className="text-rust hover:text-brass paper-task-title underline underline-offset-2"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
