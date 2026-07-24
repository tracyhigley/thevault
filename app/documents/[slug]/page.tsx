// Note detail — markdown body for one configured note category.
//
// The slug must match a document key in settings.documents (case-insensitive,
// hyphen ↔ underscore). Anything else 404s with a deep link back to the
// documents settings editor. Items are stored in the items table with box =
// the document key and a markdown body; we surface the most-recent item so
// this stays one-document-per-slug. Later we can fan out to multiple
// entries if needed.

import Link from "next/link";
import { getItemsByBox } from "@/lib/data";
import { getDocuments, getBuildings } from "@/lib/categories";
import { DocumentsEditor } from "@/components/documents-editor";
import { ConvertToProjectButton } from "@/components/convert-to-project-button";
import { DOCUMENT_FOLDERS, folderForDocument } from "@/lib/document-folders";
import type { BoxKey } from "@/lib/types";

function slugToKey(slug: string): string {
  return slug.toUpperCase().replace(/-/g, "_");
}

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const documents = await getDocuments();
  const key = slugToKey(slug);
  const meta = documents.find((d) => d.key === key);

  if (!meta) {
    return (
      <div className="mx-auto max-w-[640px] px-10 py-16 text-center">
        <div className="eyebrow">— Note not found —</div>
        <h1 className="serif-h mt-2 text-[28px]">Nothing filed here.</h1>
        <p className="mt-2 text-[15px] text-ink-mute">
          No note category called{" "}
          <span className="font-mono text-brass">{key}</span>.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link
            href="/documents"
            className="rounded-sm border border-paper-line px-4 py-2 font-mono text-[11px] tracking-[0.18em] text-ink-mute hover:border-brass/40 hover:text-brass"
          >
            ← BACK TO NOTES
          </Link>
          <Link
            href="/settings/documents"
            className="rounded-sm border border-brass/40 px-4 py-2 font-mono text-[11px] tracking-[0.18em] text-brass hover:bg-brass/10"
          >
            + ADD A NOTE
          </Link>
        </div>
      </div>
    );
  }

  const [items, buildings] = await Promise.all([
    getItemsByBox(key as BoxKey),
    getBuildings(),
  ]);
  const doc = items[0];
  const folderKey = folderForDocument(meta);
  const folderMeta = DOCUMENT_FOLDERS.find((f) => f.key === folderKey)!;

  return (
    <div className="mx-auto max-w-[800px] px-10 py-8">
      <div className="mb-6">
        <Link
          href={`/documents/folders/${folderKey}`}
          className="rounded-sm border border-paper-line px-3 py-1 font-mono text-[11px] tracking-[0.18em] text-ink-mute transition hover:border-brass/40 hover:text-brass"
        >
          ← BACK TO {folderMeta.label}
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
      <div className="mt-4">
        <ConvertToProjectButton
          title={meta.label}
          body={doc?.body ?? ""}
          buildings={buildings}
        />
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
