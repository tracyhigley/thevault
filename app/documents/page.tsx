// Notes hub — building view, mirroring Project Plans. Each building shows
// how many notes are filed there; open a building to see the notes inside.

import Link from "next/link";
import { getDocuments, getBuildings, buildingSlug } from "@/lib/categories";
import { CopyTableMarkdownButton } from "@/components/copy-table-markdown-button";
import { groupDocumentsByBuilding } from "@/lib/document-folders";
import { NewDocumentRow } from "@/components/new-document-row";

export default async function DocumentsHubPage() {
  const [documents, buildings] = await Promise.all([
    getDocuments(),
    getBuildings(),
  ]);
  const { byBuilding, unfiled } = groupDocumentsByBuilding(
    documents,
    buildings,
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-10">
      <div className="eyebrow">— Notes —</div>
      <h1 className="serif-h mt-2 text-[28px] leading-tight md:text-[36px]">
        Notes
      </h1>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="text-[15px] text-ink-dim">
          Walk into a building to see the notes filed there.
        </p>
        <CopyTableMarkdownButton />
      </div>

      <div className="mt-6">
        <NewDocumentRow buildings={buildings} />
        <p className="mt-2 text-[13px] text-ink-dim">
          <Link
            href="/settings/documents"
            className="text-brass hover:underline"
          >
            Rename, keys, colors, or remove
          </Link>{" "}
          notes in Settings.
        </p>
      </div>

      {buildings.length === 0 ? (
        <div className="mt-10 rounded-sm border border-dashed border-paper-line bg-paper-panel/40 p-8 text-center">
          <p className="text-ink-dim">No buildings set up yet.</p>
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
            const count = byBuilding[b.key]?.length ?? 0;
            return (
              <Link
                key={b.key}
                href={`/documents/folders/${buildingSlug(b.key)}`}
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
                  {count > 0 ? `${count} NOTE${count === 1 ? "" : "S"}` : "NO NOTES YET"}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {unfiled.length > 0 ? (
        <div className="mt-8 rounded-sm border border-dashed border-rust/40 bg-rust/5 p-4">
          <p className="text-[13px] text-ink-dim">
            {unfiled.length} note{unfiled.length === 1 ? "" : "s"} without a
            building —{" "}
            <Link
              href="/settings/documents"
              className="text-brass hover:underline"
            >
              give {unfiled.length === 1 ? "it" : "them"} one in Settings
            </Link>
            .
          </p>
        </div>
      ) : null}
    </div>
  );
}
