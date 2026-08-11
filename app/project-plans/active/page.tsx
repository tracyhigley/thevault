// Active plans — everything currently under construction or in planning,
// across the whole campus, grouped under those two headings. Each card shows
// its building so you know where it lives without leaving this page.

import Link from "next/link";
import { getBuildings } from "@/lib/categories";
import { getProjects, type Project } from "@/lib/projects";

export default async function ActiveProjectPlansPage() {
  const [buildings, projects] = await Promise.all([
    getBuildings(),
    getProjects(),
  ]);

  const buildingByKey = new Map(buildings.map((b) => [b.key, b]));
  const labelFor = (key: string) => buildingByKey.get(key)?.label ?? "Uncategorized";
  const buildingOrder = new Map(buildings.map((b, i) => [b.key, i]));
  const orderFor = (key: string) =>
    buildingOrder.get(key) ?? Number.MAX_SAFE_INTEGER;

  // Always hidden from this view — not part of the campus's building projects.
  const EXCLUDED_TITLES = new Set([
    "Build Muscle",
    "Build Endurance",
    "Sculpt Leaner Body",
  ]);

  const byPhase = (phase: Project["phase"]) =>
    projects
      .filter((p) => p.phase === phase && !EXCLUDED_TITLES.has(p.title))
      .sort((a, b) => {
        const buildingDiff = orderFor(a.building) - orderFor(b.building);
        if (buildingDiff !== 0) return buildingDiff;
        return (b.modifiedAt ?? "").localeCompare(a.modifiedAt ?? "");
      });

  const active = byPhase("building");
  const planning = byPhase("planning");

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 md:px-10">
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
        <div className="space-y-2">
          {active.map((p) => (
            <ProjectCard key={p.id} project={p} buildingLabel={labelFor(p.building)} accent />
          ))}
        </div>
      )}

      <SectionHeader label={`Planning${planning.length > 0 ? ` · ${planning.length}` : ""}`} />
      {planning.length === 0 ? (
        <p className="text-[13px] text-ink-mute">Nothing on the drafting table.</p>
      ) : (
        <div className="space-y-2">
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
  accent,
}: {
  project: Project;
  buildingLabel: string;
  accent?: boolean;
}) {
  const lastLog = project.log.at(-1);
  return (
    <Link
      href={`/project-plans/project/${project.id}`}
      className={`block rounded-sm border bg-paper-panel px-4 py-3 transition hover:border-brass/60 ${
        accent ? "border-paper-line border-l-[3px] border-l-brass" : "border-paper-line"
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="paper-task-title text-ink">{project.title}</span>
        <span className="font-mono text-[10px] text-ink-mute">
          {buildingLabel.toUpperCase()}
          {lastLog ? ` · last note ${lastLog.date}` : ""}
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
