import Link from "next/link";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { getSettings } from "@/lib/data";
import { saveSettings } from "@/lib/actions";
import { CaptureTokenRow } from "@/components/capture-token-row";
import { SettingsSubnav } from "@/components/settings-subnav";
import { NumberField } from "@/components/ui";

export default async function SettingsPage() {
  const row = await getSettings();
  const s = row
    ? {
        stressorAnchorMinutes: row.stressor_anchor_minutes,
        defaultEndOfDay: row.default_end_of_day,
        defaultHours: Number(row.default_hours),
      }
    : DEFAULT_SETTINGS;

  return (
    <div className="mx-auto max-w-[800px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        Settings.
      </h1>
      <p className="mt-1 text-[13px] text-ink-dim">
        How the blueprint behaves. The tabs below cover members, the categories
        you file into, the energies that power Project Tasks matching, Google Calendar
        to Field Notes, and how to connect your phone and Mac.
      </p>

      <div className="mt-4">
        <SettingsSubnav />
      </div>

      <form action={saveSettings} className="mt-8 space-y-6">
        <Group title="The day">
          <Row
            label="Default hours"
            hint="Used before today’s setup is saved (preview only). After you build today, hours come from now → your end-of-day time."
          >
            <NumberField
              name="default_hours"
              defaultValue={s.defaultHours}
              step="0.5"
              min="0"
              max="24"
              unit="hrs"
              width="w-[88px]"
            />
          </Row>
          <Row
            label="Default end of day"
            hint="Anchor time the schedule lands at."
          >
            <input
              type="time"
              name="default_end_of_day"
              defaultValue={s.defaultEndOfDay}
              className="w-[120px] rounded-sm border border-vault-line bg-vault-bg/60 px-2.5 py-1.5 text-right font-mono text-[12px] text-ink outline-none transition focus:border-brass focus:bg-vault-bg/80"
            />
          </Row>
          <Row
            label="Stressor anchor threshold"
            hint="When today's urgent+must minutes hit this, admin runs first thing in the morning. Below it, Project Tasks picks come first and admin lands after."
          >
            <NumberField
              name="stressor_anchor_minutes"
              defaultValue={s.stressorAnchorMinutes}
              min="0"
              max="480"
              unit="min"
              width="w-[88px]"
            />
          </Row>
        </Group>

        <div className="flex justify-end">
          <button
            type="submit"
            className="brass-button px-6 py-2 font-mono text-[10px] tracking-[0.24em]"
          >
            SAVE
          </button>
        </div>
      </form>

      <div className="mt-12">
        <Group title="Capture (Apple Shortcut)">
          <CaptureTokenRow token={row?.capture_token ?? null} />
          <div className="border-t border-vault-line/40 px-4 py-3 text-[13px] text-ink-dim">
            Want a step-by-step?{" "}
            <Link href="/settings/connect" className="text-brass hover:underline">
              Connect your iPhone &amp; Mac →
            </Link>{" "}
            walks through Add-to-Home-Screen, Siri capture, Mac quick-capture,
            and a one-click bookmarklet.
          </div>
        </Group>
      </div>
    </div>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="eyebrow">— {title} —</h2>
      <div className="mt-3 divide-y divide-vault-line/60 rounded-sm border border-vault-line/60 bg-vault-panel/30">
        {children}
      </div>
    </section>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="text-ink">{label}</div>
        {hint && (
          <div className="mt-0.5 text-[13px] text-ink-dim">{hint}</div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
