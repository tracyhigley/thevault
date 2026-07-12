import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDocuments } from "@/lib/categories";
import { BoxCard } from "@/components/box-card";
import {
  DOCUMENT_FOLDERS,
  groupDocumentsByFolder,
  slugifyDocumentKey,
  type DocumentFolderKey,
} from "@/lib/document-folders";

const VALID_FOLDERS = new Set<DocumentFolderKey>(
  DOCUMENT_FOLDERS.map((f) => f.key),
);

export default async function DocumentsFolderPage({
  params,
}: {
  params: Promise<{ folder: string }>;
}) {
  const { folder } = await params;
  if (folder === "books") redirect("/documents/folders/read-watch");
  if (!VALID_FOLDERS.has(folder as DocumentFolderKey)) notFound();

  const folderKey = folder as DocumentFolderKey;
  const documents = await getDocuments();
  const grouped = groupDocumentsByFolder(documents);
  const inFolder = grouped[folderKey];
  const folderMeta = DOCUMENT_FOLDERS.find((f) => f.key === folderKey)!;

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-10">
      <div className="eyebrow">— Folder —</div>
      <h1 className="serif-h mt-2 text-[28px] leading-tight md:text-[36px]">
        {folderMeta.label}
      </h1>
      <p className="mt-1 text-[15px] text-ink-dim">
        {inFolder.length > 0
          ? `Open a document in ${folderMeta.label}.`
          : `No documents in ${folderMeta.label} yet.`}
      </p>

      <div className="mt-4">
        <Link
          href="/documents"
          className="rounded-sm border border-paper-line px-3 py-1 font-mono text-[11px] tracking-[0.18em] text-ink-mute transition hover:border-brass/40 hover:text-brass"
        >
          ← BACK TO FOLDERS
        </Link>
      </div>

      {inFolder.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-4">
          {inFolder.map((d) => (
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
          Add documents from Settings, then they&apos;ll appear here.
        </p>
      )}
    </div>
  );
}
