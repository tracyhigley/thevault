// Under construction — everything actively being built across the whole
// campus, in one place. Mirrors /project-plans/completed.

import Link from "next/link";
import { getBuildings } from "@/lib/categories";
import { getProjects } from "@/lib/projects";

export default async function UnderConstructionProjectsPage() {
  const [buildings, projects] = await Promise.all([
    getBuildings(),
    getProjects(),
  ]);

  const active = projects
    .filter((p) => p.phase === "building")
    .sort((a, b) => (b.modifiedAt ?? "").localeCompare(a.modifiedAt ?? ""));

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
        Under construction.
      </h1>
      <p className="mt-1 text-[13px] text-ink-dim">
        Everything actively being built across the campus right now.
      </p>

      {active.length === 0 ? (
        <p className="mt-10 text-[13px] text-ink-mute">
          Nothing under construction — the campus is at rest.
        </p>
      ) : (
        <div className="mt-8 space-y-2">
          {active.map((p) => {
            const lastLog = p.log.at(-1);
            const currentTasks = p.tasks.filter((t) => t.onTaskList);
            return (
              <Link
                key={p.id}
                href={`/project-plans/project/${p.id}`}
                className="block rounded-sm border border-paper-line border-l-[3px] border-l-brass bg-paper-panel px-4 py-3 transition hover:border-brass/60"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="paper-task-title text-ink">{p.title}</span>
                  <span className="font-mono text-[10px] text-ink-mute">
                    {labelFor(p.building).toUpperCase()}
                    {lastLog ? ` · last note ${lastLog.date}` : ""}
                  </span>
                </div>
                {p.doneLooksLike ? (
                  <div className="mt-1 text-[12px] text-ink-dim">
                    Done looks like: {p.doneLooksLike}
                  </div>
                ) : null}
                {currentTasks.length > 0 ? (
                  <div className="mt-2">
                    <div className="font-mono text-[9px] tracking-[0.2em] text-brass">
                      CURRENT TASKS:
                    </div>
                    <ul className="mt-1 space-y-0.5">
                      {currentTasks.map((t) => (
                        <li key={t.id} className="text-[12px] text-ink-dim">
                          {t.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
