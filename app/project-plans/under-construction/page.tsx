// Under construction — everything actively being built across the whole
// campus, in one place. Styled like the Master Project Plans building grid,
// except each card is a single project (heading = project title, building
// shown smaller inside the card) — a building with multiple projects under
// construction gets one card per project, not one grouped card. Drag-orderable
// via active_order — falls back to newest-note-first for anything never dragged.

import Link from "next/link";
import { getBuildings } from "@/lib/categories";
import { getProjects } from "@/lib/projects";
import {
  ReorderableProjectCards,
  type ReorderableProjectCard,
} from "@/components/reorderable-project-cards";

export default async function UnderConstructionProjectsPage() {
  const [buildings, projects] = await Promise.all([
    getBuildings(),
    getProjects(),
  ]);

  const active = projects
    .filter((p) => p.phase === "building")
    .sort((a, b) => {
      if (a.activeOrder != null && b.activeOrder != null) {
        return a.activeOrder - b.activeOrder;
      }
      if (a.activeOrder != null) return -1;
      if (b.activeOrder != null) return 1;
      return (b.modifiedAt ?? "").localeCompare(a.modifiedAt ?? "");
    });

  const buildingByKey = new Map(buildings.map((b) => [b.key, b]));

  const reorderableProjects: ReorderableProjectCard[] = active.map((p) => ({
    id: p.id,
    title: p.title,
    buildingLabel: buildingByKey.get(p.building)?.label ?? "Uncategorized",
    buildingColor: buildingByKey.get(p.building)?.color,
    lastLogDate: p.log.at(-1)?.date ?? null,
    doneLooksLike: p.doneLooksLike,
    currentTasks: p.tasks
      .filter((t) => t.onTaskList)
      .map((t) => ({ id: t.id, text: t.text })),
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
        <div className="mt-8">
          <ReorderableProjectCards projects={reorderableProjects} />
        </div>
      )}
    </div>
  );
}
