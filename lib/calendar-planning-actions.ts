"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { sundayOfYmd } from "@/lib/calendar-planning";
import {
  DAY_NOTE_MAX,
  isEmptyDayPlan,
  normalizeDayPlan,
} from "@/lib/calendar-day-plan";

async function requireUserAndVault() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: membership } = await sb
    .from("vault_members")
    .select("vault_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!membership?.vault_id) throw new Error("No vault");
  return { sb, vaultId: membership.vault_id as string };
}

const YmdSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const NoteSchema = z.string().max(2000).nullable();
const DayPlanSchema = z.object({
  boxKey: z.string().max(64).nullable(),
  projectId: z.string().uuid().nullable(),
  note: z.string().max(DAY_NOTE_MAX).nullable(),
});

// Drop a week row that has nothing left on it (no note) so we don't
// accumulate ghost rows. Weeks only carry a note now; the old week-level
// building (box_key) is no longer read.
async function cleanupEmptyWeek(
  sb: Awaited<ReturnType<typeof supabaseServer>>,
  vaultId: string,
  weekStart: string,
) {
  const { data: row } = await sb
    .from("calendar_week_assignments")
    .select("note")
    .eq("vault_id", vaultId)
    .eq("week_start", weekStart)
    .maybeSingle();
  if (!row) return;
  const hasNote = typeof row.note === "string" && row.note.length > 0;
  if (!hasNote) {
    await sb
      .from("calendar_week_assignments")
      .delete()
      .eq("vault_id", vaultId)
      .eq("week_start", weekStart);
  }
}

// Set (or clear) the note for a week. Pass note = null or "" to clear.
export async function setWeekNote(weekStart: string, note: string | null) {
  const ws = YmdSchema.parse(weekStart);
  const n = NoteSchema.parse(note);
  const normalized = sundayOfYmd(ws);
  const trimmed = n?.trim() ?? "";
  const { sb, vaultId } = await requireUserAndVault();

  const { error } = await sb.from("calendar_week_assignments").upsert(
    {
      vault_id: vaultId,
      week_start: normalized,
      note: trimmed === "" ? null : trimmed,
      modified_at: new Date().toISOString(),
    },
    { onConflict: "vault_id,week_start", ignoreDuplicates: false },
  );
  if (error) throw new Error(error.message);

  if (trimmed === "") await cleanupEmptyWeek(sb, vaultId, normalized);

  revalidatePath("/calendar");
}

// Save everything about one day in a single write: its building, an optional
// project inside that building, and optional typed text alongside it. A day
// with nothing left on it has its row removed.
export async function setDayPlan(
  date: string,
  plan: { boxKey: string | null; projectId: string | null; note: string | null },
) {
  const d = YmdSchema.parse(date);
  const parsed = DayPlanSchema.parse(plan);
  const next = normalizeDayPlan(parsed);
  const { sb, vaultId } = await requireUserAndVault();

  if (isEmptyDayPlan(next)) {
    const { error } = await sb
      .from("calendar_day_overrides")
      .delete()
      .eq("vault_id", vaultId)
      .eq("date", d);
    if (error) throw new Error(error.message);
    revalidatePath("/calendar");
    return;
  }

  // A project has to actually live in the building it's filed under.
  if (next.projectId) {
    const { data: proj } = await sb
      .from("projects")
      .select("id, building")
      .eq("id", next.projectId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!proj || proj.building !== next.boxKey) {
      throw new Error("That project isn't in this building.");
    }
  }

  const { error } = await sb.from("calendar_day_overrides").upsert(
    {
      vault_id: vaultId,
      date: d,
      box_key: next.boxKey,
      project_id: next.projectId,
      note: next.note,
      modified_at: new Date().toISOString(),
    },
    { onConflict: "vault_id,date", ignoreDuplicates: false },
  );
  if (error) throw new Error(error.message);

  revalidatePath("/calendar");
}
