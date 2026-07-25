"use server";

// Server Actions for the Master Project Plans — buildings config + projects.
// Kept separate from lib/actions.ts: the planning layer never touches
// items or the daily schedule.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { describeZodError } from "@/lib/zod-error";

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
  meta: z.string().max(120).optional().default(""),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export async function saveBuildingConfig(
  buildings: z.input<typeof BuildingConfig>[],
) {
  const { sb } = await requireUser();
  const vaultId = await currentVaultId();
  if (!vaultId) throw new Error("No vault");
  let parsed;
  try {
    parsed = buildings.map((b) => BuildingConfig.parse(b));
  } catch (e) {
    throw new Error(describeZodError(e) ?? "Invalid building settings.");
  }
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

// ─── Project tasks ───────────────────────────────────────────────────────────
// Lightweight checklist per project, stored the same way as `log`. A task's
// `onTaskList` flag decides whether it currently surfaces on the Project
// Tasks page. `done` is separate — set only via markProjectTaskDone (the
// Project Tasks page's DONE button), and shown struck through back on the
// project's checklist so finishing something there is visible here too.
// Deleting the task (deleteProjectTask) is still how you clear it for good.

function normalizeTasks(raw: unknown): {
  id: string;
  text: string;
  minutes: number | null;
  onTaskList: boolean;
  done: boolean;
  createdAt: string;
}[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (t: any) => t && typeof t.id === "string" && typeof t.text === "string",
    )
    .map((t: any) => ({
      id: t.id,
      text: t.text,
      minutes: typeof t.minutes === "number" ? t.minutes : null,
      onTaskList: !!t.onTaskList,
      done: !!t.done,
      createdAt:
        typeof t.createdAt === "string"
          ? t.createdAt
          : new Date().toISOString(),
    }));
}

export async function addProjectTask(projectId: string, text: string) {
  const { sb } = await requireUser();
  const clean = text.trim();
  if (!clean) throw new Error("Give the task a name first");
  const { data, error } = await sb
    .from("projects")
    .select("tasks")
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const tasks = normalizeTasks(data?.tasks);
  const task = {
    id: crypto.randomUUID(),
    text: clean,
    minutes: null,
    onTaskList: false,
    done: false,
    createdAt: new Date().toISOString(),
  };
  const { error: updateError } = await sb
    .from("projects")
    .update({ tasks: [...tasks, task], modified_at: new Date().toISOString() })
    .eq("id", projectId);
  if (updateError) throw new Error(updateError.message);
  revalidatePath("/project-plans", "layout");
  revalidatePath("/project-tasks");
  return task;
}

export async function setProjectTaskOnList(
  projectId: string,
  taskId: string,
  onTaskList: boolean,
) {
  const { sb } = await requireUser();
  const { data, error } = await sb
    .from("projects")
    .select("tasks")
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  // Checking a task back on means it's active again, not done.
  const tasks = normalizeTasks(data?.tasks).map((t) =>
    t.id === taskId
      ? { ...t, onTaskList, done: onTaskList ? false : t.done }
      : t,
  );
  const { error: updateError } = await sb
    .from("projects")
    .update({ tasks, modified_at: new Date().toISOString() })
    .eq("id", projectId);
  if (updateError) throw new Error(updateError.message);
  revalidatePath("/project-plans", "layout");
  revalidatePath("/project-tasks");
}

// Called from the DONE button on the Project Tasks page. Marks the task
// done (struck through on the project's checklist) and takes it off the
// Project Tasks page — the task itself isn't deleted.
export async function markProjectTaskDone(projectId: string, taskId: string) {
  const { sb } = await requireUser();
  const { data, error } = await sb
    .from("projects")
    .select("tasks")
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const tasks = normalizeTasks(data?.tasks).map((t) =>
    t.id === taskId ? { ...t, done: true, onTaskList: false } : t,
  );
  const { error: updateError } = await sb
    .from("projects")
    .update({ tasks, modified_at: new Date().toISOString() })
    .eq("id", projectId);
  if (updateError) throw new Error(updateError.message);
  // Finishing it here means it's done everywhere — clear out a linked
  // Today item too, rather than leaving a stale obligation behind.
  await sb
    .from("items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("source_project_id", projectId)
    .eq("source_task_id", taskId)
    .is("deleted_at", null);
  revalidatePath("/project-plans", "layout");
  revalidatePath("/project-tasks");
  revalidatePath("/");
  revalidatePath("/admin-tasks");
}

export async function deleteProjectTask(projectId: string, taskId: string) {
  const { sb } = await requireUser();
  const { data, error } = await sb
    .from("projects")
    .select("tasks")
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const tasks = normalizeTasks(data?.tasks).filter((t) => t.id !== taskId);
  const { error: updateError } = await sb
    .from("projects")
    .update({ tasks, modified_at: new Date().toISOString() })
    .eq("id", projectId);
  if (updateError) throw new Error(updateError.message);
  // The task is gone for good — don't leave an orphaned Today item pointing
  // at it.
  await sb
    .from("items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("source_project_id", projectId)
    .eq("source_task_id", taskId)
    .is("deleted_at", null);
  revalidatePath("/project-plans", "layout");
  revalidatePath("/project-tasks");
  revalidatePath("/");
  revalidatePath("/admin-tasks");
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

// ─── Project Tasks × Today (deliberate, narrow exception) ──────────────────
// Everything above is intentionally decoupled from items/today_order (see
// the file header). "Add to Today" on the Project Tasks page is the one
// place that bridges the two systems: it creates a real Item (so the task
// actually shows up on the Today docket, same mechanism as any Admin Tasks
// row) tagged with source_project_id/source_task_id so it can be toggled
// back off cleanly and can never be duplicated (see migration
// 0018_project_task_today_link).

export async function getProjectTaskTodayLinks(): Promise<
  Record<string, { itemId: string; onToday: boolean }>
> {
  const { sb } = await requireUser();
  const { data, error } = await sb
    .from("items")
    .select("id, source_task_id, today_order")
    .not("source_task_id", "is", null)
    .is("deleted_at", null);
  if (error) throw new Error(error.message);
  const map: Record<string, { itemId: string; onToday: boolean }> = {};
  for (const row of data ?? []) {
    if (!row.source_task_id) continue;
    map[row.source_task_id] = {
      itemId: row.id,
      onToday: row.today_order !== null,
    };
  }
  return map;
}

// Creates (or revives) the linked Today item for a project task and puts
// it on today's plan. Safe to call more than once — the unique index on
// (source_project_id, source_task_id) plus this existence check keep it
// from ever creating a second row.
export async function addProjectTaskToToday(
  projectId: string,
  taskId: string,
  text: string,
  minutes: number | null,
) {
  const { sb, user } = await requireUser();
  const vaultId = await currentVaultId();
  if (!vaultId) throw new Error("No vault");

  const { data: existing, error: existingError } = await sb
    .from("items")
    .select("id, today_order")
    .eq("source_project_id", projectId)
    .eq("source_task_id", taskId)
    .is("deleted_at", null)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);

  const { data: max } = await sb
    .from("items")
    .select("today_order")
    .not("today_order", "is", null)
    .order("today_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = Number(max?.today_order ?? 0) + 1;

  if (existing) {
    if (existing.today_order === null) {
      const { error } = await sb
        .from("items")
        .update({ today_order: nextOrder })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    }
  } else {
    const { error } = await sb.from("items").insert({
      vault_id: vaultId,
      user_id: user.id,
      box: "COUNTER",
      title: text,
      minutes,
      urgent: false,
      must: false,
      should: false,
      today_order: nextOrder,
      source_project_id: projectId,
      source_task_id: taskId,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/project-tasks");
  revalidatePath("/admin-tasks");
  revalidatePath("/build");
}

// Pulls a project task back off today's plan by removing its linked Item
// entirely (soft delete) — it was only ever created for this purpose, so
// there's nothing worth keeping once it's off Today. The task itself is
// untouched on the project's checklist.
export async function removeProjectTaskFromToday(
  projectId: string,
  taskId: string,
) {
  const { sb } = await requireUser();
  const { error } = await sb
    .from("items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("source_project_id", projectId)
    .eq("source_task_id", taskId)
    .is("deleted_at", null);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/project-tasks");
  revalidatePath("/admin-tasks");
  revalidatePath("/build");
}

// Edits a project task's minutes estimate from the Project Tasks page, and
// keeps a linked Today item (if any) in sync so the two never disagree.
export async function updateProjectTaskMinutes(
  projectId: string,
  taskId: string,
  minutes: number | null,
) {
  const { sb } = await requireUser();
  const { data, error } = await sb
    .from("projects")
    .select("tasks")
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const tasks = normalizeTasks(data?.tasks).map((t) =>
    t.id === taskId ? { ...t, minutes } : t,
  );
  const { error: updateError } = await sb
    .from("projects")
    .update({ tasks, modified_at: new Date().toISOString() })
    .eq("id", projectId);
  if (updateError) throw new Error(updateError.message);

  await sb
    .from("items")
    .update({ minutes })
    .eq("source_project_id", projectId)
    .eq("source_task_id", taskId)
    .is("deleted_at", null);

  revalidatePath("/project-tasks");
  revalidatePath("/");
  revalidatePath("/admin-tasks");
}
