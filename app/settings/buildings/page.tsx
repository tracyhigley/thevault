import { getBuildings } from "@/lib/categories";
import { saveBuildingConfig } from "@/lib/plan-actions";
import { BoxesEditor } from "@/components/boxes-editor";
import { SettingsSubnav } from "@/components/settings-subnav";

export default async function BuildingsSettingsPage() {
  const initial = await getBuildings();

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 md:px-10">
      <div className="eyebrow">— Settings · buildings —</div>
      <h1 className="serif-h mt-2 text-[36px] leading-tight md:text-[40px]">
        The campus on your Master Project Plans.
      </h1>

      <div className="mt-3">
        <SettingsSubnav />
      </div>

      <p className="mt-6 text-ink-dim">
        Buildings are the big, ongoing areas of your life — each one holds
        building projects on the Master Project Plans. They&apos;re separate from your
        boxes: boxes serve the day-to-day, buildings hold the long view.
      </p>
      <p className="mt-1 text-[13px] text-ink-dim">
        The <strong>label</strong> is the building&apos;s name. The{" "}
        <strong>meta</strong> is an optional one-liner shown under it (what
        this building is about). The <strong>key</strong> auto-derives from
        the label as you type.
      </p>

      <BoxesEditor
        initial={initial}
        onSave={saveBuildingConfig}
        singular="BUILDING"
        plural="BUILDINGS"
        labelPlaceholder="Name (e.g. The Library)"
        metaPlaceholder="What it's about (optional)"
      />
    </div>
  );
}
