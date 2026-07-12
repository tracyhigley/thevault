import { headers } from "next/headers";
import {
  getDefaultCanonicalSiteUrl,
  getSiteUrlFromHeaders,
  isLegacyVaultHost,
} from "@/lib/site-url";

/** Collapsed setup reference — uses canonical / current URL for OAuth. */
export async function CalendarOAuthSetupNote() {
  const h = await headers();
  const requestHost = (h.get("x-forwarded-host") ?? h.get("host") ?? "")
    .split(",")[0]
    ?.trim();
  const onLegacyHost = requestHost ? isLegacyVaultHost(requestHost) : false;
  const siteUrl = onLegacyHost
    ? getDefaultCanonicalSiteUrl()
    : getSiteUrlFromHeaders(h);
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "").trim();
  const envMismatch =
    !!envUrl && envUrl.toLowerCase() !== siteUrl.toLowerCase();

  const hasGoogleCreds =
    !!(
      process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim() ||
      process.env.GOOGLE_CLIENT_ID?.trim()
    ) &&
    !!(
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim() ||
      process.env.GOOGLE_CLIENT_SECRET?.trim()
    );

  const callback = `${siteUrl}/api/google-calendar/callback`;

  return (
    <details className="mt-10 rounded-sm border border-paper-line/50 bg-paper-panel/20 px-3 py-2 text-[12px] text-ink-mute">
      <summary className="cursor-pointer font-mono tracking-[0.12em]">
        GOOGLE OAUTH SETUP REFERENCE (not an error)
      </summary>
      <div className="mt-3 space-y-2 leading-relaxed">
        {onLegacyHost ? (
          <p className="rounded-sm border border-rust/40 bg-rust/5 px-2 py-1.5 text-rust">
            You are on an old project URL ({requestHost}). Use{" "}
            <a href={siteUrl} className="font-mono underline">
              {siteUrl}
            </a>{" "}
            instead — bookmarks to the old hostname will redirect automatically
            after the latest deploy.
          </p>
        ) : null}
        {envMismatch ? (
          <p className="rounded-sm border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-amber-900">
            <span className="font-mono">NEXT_PUBLIC_SITE_URL</span> in Vercel is
            still <span className="font-mono">{envUrl}</span> but you are on{" "}
            <span className="font-mono">{siteUrl}</span>. OAuth below uses this
            visit&apos;s URL. Update the env var in Vercel and redeploy when you
            can.
          </p>
        ) : null}
        {!hasGoogleCreds ? (
          <p className="text-rust">
            Missing Google OAuth credentials on the server (
            <span className="font-mono">GOOGLE_CALENDAR_CLIENT_ID</span> /{" "}
            <span className="font-mono">SECRET</span>, or{" "}
            <span className="font-mono">GOOGLE_CLIENT_ID</span> /{" "}
            <span className="font-mono">SECRET</span>).
          </p>
        ) : null}
        <p>
          In Google Cloud → Credentials → your OAuth client, register this
          redirect URI exactly:
        </p>
        <p className="break-all font-mono text-[11px] text-brass">{callback}</p>
        <p>
          Open The Blueprint at{" "}
          <span className="font-mono text-ink/80">{siteUrl}</span> when you
          connect.
        </p>
      </div>
    </details>
  );
}
