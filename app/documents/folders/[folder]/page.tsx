import Link from "next/link";
import { notFound } from "next/navigation";
import { getDocuments, getBuildings, buildingSlug } from "@/lib/categories";
import { BoxCard } from "@/components/box-card";
import { slugifyDocumentKey } from "@/lib/document-folders";

export default async function DocumentsFolderPage({
  params,
}: {
  params: Promise<{ folder: string }>;
}) {
  const { folder } = await params;
  const [documents, buildings] = await Promise.all([
    getDocuments(),
    getBuildings(),
  ]);
  const building = buildings.find((b) => buildingSlug(b.key) === folder);
  if (!building) notFound();

  const inBuilding = documents.filter((d) => d.folder === building.key);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-10">
      <div className="eyebrow">— {building.label} —</div>
      <h1 className="serif-h mt-2 text-[28px] leading-tight md:text-[36px]">
        {building.label}
      </h1>
      <p className="mt-1 text-[15px] text-ink-dim">
        {inBuilding.length > 0
          ? `Open a note in ${building.label}.`
          : `No notes in ${building.label} yet.`}
      </p>

      <div className="mt-4">
        <Link
          href="/documents"
          className="rounded-sm border border-paper-line px-3 py-1 font-mono text-[11px] tracking-[0.18em] text-ink-mute transition hover:border-brass/40 hover:text-brass"
        >
          ← BACK TO NOTES
        </Link>
      </div>

      {inBuilding.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-4">
          {inBuilding.map((d) => (
            <BoxCard
              key={d.key}
              title={d.label}
              meta={d.meta || "reference"}
              href={`/documents/${slugifyDocumentKey(d.key)}`}
            />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-[15px] text-ink-mute">
          Add notes from Settings, then they&apos;ll appear here.
        </p>
      )}
    </div>
  );
}
