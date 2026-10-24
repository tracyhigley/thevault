import { NextRequest, NextResponse } from "next/server";
import { syncAllCalendarsToFieldNotes } from "@/lib/google-calendar-sync";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendAllDue } from "@/lib/future-tasks-db";
import { getSiteUrlFromEnv } from "@/lib/site-url";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  if (!secret || auth !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Hobby plan allows one cron invocation per day (see vercel.json). Import
  // every connected blueprint on that run; each still uses its own timezone
  // to decide which calendar day is "today".
  const calendar = await syncAllCalendarsToFieldNotes();

  // Same morning run: today's Future Tasks go into Field Notes, plus one
  // Slack alert per blueprint. Runs even if the calendar import failed.
  let futureTasks;
  try {
    futureTasks = await sendAllDue(supabaseAdmin(), {
      siteUrl: getSiteUrlFromEnv(),
    });
  } catch (e) {
    futureTasks = {
      ok: false,
      sent: 0,
      errors: [e instanceof Error ? e.message : String(e)],
    };
  }
  return NextResponse.json({ ...calendar, futureTasks });
}
