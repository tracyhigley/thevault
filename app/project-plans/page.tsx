// Master Project Plans — the campus view. Eight (or however many) buildings, each a
// life domain holding building projects. Deliberately calm: building cards
// show only what's under construction and what's in planning. Idea counts
// are hidden on purpose — ideas rest safely inside each building without
// demanding anything from this view.

import Link from "next/link";
import { getBuildings, buildingSlug } from "@/lib/categories";
import { getProjects } from "@/lib/projects";

export default async function MasterPlanPage() {
  const [buildings, projects] = await Promise.all([
    getBuildings(),
    getProjects(),
  ]);

  const underConstruction: Record<string, number> = {};
  const planning: Record<string, number> = {};
  let totalBuilding = 0;
  let totalComplete = 0;
  for (const p of projects) {
    if (p.phase === "building") {
      underConstruction[p.building] = (underConstruction[p.building] ?? 0) + 1;
      totalBuilding += 1;
    }
    if (p.phase === "planning") {
      planning[p.building] = (planning[p.building] ?? 0) + 1;
    }
    if (p.phase === "complete") totalComplete += 1;
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-10">
      <div className="eyebrow">— Master Project Plans —</div>
      <h1 className="serif-h mt-2 text-[28px] leading-tight md:text-[36px]">
        Everything you&apos;re building.
      </h1>
      <p className="mt-1 text-[13px] text-ink-dim">
        Walk into a building to see its projects.
      </p>

      <Link
        href="/project-plans/active"
        className="mt-4 inline-block font-mono text-[10px] tracking-[0.2em] text-brass hover:text-brass-bright"
      >
        VIEW ALL ACTIVE PLANS →
      </Link>

      {buildings.length === 0 ? (
        <div className="mt-10 rounded-sm border border-dashed border-paper-line bg-paper-panel/40 p-8 text-center">
          <p className="text-ink-dim">No buildings in your project plans yet.</p>
          <Link
            href="/settings/buildings"
            className="mt-3 inline-block font-mono text-[11px] tracking-[0.2em] text-brass hover:text-brass-bright"
          >
            + SET UP YOUR BUILDINGS
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {buildings.map((b) => {
            const active = underConstruction[b.key] ?? 0;
            const planned = planning[b.key] ?? 0;
            return (
              <Link
                key={b.key}
                href={`/project-plans/${buildingSlug(b.key)}`}
                className="group rounded-sm border border-paper-line bg-paper-panel px-4 py-4 transition hover:border-brass/60"
              >
                <div
                  className="h-1.5 w-6 rounded-full"
                  style={{ background: b.color ?? "#b5853a" }}
                />
                <div className="serif-h mt-3 text-[19px] leading-snug text-ink group-hover:text-brass-low">
                  {b.label}
                </div>
                {b.meta ? (
                  <div className="mt-0.5 text-[12px] text-ink-mute">
                    {b.meta}
                  </div>
                ) : null}
                <div className="mt-2 font-mono text-[10px] tracking-[0.14em] text-ink-mute">
                  {active > 0 || planned > 0
                    ? [
                        active > 0 ? `${active} UNDER CONSTRUCTION` : null,
                        planned > 0 ? `${planned} PLANNING` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : "QUIET RIGHT NOW"}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {buildings.length > 0 ? (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-paper-line pt-4">
          <span className="text-[13px] text-ink-mute">
            {totalBuilding === 0
              ? "Nothing under construction — the campus is at rest."
              : `${totalBuilding} project${totalBuilding === 1 ? "" : "s"} under construction across the campus.`}
          </span>
          <Link
            href="/project-plans/completed"
            className="font-mono text-[10px] tracking-[0.2em] text-brass hover:text-brass-bright"
          >
            COMPLETED PROJECTS{totalComplete > 0 ? ` (${totalComplete})` : ""} →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
