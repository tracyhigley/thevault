// Note detail — markdown body for one configured note category.
//
// The slug must match a document key in settings.documents (case-insensitive,
// hyphen ↔ underscore). Anything else 404s with a deep link back to the
// Notes hub. Items are stored in the items table with box =
// the document key and a markdown body; we surface the most-recent item so
// this stays one-document-per-slug. Later we can fan out to multiple
// entries if needed.

import Link from "next/link";
import { getItemsByBox } from "@/lib/data";
import { getDocuments, getBuildings, buildingSlug } from "@/lib/categories";
import { slugifyDocumentKey } from "@/lib/document-folders";
import { DocumentsEditor } from "@/components/documents-editor";
import { ConvertToProjectButton } from "@/components/convert-to-project-button";
import { DeleteNoteButton } from "@/components/delete-note-button";
import type { BoxKey } from "@/lib/types";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const documents = await getDocuments();
  // Forward-search by re-slugifying each document's real key, rather than
  // reversing the slug back into a key (matches the buildingSlug pattern in
  // lib/categories.ts). A key can itself contain a literal "-" (e.g. a note
  // titled "GLP-1 Thoughts" derives key "GLP-1_THOUGHTS"), and slugifying
  // collapses both "-" and "_" to "-" in the URL ("glp-1-thoughts") — that
  // collapse is lossy, so naively uppercasing the slug and turning every "-"
  // back into "_" can reconstruct the wrong key ("GLP_1_THOUGHTS") and 404 on
  // a note that really does exist. Searching forward sidesteps the need to
  // invert a lossy transform at all.
  const meta = documents.find((d) => slugifyDocumentKey(d.key) === slug);

  if (!meta) {
    return (
      <div className="mx-auto max-w-[640px] px-10 py-16 text-center">
        <div className="eyebrow">— Note not found —</div>
        <h1 className="serif-h mt-2 text-[28px]">Nothing filed here.</h1>
        <p className="mt-2 text-[15px] text-ink-mute">
          No note category matches{" "}
          <span className="font-mono text-brass">{slug}</span>.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link
            href="/documents"
            className="rounded-sm border border-paper-line px-4 py-2 font-mono text-[11px] tracking-[0.18em] text-ink-mute hover:border-brass/40 hover:text-brass"
          >
            ← BACK TO NOTES
          </Link>
          <Link
            href="/documents"
            className="rounded-sm border border-brass/40 px-4 py-2 font-mono text-[11px] tracking-[0.18em] text-brass hover:bg-brass/10"
          >
            + ADD A NOTE
          </Link>
        </div>
      </div>
    );
  }

  const key = meta.key;
  const [items, buildings] = await Promise.all([
    getItemsByBox(key as BoxKey),
    getBuildings(),
  ]);
  const doc = items[0];
  const building = buildings.find((b) => b.key === meta.folder);
  const backHref = building
    ? `/documents/folders/${buildingSlug(building.key)}`
    : "/documents";

  return (
    <div className="mx-auto max-w-[800px] px-10 py-8">
      <div className="mb-6">
        <Link
          href={backHref}
          className="rounded-sm border border-paper-line px-3 py-1 font-mono text-[11px] tracking-[0.18em] text-ink-mute transition hover:border-brass/40 hover:text-brass"
        >
          ← BACK TO {building ? building.label.toUpperCase() : "NOTES"}
        </Link>
      </div>
      <div className="eyebrow">— Note —</div>
      <h1 className="mt-2 font-sans text-[32px] font-semibold leading-tight tracking-tight text-ink md:text-[36px]">
        {meta.label}
      </h1>
      {meta.meta && (
        <p className="mt-1 font-sans text-[16px] leading-snug text-ink-dim">
          {meta.meta}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ConvertToProjectButton
          title={meta.label}
          body={doc?.body ?? ""}
          buildings={buildings}
        />
        <DeleteNoteButton docKey={key} label={meta.label} backHref={backHref} />
      </div>
      <div className="mt-8">
        <DocumentsEditor
          box={key}
          initial={doc?.body ?? ""}
          title={meta.label}
        />
      </div>
    </div>
  );
}
