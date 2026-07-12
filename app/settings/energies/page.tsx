import { getEnergies } from "@/lib/categories";
import { EnergiesEditor } from "@/components/energies-editor";
import { SettingsSubnav } from "@/components/settings-subnav";

export default async function EnergiesSettingsPage() {
  const initial = await getEnergies();

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 md:px-10">
      <div className="eyebrow">— Settings · energies —</div>
      <h1 className="serif-h mt-2 text-[36px] leading-tight md:text-[40px]">
        Energies.
      </h1>

      <div className="mt-3">
        <SettingsSubnav />
      </div>

      <p className="mt-6 text-ink-dim">
        Energies label how a task feels — they live on Project Tasks items, used by
        the daily plan to match what you can pull today. Admin Tasks items don't
        use energy; they go by urgency and must-do flags.
      </p>
      <p className="mt-1 text-[13px] text-ink-dim">
        The <strong>label</strong> is what you see in dropdowns. The{" "}
        <strong>key</strong> auto-derives from the label as you type — only
        edit it directly if you really need to.
      </p>

      <EnergiesEditor initial={initial} />
    </div>
  );
}
