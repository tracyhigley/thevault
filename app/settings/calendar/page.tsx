import { Suspense } from "react";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { getCurrentBlueprint } from "@/lib/data";
import { SettingsSubnav } from "@/components/settings-subnav";
import { CalendarOAuthSetupNote } from "@/components/calendar-oauth-setup-note";
import { GoogleCalendarPanel } from "@/components/google-calendar-panel";

export const dynamic = "force-dynamic";

export default async function CalendarSettingsPage() {
  const vault = await getCurrentBlueprint();
  if (!vault) redirect("/onboarding");

  const sb = await supabaseServer();
  const { data: conn } = await sb
    .from("google_calendar_connections")
    .select("calendar_id, timezone")
    .eq("vault_id", vault.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-[800px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        Settings.
      </h1>
      <p className="mt-1 text-[13px] text-ink-dim">
        Bring events from Google Calendar into Field Notes automatically.
      </p>

      <div className="mt-4">
        <SettingsSubnav />
      </div>

      <div className="mt-8 border-t border-paper-line/60 pt-8">
        <h2 className="eyebrow text-ink-mute">— Google Calendar —</h2>
        <Suspense
          fallback={
            <p className="mt-4 text-[13px] text-ink-mute">Loading…</p>
          }
        >
          <GoogleCalendarPanel
            connected={!!conn}
            calendarId={conn?.calendar_id ?? "primary"}
            timezone={conn?.timezone ?? "America/Los_Angeles"}
          />
        </Suspense>
      </div>

      <CalendarOAuthSetupNote />
    </div>
  );
}
