// Sealed — ceremonial closing-of-the-day page.
//
// When you arrive with ?just=sealed or ?just=unsealed, the dial plays the
// transition animation. Without the param it just shows the current state.

import { getAllItems, getSettings } from "@/lib/data";
import { setSealed } from "@/lib/actions";
import { SealedScreen } from "@/components/sealed-screen";

// Daily-action surfaces — these aren't "storage", they're the live
// triage/play surfaces. Excluded from the sealed-screen count so the
// number reads "what's filed away," not "every row in the database".
const COUNTER_STATIONS = new Set(["DROP", "ATM", "COUNTER", "DOCKET"]);

export default async function SealedPage({
  searchParams,
}: {
  searchParams: Promise<{ just?: string }>;
}) {
  const { just } = await searchParams;
  const [settings, items] = await Promise.all([getSettings(), getAllItems()]);
  const sealed = !!settings?.sealed;

  // Count only items filed in storage boxes / documents.
  const inStorage = items.filter((i) => !COUNTER_STATIONS.has(i.box)).length;

  async function unseal() {
    "use server";
    await setSealed(false);
  }
  async function seal() {
    "use server";
    await setSealed(true);
  }

  return (
    <SealedScreen
      sealed={sealed}
      itemCount={inStorage}
      animate={just === "sealed" || just === "unsealed"}
      unsealAction={unseal}
      sealAction={seal}
    />
  );
}
