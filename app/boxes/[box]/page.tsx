import Link from "next/link";
import { getAllItems } from "@/lib/data";
import { getBoxes } from "@/lib/categories";
import { BoxStorageList } from "@/components/box-storage-list";
import { sortedItemsForHubBox } from "@/lib/box-hub-items";
import type { BoxKey } from "@/lib/types";

export default async function BoxPage({
  params,
}: {
  params: Promise<{ box: string }>;
}) {
  const { box } = await params;
  const key = box.toUpperCase().replace(/-/g, "_") as BoxKey;
  const [allItems, configuredBoxes] = await Promise.all([
    getAllItems(),
    getBoxes(),
  ]);
  const list = sortedItemsForHubBox(key, allItems);
  // Settings is the source of truth for the box label. If the slug
  // doesn't resolve to a configured box, render a not-found rather
  // than prettifying the raw key — that would dishonestly imply the
  // box exists in settings.
  const meta = configuredBoxes.find((b) => b.key === key);
  if (!meta) {
    return (
      <div className="mx-auto max-w-[640px] px-10 py-16 text-center">
        <div className="eyebrow">— Box not found —</div>
        <h1 className="serif-h mt-2 text-[28px]">Nothing filed here.</h1>
        <p className="mt-2 text-[13px] text-ink-mute">
          No box configured for{" "}
          <span className="font-mono text-brass">{key}</span>.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link
            href="/boxes"
            className="rounded-sm border border-paper-line px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-ink-mute hover:border-brass/40 hover:text-brass"
          >
            ← BACK TO BOXES
          </Link>
          <Link
            href="/settings/boxes"
            className="rounded-sm border border-brass/40 px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-brass hover:bg-brass/10"
          >
            + ADD A BOX
          </Link>
        </div>
      </div>
    );
  }
  const title = meta.label;

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-10">
      <div className="eyebrow">— Storage box —</div>
      <h1 className="serif-h mt-2 text-[36px] leading-tight md:text-[40px]">
        {title}
      </h1>

      <div className="mt-6">
        <BoxStorageList boxKey={key} title={title} items={list} />
      </div>
    </div>
  );
}
