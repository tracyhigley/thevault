// Inside one building — its projects grouped by phase. Ideas render as
// compact pills (one line of attention each); active work gets full cards.

import Link from "next/link";
import { notFound } from "next/navigation";
import { getBuildings, buildingSlug } from "@/lib/categories";
import { getProjectsByBuilding, type Project } from "@/lib/projects";
import { NewProjectRow } from "@/components/new-project-row";

export default async function BuildingPage({
  params,
}: {
  params: Promise<{ building: string }>;
}) {
  const { building: slug } = await params;
  const buildings = await getBuildings();
  const building = buildings.find((b) => buildingSlug(b.key) === slug);
  if (!building) notFound();

  const projects = await getProjectsByBuilding(building.key);
  const byPhase = (phase: Project["phase"]) =>
    projects.filter((p) => p.phase === phase);

  const active = byPhase("building");
  const planning = byPhase("planning");
  const ideas = byPhase("idea");
  const complete = byPhase("complete");

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 md:px-10">
      <Link
        href="/plan"
        className="font-mono text-[10px] tracking-[0.2em] text-ink-mute hover:text-brass"
      >
        ← MASTER PLAN
      </Link>
      <h1 className="serif-h mt-3 text-[28px] leading-tight md:text-[36px]">
        {building.label}
      </h1>
      {building.meta ? (
        <p className="mt-1 text-[13px] italic text-ink-dim">{building.meta}</p>
      ) : null}

      <SectionHeader
        label={`Under construction${active.length > 0 ? ` · ${active.length}` : ""}`}
        accent
      />
      {active.length === 0 ? (
        <p className="text-[13px] text-ink-mute">
          Nothing under construction here right now.
        </p>
      ) : (
        <div className="space-y-2">
          {active.map((p) => (
            <ProjectCard key={p.id} project={p} accent />
          ))}
        </div>
      )}

      <SectionHeader label="Planning" />
      {planning.length === 0 ? (
        <p className="text-[13px] text-ink-mute">Nothing on the drafting table.</p>
      ) : (
        <div className="space-y-2">
          {planning.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      <SectionHeader label="Ideas · resting" />
      <div className="flex flex-wrap items-center gap-2">
        {ideas.map((p) => (
          <Link
            key={p.id}
            href={`/plan/project/${p.id}`}
            className="rounded-full border border-vault-line bg-vault-bg-2 px-3.5 py-1.5 text-[13px] text-ink-dim transition hover:border-brass/60 hover:text-ink"
          >
            {p.title}
          </Link>
        ))}
        <NewProjectRow building={building.key} />
      </div>

      {complete.length > 0 ? (
        <>
          <SectionHeader label="Completed" />
          <div className="divide-y divide-vault-line/60">
            {complete.map((p) => (
              <Link
                key={p.id}
                href={`/plan/project/${p.id}`}
                className="flex items-baseline justify-between gap-3 py-2 text-[13px] text-ink-mute transition hover:text-ink"
              >
                <span>
                  <span className="mr-2 text-teal">✓</span>
                  {p.title}
                </span>
                {p.completedAt ? (
                  <span className="shrink-0 font-mono text-[10px] text-ink-mute/70">
                    {new Date(p.completedAt).toLocaleDateString([], {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </>
      ) : null}
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
  accent,
}: {
  project: Project;
  accent?: boolean;
}) {
  const lastLog = project.log.at(-1);
  return (
    <Link
      href={`/plan/project/${project.id}`}
      className={`block rounded-sm border bg-vault-panel px-4 py-3 transition hover:border-brass/60 ${
        accent ? "border-vault-line border-l-[3px] border-l-brass" : "border-vault-line"
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="vault-task-title text-ink">{project.title}</span>
        {lastLog ? (
          <span className="font-mono text-[10px] text-ink-mute">
            last note {lastLog.date}
          </span>
        ) : null}
      </div>
      {project.doneLooksLike ? (
        <div className="mt-1 text-[12px] text-ink-dim">
          Done looks like: {project.doneLooksLike}
        </div>
      ) : null}
    </Link>
  );
}
