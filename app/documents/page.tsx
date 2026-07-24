// Notes hub — folder view for configured notes.

import Link from "next/link";
import { getDocuments } from "@/lib/categories";
import { CopyTableMarkdownButton } from "@/components/copy-table-markdown-button";
import { DOCUMENT_FOLDERS, groupDocumentsByFolder } from "@/lib/document-folders";
import { NewDocumentRow } from "@/components/new-document-row";

export default async function DocumentsHubPage() {
  const documents = await getDocuments();
  const grouped = groupDocumentsByFolder(documents);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        Notes
      </h1>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="text-[15px] text-ink-dim">
          Reference folders — open a folder to see the notes inside.
        </p>
        <CopyTableMarkdownButton />
      </div>

      <div className="mt-6">
        <NewDocumentRow />
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

      <div className="mt-10 eyebrow text-ink-mute">— Open a folder —</div>
      <div className="mt-4 flex flex-wrap gap-4">
        {DOCUMENT_FOLDERS.map((folder) => (
          <DocumentFolderCard
            key={folder.key}
            title={folder.label}
            count={grouped[folder.key].length}
            href={`/documents/folders/${folder.key}`}
          />
        ))}
      </div>
    </div>
  );
}

function DocumentFolderCard({
  title,
  count,
  href,
}: {
  title: string;
  count: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative h-[170px] w-full rounded-sm border border-[#d4be8f] bg-[#f7edcf] shadow-[inset_0_0_0_1px_rgba(212,190,143,0.35)] transition hover:border-[#c8aa73] hover:bg-[#f6e8c1] sm:w-[320px]"
    >
      <div className="absolute right-4 top-[-1px] rounded-b-md rounded-t-sm border border-[#d4be8f] bg-[#f3e4be] px-5 py-1.5 shadow-[inset_0_0_0_1px_rgba(212,190,143,0.35)]">
        <span className="font-serif text-[32px] tracking-wide text-[#4b3a24]">
          {title.toUpperCase()}
        </span>
      </div>
      <div className="absolute inset-0 rounded-sm bg-[linear-gradient(180deg,rgba(255,255,255,0.2),rgba(0,0,0,0.02))]" />
      <div className="absolute bottom-3 right-4 font-mono text-[11px] tracking-[0.16em] text-[#6f5a37]/80">
        {count} NOTE{count === 1 ? "" : "S"}
      </div>
    </Link>
  );
}
