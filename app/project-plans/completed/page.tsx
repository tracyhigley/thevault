// Completed projects — the whole campus's finished work in one place,
// grouped by building, newest first. Meant to be encouraging to scroll.

import Link from "next/link";
import { getBuildings } from "@/lib/categories";
import { getProjects } from "@/lib/projects";

export default async function CompletedProjectsPage() {
  const [buildings, projects] = await Promise.all([
    getBuildings(),
    getProjects(),
  ]);

  const complete = projects
    .filter((p) => p.phase === "complete")
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));

  const labelFor = (key: string) =>
    buildings.find((b) => b.key === key)?.label ?? "Uncategorized";

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 md:px-10">
      <Link
        href="/project-plans"
        className="font-mono text-[10px] tracking-[0.2em] text-ink-mute hover:text-brass"
      >
        ← MASTER PROJECT PLANS
      </Link>
      <h1 className="serif-h mt-3 text-[28px] leading-tight md:text-[36px]">
        Completed projects.
      </h1>
      <p className="mt-1 text-[13px] text-ink-dim">
        Everything you&apos;ve finished building — proof it gets done.
      </p>

      {complete.length === 0 ? (
        <p className="mt-10 text-[13px] text-ink-mute">
          Nothing completed yet. The first one will land here.
        </p>
      ) : (
        <div className="mt-8 space-y-2">
          {complete.map((p) => (
            <Link
              key={p.id}
              href={`/project-plans/project/${p.id}`}
              className="block rounded-sm border border-vault-line bg-vault-panel px-4 py-3 transition hover:border-brass/60"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="vault-task-title text-ink">
                  <span className="mr-2 text-teal">✓</span>
                  {p.title}
                </span>
                <span className="font-mono text-[10px] text-ink-mute">
                  {labelFor(p.building).toUpperCase()}
                  {p.completedAt
                    ? ` · ${new Date(p.completedAt)
                        .toLocaleDateString([], {
                          month: "short",
                          year: "numeric",
                        })
                        .toUpperCase()}`
                    : ""}
                </span>
              </div>
              {p.why ? (
                <div className="mt-1 text-[12px] text-ink-dim">{p.why}</div>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
