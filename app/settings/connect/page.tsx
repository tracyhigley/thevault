// Connect-your-devices walkthrough.
//
// In five minutes the user can drop a thought from their phone or Mac
// without opening a tab. Each card is one mechanism with its own
// copyable snippet pre-filled with the user's id + token + base URL.

import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";
import { ConnectDeviceCards } from "@/components/connect-device-cards";
import { SettingsSubnav } from "@/components/settings-subnav";

export default async function ConnectPage() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const settings = await getSettings();
  const token = settings?.capture_token ?? null;

  // Resolve the public origin so snippets show real URLs.
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "the-blueprint.app";
  const baseUrl = `${proto}://${host}`;

  return (
    <div className="mx-auto max-w-[800px] px-4 py-8 md:px-10">
      <h1 className="serif-h text-[28px] leading-tight md:text-[36px]">
        Settings.
      </h1>
      <p className="mt-1 text-[13px] text-ink-dim">
        Connect The Blueprint to your iPhone and Mac so capture is one tap or one
        word away.
      </p>

      <div className="mt-4">
        <SettingsSubnav />
      </div>

      <ConnectDeviceCards
        userId={user?.id ?? ""}
        token={token}
        baseUrl={baseUrl}
      />
    </div>
  );
}
