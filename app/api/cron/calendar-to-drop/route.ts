import { NextRequest, NextResponse } from "next/server";
import { syncAllCalendarsToFieldNotes } from "@/lib/google-calendar-sync";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!secret || auth !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Hobby plan allows one cron invocation per day (see vercel.json). Import
  // every connected blueprint on that run; each still uses its own timezone
  // to decide which calendar day is "today".
  const result = await syncAllCalendarsToFieldNotes();
  return NextResponse.json(result);
}
