// Active plans — everything currently under construction or in planning,
// across the whole campus, grouped under those two headings. Each card shows
// its building so you know where it lives without leaving this page.
//
// The "Under construction" section absorbed the old standalone
// /project-plans/under-construction page (2026-09-13) — that page showed
// the exact same phase==="building" projects as this section, just without
// the Planning section and without this page's title exclusions, which let
// the two views quietly disagree. Its one real feature, drag-to-reorder
// (writes projects.active_order, which This Week's per-building project
// picker sorts by — see app/this-week/page.tsx), now lives here instead via
// ReorderableProjectCards. Planning stays a plain list since there's
// nothing to reorder there.

import Link from "next/link";
import { getBuildings } from "@/lib/categories";
import { getProjects, type Project } from "@/lib/projects";
import {
  ReorderableProjectCards,
  type ReorderableProjectCard,
} from "@/components/reorderable-project-cards";
import { fmtHoursFromMinutes } from "@/lib/format-hours";

export default async function ActiveProjectPlansPage() {
  const [buildings, projects] = await Promise.all([
    getBuildings(),
    getProjects(),
  ]);

  const buildingByKey = new Map(buildings.map((b) => [b.key, b]));
  const labelFor = (key: string) => buildingByKey.get(key)?.label ?? "Uncategorized";
  const colorFor = (key: string) => buildingByKey.get(key)?.color;
  const buildingOrder = new Map(buildings.map((b, i) => [b.key, i]));
  const orderFor = (key: string) =>
    buildingOrder.get(key) ?? Number.MAX_SAFE_INTEGER;

  // Always hidden from this view — not part of the campus's building projects.
  // Matched by prefix since these recur as numbered instances, e.g.
  // "Build Endurance Project #1", "Build Endurance Project #2", etc.
  const EXCLUDED_TITLE_PREFIXES = [
    "Build Muscle",
    "Build Endurance",
    "Sculpt Leaner Body",
  ];
  const isExcluded = (title: string) =>
    EXCLUDED_TITLE_PREFIXES.some((prefix) => title.startsWith(prefix));

  // Under construction: manual drag order (active_order) first, else newest
  // note first — same ordering the old standalone page used, since that
  // order is what This Week's project picker reads.
  const active = projects
    .filter((p) => p.phase === "building" && !isExcluded(p.title))
    .sort((a, b) => {
      if (a.activeOrder != null && b.activeOrder != null) {
        return a.activeOrder - b.activeOrder;
      }
      if (a.activeOrder != null) return -1;
      if (b.activeOrder != null) return 1;
      return (b.modifiedAt ?? "").localeCompare(a.modifiedAt ?? "");
    });

  // Planning has nothing to reorder, so it keeps the building-grouped sort.
  const planning = projects
    .filter((p) => p.phase === "planning" && !isExcluded(p.title))
    .sort((a, b) => {
      const buildingDiff = orderFor(a.building) - orderFor(b.building);
      if (buildingDiff !== 0) return buildingDiff;
      return (b.modifiedAt ?? "").localeCompare(a.modifiedAt ?? "");
    });

  const sumTaskMinutes = (tasks: Project["tasks"]) =>
    tasks.filter((t) => !t.done).reduce((sum, t) => sum + (t.minutes ?? 0), 0);

  const reorderableActive: ReorderableProjectCard[] = active.map((p) => ({
    id: p.id,
    title: p.title,
    buildingLabel: labelFor(p.building),
    buildingColor: colorFor(p.building),
    lastLogDate: p.log.at(-1)?.date ?? null,
    doneLooksLike: p.doneLooksLike,
    totalMinutes: sumTaskMinutes(p.tasks),
  }));

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-10">
      <Link
        href="/project-plans"
        className="font-mono text-[10px] tracking-[0.2em] text-ink-mute hover:text-brass"
      >
        ← MASTER PROJECT PLANS
      </Link>
      <h1 className="serif-h mt-3 text-[28px] leading-tight md:text-[36px]">
        Active plans.
      </h1>
      <p className="mt-1 text-[13px] text-ink-dim">
        Everything under construction or in planning, across the whole campus.
      </p>

      <SectionHeader
        label={`Under construction${active.length > 0 ? ` · ${active.length}` : ""}`}
        accent
      />
      {active.length === 0 ? (
        <p className="text-[13px] text-ink-mute">
          Nothing under construction — the campus is at rest.
        </p>
      ) : (
        <ReorderableProjectCards projects={reorderableActive} />
      )}

      <SectionHeader label={`Planning${planning.length > 0 ? ` · ${planning.length}` : ""}`} />
      {planning.length === 0 ? (
        <p className="text-[13px] text-ink-mute">Nothing on the drafting table.</p>
      ) : (
        <div className="mx-auto max-w-[900px] space-y-2">
          {planning.map((p) => (
            <ProjectCard key={p.id} project={p} buildingLabel={labelFor(p.building)} />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <div
      className={`mt-10 mb-3 font-mono text-[10px] uppercase tracking-[0.2em] ${accent ? "text-brass" : "text-ink-mute"}`}
    >
      {label}
    </div>
  );
}

function ProjectCard({
  project,
  buildingLabel,
}: {
  project: Project;
  buildingLabel: string;
}) {
  const lastLog = project.log.at(-1);
  const totalMinutes = project.tasks
    .filter((t) => !t.done)
    .reduce((sum, t) => sum + (t.minutes ?? 0), 0);
  return (
    <Link
      href={`/project-plans/project/${project.id}`}
      className="block rounded-sm border border-paper-line bg-paper-panel px-4 py-3 transition hover:border-brass/60"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="paper-task-title text-ink">{project.title}</span>
        <span className="font-mono text-[10px] text-ink-mute">
          {buildingLabel.toUpperCase()}
          {lastLog ? ` · last note ${lastLog.date}` : ""}
          {totalMinutes > 0
            ? ` · ${fmtHoursFromMinutes(totalMinutes)} hrs`
            : ""}
        </span>
      </div>
      {project.doneLooksLike ? (
        <div className="mt-1 text-[12px] text-ink-dim">
          Done looks like: {project.doneLooksLike}
        </div>
      ) : null}
    </Link>
  );
}
