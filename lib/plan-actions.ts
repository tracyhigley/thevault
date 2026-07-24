"use server";

// Server Actions for the Master Project Plans — buildings config + projects.
// Kept separate from lib/actions.ts: the planning layer never touches
// items or the daily schedule.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

async function requireUser() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { sb, user };
}

async function currentVaultId() {
  const { sb } = await requireUser();
  const { data } = await sb
    .from("vault_members")
    .select("vault_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.vault_id as string | undefined;
}

// ─── Buildings (settings.buildings) ─────────────────────────────────────────

const BuildingConfig = z.object({
  key: z.string().min(1).max(40),
  label: z.string().min(1).max(60),
  meta: z.string().max(60).optional().default(""),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function saveBuildingConfig(
  buildings: z.input<typeof BuildingConfig>[],
) {
  const { sb } = await requireUser();
  const vaultId = await currentVaultId();
  if (!vaultId) throw new Error("No vault");
  const parsed = buildings.map((b) => BuildingConfig.parse(b));
  await sb.from("settings").upsert({ vault_id: vaultId, buildings: parsed });
  revalidatePath("/project-plans", "layout");
  revalidatePath("/settings/buildings");
}

// ─── Projects ────────────────────────────────────────────────────────────────

const Phase = z.enum(["idea", "planning", "building", "complete"]);

export async function createProject(
  building: string,
  title: string,
  phase: z.input<typeof Phase> = "idea",
) {
  const { sb, user } = await requireUser();
  const vaultId = await currentVaultId();
  if (!vaultId) throw new Error("No vault");
  const cleanTitle = title.trim();
  if (!cleanTitle) throw new Error("Give it a name first");
  const { error } = await sb.from("projects").insert({
    vault_id: vaultId,
    user_id: user.id,
    building,
    title: cleanTitle,
    phase: Phase.parse(phase),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/project-plans", "layout");
}

// Turns a note (a long-form write-up sitting in Notes) into a real project.
// Always lands as an "idea" — the note's text becomes the project's sketch.
// The note itself is left alone; nothing is deleted here.
export async function createProjectFromNote(
  building: string,
  title: string,
  sketch: string,
) {
  const { sb, user } = await requireUser();
  const vaultId = await currentVaultId();
  if (!vaultId) throw new Error("No vault");
  const cleanTitle = title.trim();
  if (!cleanTitle) throw new Error("Give it a name first");
  const { data, error } = await sb
    .from("projects")
    .insert({
      vault_id: vaultId,
      user_id: user.id,
      building,
      title: cleanTitle,
      phase: "idea",
      sketch: sketch.trim() || null,
    })
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  revalidatePath("/project-plans", "layout");
  return data?.id as string | undefined;
}

const ProjectPatch = z.object({
  title: z.string().min(1).max(200).optional(),
  why: z.string().nullable().optional(),
  done_looks_like: z.string().nullable().optional(),
  sketch: z.string().nullable().optional(),
  systems: z.string().nullable().optional(),
  building: z.string().min(1).max(40).optional(),
});

export async function updateProjectPatch(
  id: string,
  patch: z.input<typeof ProjectPatch>,
) {
  const { sb } = await requireUser();
  const parsed = ProjectPatch.parse(patch);
  const { error } = await sb
    .from("projects")
    .update({ ...parsed, modified_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/project-plans", "layout");
}

export async function setProjectPhase(
  id: string,
  phase: z.input<typeof Phase>,
) {
  const { sb } = await requireUser();
  const parsed = Phase.parse(phase);
  const { error } = await sb
    .from("projects")
    .update({
      phase: parsed,
      completed_at: parsed === "complete" ? new Date().toISOString() : null,
      modified_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/project-plans", "layout");
}

// `date` comes from the client so log entries carry the user's local day,
// not the server's.
export async function addProjectLog(id: string, text: string, date: string) {
  const { sb } = await requireUser();
  const cleanText = text.trim();
  if (!cleanText) return;
  const cleanDate = /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? date
    : new Date().toISOString().slice(0, 10);
  const { data, error } = await sb
    .from("projects")
    .select("log")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const log = Array.isArray(data?.log) ? data.log : [];
  const { error: updateError } = await sb
    .from("projects")
    .update({
      log: [...log, { date: cleanDate, text: cleanText }],
      modified_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (updateError) throw new Error(updateError.message);
  revalidatePath("/project-plans", "layout");
}

// Soft delete — reversible from the DB, same as items.
export async function deleteProject(id: string) {
  const { sb } = await requireUser();
  const { error } = await sb
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/project-plans", "layout");
}
