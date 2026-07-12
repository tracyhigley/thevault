// One building project — the title block, the four prompt sections, and
// the dated log. Everything edits in place and saves on blur.

import Link from "next/link";
import { notFound } from "next/navigation";
import { getBuildings, buildingSlug } from "@/lib/categories";
import { getProject } from "@/lib/projects";
import { ProjectFieldEditor } from "@/components/project-field-editor";
import { ProjectPhaseControl } from "@/components/project-phase-control";
import { ProjectLog } from "@/components/project-log";
import { DeleteProjectButton } from "@/components/delete-project-button";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, buildings] = await Promise.all([
    getProject(id),
    getBuildings(),
  ]);
  if (!project) notFound();

  const building = buildings.find((b) => b.key === project.building);
  const backHref = building ? `/project-plans/${buildingSlug(building.key)}` : "/project-plans";
  const buildingLabel = building?.label ?? "Uncategorized";

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 md:px-10">
      <Link
        href={backHref}
        className="font-mono text-[10px] tracking-[0.2em] text-ink-mute hover:text-brass"
      >
        ← {buildingLabel.toUpperCase()}
      </Link>

      {/* Title block */}
      <div className="mt-3 rounded-sm border border-vault-line-2 bg-vault-panel px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-[240px] flex-1">
            <ProjectFieldEditor
              projectId={project.id}
              field="title"
              initial={project.title}
              className="serif-h w-full text-[24px] leading-tight md:text-[28px]"
              placeholder="Project name"
            />
            <div className="mt-1 font-mono text-[10px] tracking-[0.14em] text-ink-mute">
              {buildingLabel.toUpperCase()} · STARTED{" "}
              {new Date(project.createdAt)
                .toLocaleDateString([], { month: "short", year: "numeric" })
                .toUpperCase()}
              {project.completedAt
                ? ` · COMPLETED ${new Date(project.completedAt)
                    .toLocaleDateString([], { month: "short", year: "numeric" })
                    .toUpperCase()}`
                : ""}
            </div>
          </div>
          <ProjectPhaseControl projectId={project.id} phase={project.phase} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Section label="Why this matters">
          <ProjectFieldEditor
            projectId={project.id}
            field="why"
            initial={project.why}
            multiline
            placeholder="Two or three sentences — what makes this worth building?"
          />
        </Section>
        <Section label="What done looks like">
          <ProjectFieldEditor
            projectId={project.id}
            field="done_looks_like"
            initial={project.doneLooksLike}
            multiline
            placeholder="The finish line, in plain words. When this is true, it's complete."
          />
        </Section>
      </div>

      <div className="mt-3">
        <Section label="The sketch">
          <ProjectFieldEditor
            projectId={project.id}
            field="sketch"
            initial={project.sketch}
            multiline
            rows={4}
            placeholder="Freeform vision — messy allowed."
          />
        </Section>
      </div>

      <div className="mt-3">
        <Section label="Systems — how this runs with less of me">
          <ProjectFieldEditor
            projectId={project.id}
            field="systems"
            initial={project.systems}
            multiline
            rows={4}
            placeholder="Delegate · automate · template · drop. How could this need less of your time?"
          />
        </Section>
      </div>

      <div className="mt-3">
        <Section label="Log">
          <ProjectLog projectId={project.id} initial={project.log} />
        </Section>
      </div>

      <div className="mt-8 flex justify-end border-t border-vault-line pt-4">
        <DeleteProjectButton projectId={project.id} backHref={backHref} />
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-sm border border-vault-line bg-vault-panel px-4 py-3">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-brass">
        {label}
      </div>
      {children}
    </div>
  );
}
