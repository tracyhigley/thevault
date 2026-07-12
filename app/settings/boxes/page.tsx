import { getBoxes } from "@/lib/categories";
import { BoxesEditor } from "@/components/boxes-editor";
import { SettingsSubnav } from "@/components/settings-subnav";

export default async function BoxesSettingsPage() {
  const initial = await getBoxes();

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 md:px-10">
      <div className="eyebrow">— Settings · boxes —</div>
      <h1 className="serif-h mt-2 text-[36px] leading-tight md:text-[40px]">
        How the vault is organized.
      </h1>

      <div className="mt-3">
        <SettingsSubnav />
      </div>

      <p className="mt-6 text-ink-dim">
        Your boxes are the categories you file thoughts into from Field Notes —
        life areas, businesses, projects. The same box can hold Admin Tasks items
        (obligations) and Project Tasks items (energy-matched pulls).
      </p>
      <p className="mt-1 text-[13px] text-ink-dim">
        The <strong>label</strong> is what you see in dropdowns. The{" "}
        <strong>meta</strong> is an optional subtitle (shown under the label
        on box cards). The <strong>key</strong> auto-derives from the label
        as you type — only edit it directly if you really need to.
      </p>

      <BoxesEditor initial={initial} />
    </div>
  );
}
