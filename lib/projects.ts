// Master Project Plans read-side helpers. Projects are long-horizon "building
// projects" — separate from items, deliberately outside the daily engine.

import { supabaseServer } from "./supabase/server";
import type {
  ProjectPhase,
  ProjectLogEntry,
  ProjectTask,
} from "./project-phases";

export { PHASES, phaseLabel } from "./project-phases";
export type {
  ProjectPhase,
  ProjectLogEntry,
  ProjectTask,
} from "./project-phases";

export type Project = {
  id: string;
  building: string; // building key from settings.buildings
  title: string;
  phase: ProjectPhase;
  why: string | null;
  doneLooksLike: string | null;
  sketch: string | null;
  systems: string | null;
  log: ProjectLogEntry[];
  tasks: ProjectTask[];
  completedAt: string | null;
  createdAt: string;
  modifiedAt: string;
};

function envReady() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

function normalizeLog(raw: unknown): ProjectLogEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (e: any) => e && typeof e.date === "string" && typeof e.text === "string",
    )
    .map((e: any) => ({ date: e.date, text: e.text }));
}

function normalizeTasks(raw: unknown): ProjectTask[] {
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

function rowToProject(r: any): Project {
  return {
    id: r.id,
    building: r.building,
    title: r.title,
    phase: r.phase,
    why: r.why,
    doneLooksLike: r.done_looks_like,
    sketch: r.sketch,
    systems: r.systems,
    log: normalizeLog(r.log),
    tasks: normalizeTasks(r.tasks),
    completedAt: r.completed_at,
    createdAt: r.created_at,
    modifiedAt: r.modified_at,
  };
}

export async function getProjects(): Promise<Project[]> {
  if (!envReady()) return [];
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("projects")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) {
    console.warn("getProjects error", error.message);
    return [];
  }
  return (data ?? []).map(rowToProject);
}

export async function getProjectsByBuilding(
  building: string,
): Promise<Project[]> {
  if (!envReady()) return [];
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("projects")
    .select("*")
    .eq("building", building)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) {
    console.warn("getProjectsByBuilding error", error.message);
    return [];
  }
  return (data ?? []).map(rowToProject);
}

export async function getProject(id: string): Promise<Project | null> {
  if (!envReady()) return null;
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("projects")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) return null;
  return rowToProject(data);
}
