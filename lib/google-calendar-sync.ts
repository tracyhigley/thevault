import { google } from "googleapis";
import { formatInTimeZone } from "date-fns-tz";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { localDayBoundsUtc, todayYmdInTz } from "@/lib/calendar-day-bounds";
import { getOAuthClient } from "@/lib/google-calendar-oauth";
import { getSiteUrlFromHeaders } from "@/lib/site-url";
import { supabaseAdmin } from "@/lib/supabase/server";

type ConnectionRow = {
  vault_id: string;
  refresh_token: string;
  calendar_id: string;
  timezone: string;
};

export function calendarOAuthRedirectUri(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/api/google-calendar/callback`;
}

/** OAuth redirect URI for Calendar API calls (cron uses env only; UI may use request host). */
export async function resolveCalendarOAuthRedirectUri(): Promise<string> {
  const h = await headers();
  return calendarOAuthRedirectUri(getSiteUrlFromHeaders(h));
}

function formatGoogleSyncError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/invalid_grant|token has been expired|token has been revoked/i.test(msg)) {
    return "Google access expired. Re-connect Google Calendar in Settings.";
  }
  if (/Missing GOOGLE_CALENDAR_CLIENT/i.test(msg)) {
    return "Google Calendar is not configured on the server.";
  }
  if (/Missing Supabase admin/i.test(msg)) {
    return "Server misconfiguration (Supabase service role).";
  }
  if (/NEXT_PUBLIC_SITE_URL/i.test(msg)) {
    return "Set NEXT_PUBLIC_SITE_URL on the server for Google Calendar.";
  }
  return msg;
}

type GCalEvent = {
  summary?: string | null;
  start?: { date?: string | null; dateTime?: string | null } | null;
};

function eventToTitle(event: GCalEvent): string {
  return (event.summary || "").trim() || "(No title)";
}

/**
 * Import today’s events from the connected calendar into the Drop (deduped).
 * Uses each blueprint’s timezone to decide what “today” is.
 */
export async function syncAllCalendarsToFieldNotes(): Promise<{
  ok: boolean;
  vaults: number;
  imported: number;
  errors: string[];
}> {
  return syncAllCalendarsToFieldNotesWithOptions();
}

function localHourInTz(tz: string): number {
  return Number(formatInTimeZone(new Date(), tz, "H"));
}

export async function syncAllCalendarsToFieldNotesWithOptions(opts?: {
  localHourOnly?: number;
}): Promise<{
  ok: boolean;
  vaults: number;
  imported: number;
  errors: string[];
}> {
  let admin;
  try {
    admin = supabaseAdmin();
  } catch (e) {
    return {
      ok: false,
      vaults: 0,
      imported: 0,
      errors: [formatGoogleSyncError(e)],
    };
  }
  const errors: string[] = [];
  const { data: rows, error } = await admin
    .from("google_calendar_connections")
    .select("vault_id, calendar_id, timezone");

  if (error) {
    return { ok: false, vaults: 0, imported: 0, errors: [error.message] };
  }
  if (!rows?.length) {
    return { ok: true, vaults: 0, imported: 0, errors: [] };
  }

  let imported = 0;
  for (const row of rows as Omit<ConnectionRow, "refresh_token">[]) {
    try {
      if (
        typeof opts?.localHourOnly === "number" &&
        localHourInTz(row.timezone) !== opts.localHourOnly
      ) {
        continue;
      }
      const { data: secret } = await admin
        .from("google_calendar_secrets")
        .select("refresh_token")
        .eq("vault_id", row.vault_id)
        .maybeSingle();
      if (!secret?.refresh_token) continue;

      const full: ConnectionRow = {
        ...row,
        refresh_token: secret.refresh_token,
      };
      const ymd = todayYmdInTz(row.timezone);
      const n = await syncOneVaultForDate(full, ymd);
      imported += n;
    } catch (e) {
      errors.push(
        `${row.vault_id}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  if (imported > 0) {
    revalidatePath("/field-notes");
  }

  return { ok: errors.length === 0, vaults: rows.length, imported, errors };
}

export async function syncOneVaultForDate(
  row: ConnectionRow,
  ymd: string,
): Promise<number> {
  const admin = supabaseAdmin();
  const redirectUri = await resolveCalendarOAuthRedirectUri();
  const oauth2 = getOAuthClient(redirectUri);
  oauth2.setCredentials({ refresh_token: row.refresh_token });
  const calendar = google.calendar({ version: "v3", auth: oauth2 });

  const { start, end } = localDayBoundsUtc(ymd, row.timezone);
  const listRes = await calendar.events.list({
    calendarId: row.calendar_id,
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });

  const events = listRes.data.items ?? [];
  const { data: vault } = await admin
    .from("vaults")
    .select("owner_id")
    .eq("id", row.vault_id)
    .maybeSingle();

  if (!vault?.owner_id) return 0;

  let count = 0;
  for (const event of events) {
    const eventId = event.id;
    if (!eventId) continue;

    const { data: existing } = await admin
      .from("calendar_drop_imports")
      .select("item_id")
      .eq("vault_id", row.vault_id)
      .eq("google_event_id", eventId)
      .eq("imported_for_date", ymd)
      .maybeSingle();

    if (existing) continue;

    const title = eventToTitle(event).slice(0, 200);

    const { data: item, error: itemErr } = await admin
      .from("items")
      .insert({
        vault_id: row.vault_id,
        user_id: vault.owner_id,
        box: "DROP",
        title,
        urgent: false,
        must: false,
        should: false,
        pinned: false,
      })
      .select("id")
      .single();

    if (itemErr || !item?.id) {
      throw new Error(itemErr?.message ?? "Couldn't create item");
    }

    const { error: capErr } = await admin.from("captures").insert({
      vault_id: row.vault_id,
      user_id: vault.owner_id,
      raw: title,
      source: "google_calendar",
      item_id: item.id,
    });

    if (capErr) {
      await admin.from("items").delete().eq("id", item.id);
      throw new Error(capErr.message);
    }

    const { error: impErr } = await admin.from("calendar_drop_imports").insert({
      vault_id: row.vault_id,
      google_event_id: eventId,
      imported_for_date: ymd,
      item_id: item.id,
    });

    if (impErr) {
      await admin.from("captures").delete().eq("item_id", item.id);
      await admin.from("items").delete().eq("id", item.id);
      throw new Error(impErr.message);
    }

    count += 1;
  }

  return count;
}
