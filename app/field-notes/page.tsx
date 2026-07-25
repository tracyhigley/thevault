import Link from "next/link";
import { redirect } from "next/navigation";
import { getItemsByBox } from "@/lib/data";
import { getBuildings, getEnergies } from "@/lib/categories";
import { NewItemRow } from "@/components/new-item-row";
import { SortableList } from "@/components/sortable-list";
import { DropTriageRow } from "@/components/drop-triage-row";
import { DropKeyboardController } from "@/components/drop-keyboard-controller";
import { Kbd } from "@/components/kbd";

export default async function DropPage() {
  const [list, buildings, energies] = await Promise.all([
    getItemsByBox("DROP"),
    getBuildings(),
    getEnergies(),
  ]);

  // Nothing left to triage — hand back to "/", which decides what's next
  // (build prompt if today isn't built yet, the schedule if it is).
  if (list.length === 0) {
    redirect("/");
  }

  const ready = buildings.length > 0 && energies.length > 0;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        Field Notes
      </h1>
      <p className="text-ink-dim mt-1 text-[13px]">
        {ready
          ? "Triage each thought — pick a building, set time/flags/energy, send."
          : "Untriaged captures. Set up your buildings and energies before triaging."}
      </p>

      {!ready && (
        <div className="border-brass/40 bg-paper-panel/30 mt-6 rounded-sm border border-dashed p-6">
          <h3 className="serif-h text-ink text-[18px]">
            Set up your blueprint first.
          </h3>
          <p className="text-ink-dim mt-1 text-[13px]">
            Triage needs at least one building (where things go) and one energy
            (which decides Project Tasks vs Admin Tasks).
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {buildings.length === 0 && (
              <Link
                href="/settings/buildings"
                className="brass-button px-4 py-2 font-mono text-[10px] tracking-[0.18em]"
              >
                + ADD BUILDINGS
              </Link>
            )}
            {energies.length === 0 && (
              <Link
                href="/settings/energies"
                className="brass-button px-4 py-2 font-mono text-[10px] tracking-[0.18em]"
              >
                + ADD ENERGIES
              </Link>
            )}
          </div>
        </div>
      )}

      {ready && list.length > 0 && (
        <div className="border-paper-line/40 bg-paper-panel/20 text-ink-mute mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-sm border px-3 py-2 font-mono text-[10px] tracking-wider">
          <span className="text-brass">Keyboard:</span>
          <span className="flex items-center gap-1.5">
            <Kbd keys="j" size="xs" /> <Kbd keys="k" size="xs" /> next/prev
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd keys="1" size="xs" /> Project Tasks <Kbd keys="2" size="xs" />{" "}
            Admin Tasks
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd keys="b" size="xs" /> box <Kbd keys="t" size="xs" /> time{" "}
            <Kbd keys="e" size="xs" /> energy
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd keys="u" size="xs" /> urgent <Kbd keys="m" size="xs" /> must{" "}
            <Kbd keys="s" size="xs" /> should
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd keys="enter" size="xs" /> send <Kbd keys="x" size="xs" />{" "}
            delete
          </span>
          <span className="ml-auto opacity-70">
            <Kbd keys="?" size="xs" /> all shortcuts
          </span>
        </div>
      )}

      <div className="mt-3">
        <DropKeyboardController />
        <div className="mb-3">
          <NewItemRow box="DROP" placeholder="+ Add a field note" />
        </div>
        <SortableList
          items={list.map((it) => ({
            id: it.id,
            content: (
              <DropTriageRow item={it} boxes={buildings} energies={energies} />
            ),
          }))}
        />
      </div>

      <p className="text-ink-mute mt-6 text-[11px]">
        New captures land here from the iPhone Shortcut, Siri, or the{" "}
        <Link href="/field-notes/add" className="text-brass underline">
          Add a Field Note
        </Link>{" "}
        page. Edit buildings and energies under{" "}
        <Link href="/settings/buildings" className="text-brass underline">
          Settings
        </Link>
        .
      </p>
    </div>
  );
}
