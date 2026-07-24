import { getDocuments } from "@/lib/categories";
import { saveDocumentConfig } from "@/lib/actions";
import { DocumentsSettingsEditor } from "@/components/documents-settings-editor";
import { SettingsSubnav } from "@/components/settings-subnav";

export default async function DocumentsSettingsPage() {
  const initial = await getDocuments();

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 md:px-10">
      <div className="eyebrow">— Settings · notes —</div>
      <h1 className="serif-h mt-2 text-[36px] leading-tight md:text-[40px]">
        Long-form reference categories.
      </h1>

      <div className="mt-3">
        <SettingsSubnav />
      </div>

      <p className="mt-6 text-[18px] text-ink-dim">
        Notes are text-first reference — Measurements, Read &amp; Research,
        Health Ideas, and anything else long-form. Distinct from boxes (which
        hold task-shaped items). Each note gets a markdown page at{" "}
        <span className="font-mono text-brass">/documents/&lt;slug&gt;</span>.
      </p>

      <DocumentsSettingsEditor
        initial={initial}
        onSave={saveDocumentConfig}
      />
    </div>
  );
}
