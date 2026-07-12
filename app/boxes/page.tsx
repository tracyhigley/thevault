// The Boxes — STORAGE ONLY. Daily-action surfaces (Field Notes / Docket /
// Project Tasks / Admin Tasks) live in the top nav; here we only show the things you
// put away.
//
// Strictly configured-only: boxes = settings.boxes (and only those).
// Document categories live on /documents; items whose `box` isn't a configured
// box key are not shown here. Edit boxes under Settings → Boxes.

import { getAllItems } from "@/lib/data";
import { getBoxes, type Box } from "@/lib/categories";
import { layoutBoxHubRows } from "@/lib/box-hub-layout";
import { sortedItemsForHubBox } from "@/lib/box-hub-items";
import { BoxesSection } from "@/components/boxes-section";
import type { Item } from "@/lib/types";

export default async function BoxesPage() {
  const [items, boxes] = await Promise.all([getAllItems(), getBoxes()]);

  // Storage + Admin Tasks/Project Tasks/Field Notes work filed under each life-area key.
  const itemsByBox: Record<string, Item[]> = {};
  for (const b of boxes) {
    itemsByBox[b.key] = sortedItemsForHubBox(b.key, items);
  }

  const { rows: rowBoxes, orphans } = layoutBoxHubRows(boxes);
  const toTile = (b: Box) => ({
    key: b.key,
    label: b.label,
    count: itemsByBox[b.key]?.length ?? 0,
    slug: slugify(b.key),
  });
  const tileRows =
    boxes.length === 0
      ? []
      : rowBoxes.map((row) => row.map((b) => (b ? toTile(b) : null)));
  const orphanTiles = orphans.map(toTile);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        The Boxes
      </h1>
      <p className="mt-1 text-[13px] text-ink-dim">
        Put away all the projects, tasks, and ideas here.
      </p>

      {/* Boxes section — click a box to see its items and add new rows here. */}
      <Header label="Open a box" />
      <BoxesSection
        rows={tileRows}
        orphanTiles={orphanTiles}
        itemsByBox={itemsByBox}
        newBox={{ href: "/settings/boxes", label: "+ New box" }}
      />
    </div>
  );
}

function Header({ label }: { label: string }) {
  return <div className="mt-10 eyebrow text-ink-mute">— {label} —</div>;
}

// Convert a BOX_KEY → slug-case for URLs.
function slugify(key: string): string {
  return key.toLowerCase().replace(/_/g, "-").replace(/\//g, "-");
}
