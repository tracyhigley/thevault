"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { parseTimeOnDate } from "@/lib/daily-plan";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";
import {
  DOCUMENT_FOLDERS,
  normalizeDocumentFolderKey,
} from "@/lib/document-folders";
import {
  getDocuments,
  RESERVED_BOX_KEYS,
  type DocumentType,
} from "@/lib/categories";

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

type DailyAnchorSpec = {
  tag: string;
  title: string;
  minutes: number;
  order: number;
  /** When true, locks scheduled_start at `start`. When false, only today_order is set. */
  pinned?: boolean;
  start?: Date;
};

async function upsertDailyAnchor(
  sb: Awaited<ReturnType<typeof supabaseServer>>,
  opts: {
    vaultId: string;
    userId: string;
    spec: DailyAnchorSpec;
  },
) {
  const { vaultId, userId, spec } = opts;
  const pinned = spec.pinned ?? true;
  const scheduledStart =
    pinned && spec.start ? spec.start.toISOString() : null;
  const scheduledEnd =
    pinned && spec.start
      ? new Date(spec.start.getTime() + spec.minutes * 60_000).toISOString()
      : null;

  const patch = {
    box: "COUNTER",
    title: spec.title,
    minutes: spec.minutes,
    today_order: spec.order,
    pinned,
    scheduled_start: scheduledStart,
    scheduled_end: scheduledEnd,
    urgent: false,
    must: false,
    should: false,
    area: null,
    category: null,
    state: "upcoming" as const,
    actual_start: null,
    actual_end: null,
    notes: spec.tag,
  };

  const { data: existing } = await sb
    .from("items")
    .select("id")
    .eq("vault_id", vaultId)
    .eq("notes", spec.tag)
    .is("deleted_at", null)
    .order("modified_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    await sb.from("items").update(patch).eq("id", existing.id);
    return;
  }

  await sb.from("items").insert({
    vault_id: vaultId,
    user_id: userId,
    ...patch,
  });
}

// ─── Day inputs ────────────────────────────────────────────────────────────

const DayInputsSchema = z.object({
  date: z.string(),
  hours_available: z.coerce.number().min(0).max(24),
  creative: z.coerce.number().int().min(1).max(5),
  prob_solv: z.coerce.number().int().min(1).max(5),
  tie_break: z.enum(["CREATIVE", "PROB-SOLV"]),
  end_of_day: z.string(),
});

export async function saveDayInputs(formData: FormData) {
  const { sb } = await requireUser();
  const vaultId = await currentVaultId();
  if (!vaultId) throw new Error("No vault");
  const parsed = DayInputsSchema.parse(Object.fromEntries(formData));
  await sb.from("day_inputs").upsert({ ...parsed, vault_id: vaultId });
  revalidatePath("/");
}

// Wizard partial save — only the fields you've answered so far. Used by the
// /build wizard so each step persists immediately.
const PartialDayInputs = z.object({
  date: z.string(),
  hours_available: z.coerce.number().min(0).max(24).optional(),
  creative: z.coerce.number().int().min(1).max(5).optional(),
  prob_solv: z.coerce.number().int().min(1).max(5).optional(),
  tie_break: z.enum(["CREATIVE", "PROB-SOLV"]).optional(),
  end_of_day: z.string().optional(),
  reference_now: z.string().optional(),
  reference_tz: z.string().optional(),
});

export async function saveDayInputsPartial(
  patch: z.input<typeof PartialDayInputs>,
) {
  const { sb, user } = await requireUser();
  const vaultId = await currentVaultId();
  if (!vaultId) throw new Error("No vault");
  const parsed = PartialDayInputs.parse(patch);

  const { data: existing } = await sb
    .from("day_inputs")
    .select(
      "hours_available, creative, prob_solv, tie_break, end_of_day",
    )
    .eq("vault_id", vaultId)
    .eq("date", parsed.date)
    .maybeSingle();
  // Rebuilding the day should always start from a clean "on today" slate,
  // regardless of whether a day_inputs row already exists.
  if (parsed.end_of_day !== undefined || parsed.hours_available !== undefined) {
    await sb
      .from("items")
      .update({ today_order: null })
      .eq("vault_id", vaultId)
      .not("today_order", "is", null);
  }

  const { data: settingsRow } = await sb
    .from("settings")
    .select("default_hours")
    .eq("vault_id", vaultId)
    .maybeSingle();
  const settingsHours = Number(settingsRow?.default_hours ?? 7);

  let hoursVal =
    parsed.hours_available ??
    (existing?.hours_available != null
      ? Number(existing.hours_available)
      : settingsHours);

  const mergedEnd =
    parsed.end_of_day !== undefined
      ? parsed.end_of_day.trim()
      : (existing?.end_of_day ?? "16:30");

  if (parsed.end_of_day !== undefined && parsed.hours_available === undefined) {
    try {
      const end = parseTimeOnDate(parsed.end_of_day.trim(), parsed.date);
      const nowRef =
        parsed.reference_now &&
        !Number.isNaN(Date.parse(parsed.reference_now))
          ? new Date(parsed.reference_now)
          : new Date();
      const ms = end.getTime() - nowRef.getTime();
      hoursVal = Math.min(24, Math.max(0, ms / (60 * 60 * 1000)));
      hoursVal = Math.round(hoursVal * 100) / 100;
    } catch {
      /* keep hoursVal */
    }
  }

  const merged = {
    vault_id: vaultId,
    date: parsed.date,
    hours_available: hoursVal,
    creative: Number(parsed.creative ?? existing?.creative ?? 3),
    prob_solv: Number(parsed.prob_solv ?? existing?.prob_solv ?? 3),
    tie_break:
      (parsed.tie_break ?? existing?.tie_break ?? "PROB-SOLV") as
        | "CREATIVE"
        | "PROB-SOLV",
    end_of_day: mergedEnd,
  };

  await sb.from("day_inputs").upsert(merged, {
    onConflict: "vault_id,date",
    ignoreDuplicates: false,
  });

  // Daily Anchors: Morning Workout always on Today (unpinned); Lunch pinned at
  // local noon. Run whenever step 1 is saved so rebuilding updates anchors.
  if (parsed.end_of_day !== undefined || parsed.hours_available !== undefined) {
    try {
      await upsertDailyAnchor(sb, {
        vaultId,
        userId: user.id,
        spec: {
          tag: "__daily_anchor__:morning-workout",
          title: "Morning Workout",
          minutes: 45,
          order: 1,
          pinned: false,
        },
      });
      const lunchStart =
        parsed.reference_tz && parsed.reference_tz.trim()
          ? fromZonedTime(
              parse(`${parsed.date} 12:00:00`, "yyyy-MM-dd HH:mm:ss", new Date()),
              parsed.reference_tz,
            )
          : parseTimeOnDate("12:00 PM", parsed.date);
      await upsertDailyAnchor(sb, {
        vaultId,
        userId: user.id,
        spec: {
          tag: "__daily_anchor__:lunch",
          title: "Lunch",
          minutes: 30,
          start: lunchStart,
          order: 2,
        },
      });
    } catch {
      // Keep day build resilient if time parsing fails.
    }
  }
  revalidatePath("/", "layout");
}

// ─── Items: state, flags, box, captures ────────────────────────────────────

export async function setItemState(
  itemId: string,
  state: "upcoming" | "active" | "done" | "skipped" | "overrun",
) {
  const { sb } = await requireUser();
  const patch: Record<string, unknown> = { state };
  if (state === "done") {
    const { data: cur } = await sb
      .from("items")
      .select("today_order")
      .eq("id", itemId)
      .maybeSingle();
    // Keep completed items on Today's plan, but move them to the bottom.
    if ((cur?.today_order ?? null) !== null) {
      const { data: max } = await sb
        .from("items")
        .select("today_order")
        .neq("id", itemId)
        .not("today_order", "is", null)
        .order("today_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      patch.today_order = (max?.today_order ?? 0) + 1;
    }
  }
  if (state === "skipped") {
    // Skipping removes the item from today's plan — Counter/ATM toggles should
    // no longer show it as selected for today.
    patch.today_order = null;
  }
  if (state === "active") patch.actual_start = new Date().toISOString();
  if (state === "done" || state === "skipped" || state === "overrun") {
    patch.actual_end = new Date().toISOString();
  }
  await sb.from("items").update(patch).eq("id", itemId);
  revalidatePath("/");
  revalidatePath("/counter");
  revalidatePath("/atm");
  revalidatePath("/build");
}

export async function toggleDone(itemId: string, currentlyDone: boolean) {
  await setItemState(itemId, currentlyDone ? "upcoming" : "done");
}

export async function setItemPinned(itemId: string, pinned: boolean) {
  const { sb } = await requireUser();
  await sb.from("items").update({ pinned }).eq("id", itemId);
  revalidatePath("/");
}

export async function moveItemToBox(itemId: string, box: string) {
  const { sb } = await requireUser();
  await sb.from("items").update({ box }).eq("id", itemId);
  revalidatePath("/");
  revalidatePath("/drop");
  revalidatePath("/counter");
  revalidatePath("/atm");
  revalidatePath("/vault");
}

export async function softDeleteItem(itemId: string) {
  const { sb } = await requireUser();
  await sb
    .from("items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", itemId);
  revalidatePath("/");
  revalidatePath("/atm");
  revalidatePath("/counter");
  revalidatePath("/drop");
  revalidatePath("/vault");
}

/** Permanently deletes rows that match Today’s “Done today” bucket: on today’s plan + state done. Ignores unrelated ids. */
export async function hardDeleteDoneTodayItems(itemIds: string[]) {
  const { sb } = await requireUser();
  if (!itemIds.length) return { ok: true as const, deleted: 0 };

  const { data: rows, error: selErr } = await sb
    .from("items")
    .select("id")
    .in("id", itemIds)
    .eq("state", "done")
    .not("today_order", "is", null)
    .is("deleted_at", null);

  if (selErr) throw new Error(selErr.message);

  const validIds = (rows ?? []).map((r: { id: string }) => r.id);
  if (!validIds.length) return { ok: true as const, deleted: 0 };

  const { error: delErr } = await sb.from("items").delete().in("id", validIds);

  if (delErr) throw new Error(delErr.message);

  revalidatePath("/");
  revalidatePath("/atm");
  revalidatePath("/counter");
  revalidatePath("/drop");
  revalidatePath("/vault");
  revalidatePath("/documents");
  return { ok: true as const, deleted: validIds.length };
}

/** Permanently removes the row (use sparingly; soft-delete is the default elsewhere). */
export async function hardDeleteItem(itemId: string) {
  const { sb } = await requireUser();
  await sb.from("items").delete().eq("id", itemId);
  revalidatePath("/");
  revalidatePath("/atm");
  revalidatePath("/counter");
  revalidatePath("/drop");
  revalidatePath("/vault");
  revalidatePath("/documents");
}

// Triage a Drop item. Destination is explicit — Till is for energy-matched
// pulls (carries energy + minutes), Drawer is for obligations (carries
// urgent/must/should flags + minutes). Box is the category and works on both.
const TriagePatch = z.object({
  box_key: z.string().min(1).max(40),
  dest: z.enum(["ATM", "COUNTER"]),
  minutes: z.coerce.number().min(0).max(1440).nullable().optional(),
  energy: z.string().max(40).nullable().optional(), // Till only
  urgent: z.coerce.boolean().optional(), // Drawer only
  must: z.coerce.boolean().optional(), // Drawer only
  should: z.coerce.boolean().optional(), // Drawer only
});

export async function triageDropItem(
  itemId: string,
  patch: z.input<typeof TriagePatch>,
) {
  const { sb } = await requireUser();
  const parsed = TriagePatch.parse(patch);
  const update: Record<string, unknown> = {
    box: parsed.dest,
    minutes: parsed.minutes ?? null,
  };
  if (parsed.dest === "COUNTER") {
    update.area = parsed.box_key;
    update.category = null;
    update.energy = null;
    update.urgent = parsed.urgent ?? false;
    update.must = parsed.must ?? false;
    update.should = parsed.should ?? false;
  } else {
    update.category = parsed.box_key;
    update.area = null;
    update.energy = parsed.energy ?? null;
    update.urgent = false;
    update.must = false;
    update.should = false;
  }
  await sb.from("items").update(update).eq("id", itemId);
  revalidatePath("/", "layout");
}

const ItemPatch = z.object({
  title: z.string().min(1).max(500).optional(),
  area: z.string().max(40).nullable().optional(),
  minutes: z.coerce.number().min(0).max(1440).nullable().optional(),
  urgent: z.coerce.boolean().optional(),
  must: z.coerce.boolean().optional(),
  should: z.coerce.boolean().optional(),
  energy: z.string().max(40).nullable().optional(),
  category: z.string().max(40).nullable().optional(),
  potential: z.coerce.number().int().min(1).max(5).nullable().optional(),
  person: z.string().max(40).nullable().optional(),
  tag: z.string().max(40).nullable().optional(),
  notes: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  today_order: z.coerce.number().int().nullable().optional(),
  pinned: z.coerce.boolean().optional(),
});

/**
 * Same as updateItem but returns errors for the client. Next.js strips thrown
 * error messages from Server Actions in production; returned strings are fine.
 */
export async function updateItemPatch(
  itemId: string,
  patch: z.input<typeof ItemPatch>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let parsed: z.infer<typeof ItemPatch>;
  try {
    parsed = ItemPatch.parse(patch);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Invalid update.";
    return { ok: false, error: msg };
  }
  const { sb } = await requireUser();
  const { error } = await sb.from("items").update(parsed).eq("id", itemId);
  if (error) {
    const code = (error as { code?: string }).code;
    const msg = error.message ?? "Couldn't save.";
    if (
      code === "42703" ||
      /column .*does not exist|could not find.*column|'should'/i.test(msg)
    ) {
      return {
        ok: false,
        error:
          'Database is missing the "should" column. In Supabase → SQL Editor run: alter table items add column if not exists should boolean not null default false;',
      };
    }
    return { ok: false, error: msg };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateItem(
  itemId: string,
  patch: z.input<typeof ItemPatch>,
) {
  const result = await updateItemPatch(itemId, patch);
  if (!result.ok) throw new Error(result.error);
}

export async function createItem(box: string, title: string, extras: z.input<typeof ItemPatch> = {}) {
  const { sb, user } = await requireUser();
  const vaultId = await currentVaultId();
  if (!vaultId) throw new Error("No vault");
  const parsed = ItemPatch.parse(extras);
  const { data } = await sb
    .from("items")
    .insert({
      vault_id: vaultId,
      user_id: user.id,
      box,
      title: title.trim(),
      urgent: parsed.urgent ?? false,
      must: parsed.must ?? false,
      should: parsed.should ?? false,
      pinned: parsed.pinned ?? false,
      ...parsed,
    })
    .select("id")
    .single();
  revalidatePath("/", "layout");
  revalidatePath("/vault");
  revalidatePath("/counter");
  revalidatePath("/atm");
  return data?.id;
}

export async function startItem(itemId: string) {
  await setItemState(itemId, "active");
}

// Reorder items by setting today_order to the array index.
export async function reorderItems(itemIds: string[]) {
  const { sb } = await requireUser();
  await Promise.all(
    itemIds.map((id, i) =>
      sb.from("items").update({ today_order: i + 1 }).eq("id", id),
    ),
  );
  revalidatePath("/", "layout");
}

// ATM list ordering inside a selected category panel.
export async function reorderAtmItems(itemIds: string[]) {
  const { sb } = await requireUser();
  await Promise.all(
    itemIds.map((id, i) =>
      sb.from("items").update({ atm_order: i + 1 }).eq("id", id).eq("box", "ATM"),
    ),
  );
  revalidatePath("/atm");
  revalidatePath("/build");
}

// Universal "on today's plan" toggle. Used by both ATM (Withdraw) and
// Counter (Today). today_order = rank across ALL items currently on
// today's plan; null = not on today.
export async function setTodayPlan(itemId: string, on: boolean) {
  const { sb } = await requireUser();
  if (on) {
    const [{ data: max }, { data: cur }] = await Promise.all([
      sb
        .from("items")
        .select("today_order")
        .not("today_order", "is", null)
        .order("today_order", { ascending: false })
        .limit(1)
        .maybeSingle(),
      sb.from("items").select("state").eq("id", itemId).maybeSingle(),
    ]);
    const next = (max?.today_order ?? 0) + 1;
    const patch: Record<string, unknown> = { today_order: next };
    if (cur?.state === "skipped") patch.state = "upcoming";
    await sb.from("items").update(patch).eq("id", itemId);
  } else {
    await sb.from("items").update({ today_order: null }).eq("id", itemId);
  }
  revalidatePath("/");
  revalidatePath("/atm");
  revalidatePath("/counter");
  revalidatePath("/build");
}

// Backwards-compat alias — Counter and the AtmPickButton both call this
// path. Same semantics; kept under the old name so the ATM "Withdraw"
// affordance keeps reading naturally.
export async function pickFromAtm(itemId: string, picked: boolean) {
  return setTodayPlan(itemId, picked);
}

const AtmBoxBudgetSchema = z.object({
  category: z.string().min(1).max(40),
  hours: z.coerce.number().min(0).max(24),
});

// Apply ATM picks in block order by selected boxes + hour budgets.
export async function applyAtmBoxBudgets(
  selections: z.input<typeof AtmBoxBudgetSchema>[],
) {
  const { sb } = await requireUser();
  const vaultId = await currentVaultId();
  if (!vaultId) throw new Error("No vault");

  const parsed = selections
    .map((s) => AtmBoxBudgetSchema.parse(s))
    .filter((s) => s.hours > 0);

  // Rebuild ATM picks from scratch for this step.
  await sb
    .from("items")
    .update({ today_order: null })
    .eq("vault_id", vaultId)
    .eq("box", "ATM")
    .not("today_order", "is", null);

  const { data: maxToday } = await sb
    .from("items")
    .select("today_order")
    .eq("vault_id", vaultId)
    .is("deleted_at", null)
    .not("today_order", "is", null)
    .order("today_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  // ATM picks are intentionally scheduled at the end of the day plan.
  let todayOrder = Number(maxToday?.today_order ?? 0);
  for (const sel of parsed) {
    let remaining = Math.round(sel.hours * 60);
    if (remaining <= 0) continue;

    const { data: rows, error } = await sb
      .from("items")
      .select("id, minutes")
      .eq("vault_id", vaultId)
      .eq("box", "ATM")
      .eq("category", sel.category)
      .is("deleted_at", null)
      .order("atm_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    for (const row of rows ?? []) {
      const minutes = Number(row.minutes ?? 0);
      if (minutes <= 0) continue;
      if (minutes > remaining) continue;
      todayOrder += 1;
      remaining -= minutes;
      const { error: pickErr } = await sb
        .from("items")
        .update({
          today_order: todayOrder,
          state: "upcoming",
          actual_start: null,
          actual_end: null,
        })
        .eq("id", row.id);
      if (pickErr) throw new Error(pickErr.message);
      if (remaining <= 0) break;
    }
  }

  revalidatePath("/");
  revalidatePath("/atm");
  revalidatePath("/build");
}

// Custom block on the Docket — creates a pinned, scheduled COUNTER item.
export async function addCustomBlock(opts: {
  title: string;
  minutes: number;
  startISO?: string;
}) {
  const { sb, user } = await requireUser();
  const vaultId = await currentVaultId();
  if (!vaultId) throw new Error("No vault");
  const start = opts.startISO ? new Date(opts.startISO) : null;
  const end = start
    ? new Date(start.getTime() + opts.minutes * 60_000)
    : null;
  await sb.from("items").insert({
    vault_id: vaultId,
    user_id: user.id,
    box: "COUNTER",
    title: opts.title.trim(),
    minutes: opts.minutes,
    urgent: false,
    must: true,
    should: false,
    pinned: !!start,
    scheduled_start: start?.toISOString() ?? null,
    scheduled_end: end?.toISOString() ?? null,
  });
  revalidatePath("/");
}

// Documents: write markdown body for the single document row in a document box.
export async function saveDocument(box: string, body: string, title?: string) {
  const { sb, user } = await requireUser();
  const vaultId = await currentVaultId();
  if (!vaultId) throw new Error("No vault");
  const { data: existing } = await sb
    .from("items")
    .select("id")
    .eq("box", box)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing) {
    await sb
      .from("items")
      .update({ body, ...(title ? { title } : {}) })
      .eq("id", existing.id);
  } else {
    await sb.from("items").insert({
      vault_id: vaultId,
      user_id: user.id,
      box,
      title: title ?? box,
      body,
      urgent: false,
      must: false,
      should: false,
      pinned: false,
    });
  }
  revalidatePath(`/documents`, "layout");
}

// Vault & box config.
export async function renameVault(name: string) {
  const { sb } = await requireUser();
  const vaultId = await currentVaultId();
  if (!vaultId) throw new Error("No vault");
  await sb.from("vaults").update({ name }).eq("id", vaultId);
  revalidatePath("/", "layout");
}

export async function createMyVault(name: string) {
  const { sb, user } = await requireUser();
  const { data: v, error } = await sb
    .from("vaults")
    .insert({ name: name.trim() || "The Vault", owner_id: user.id })
    .select("id")
    .single();
  if (error) throw error;
  await sb
    .from("vault_members")
    .insert({ vault_id: v.id, user_id: user.id, role: "owner" });
  revalidatePath("/", "layout");
  return v.id;
}

const BoxConfig = z.object({
  key: z.string().min(1).max(40),
  label: z.string().min(1).max(60),
  meta: z.string().max(40).optional().default(""),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function saveBoxConfig(boxes: z.input<typeof BoxConfig>[]) {
  const { sb } = await requireUser();
  const vaultId = await currentVaultId();
  if (!vaultId) throw new Error("No vault");
  const parsed = boxes.map((b) => BoxConfig.parse(b));
  await sb.from("settings").upsert({ vault_id: vaultId, boxes: parsed });
  revalidatePath("/", "layout");
}

const EnergyConfig = z.object({
  key: z
    .string()
    .min(1)
    .max(40)
    .transform((v) => v.toUpperCase().replace(/\s/g, "-")),
  label: z.string().min(1).max(60),
});

export async function saveEnergyConfig(
  energies: z.input<typeof EnergyConfig>[],
) {
  const { sb } = await requireUser();
  const vaultId = await currentVaultId();
  if (!vaultId) throw new Error("No vault");
  const parsed = energies.map((e) => EnergyConfig.parse(e));
  await sb.from("settings").upsert({ vault_id: vaultId, energies: parsed });
  revalidatePath("/", "layout");
}

const DocumentConfig = BoxConfig.extend({
  folder: z
    .enum([
      "health",
      "read-watch",
      "books",
      "misc",
      "ecom-ecoship",
      "friends-family",
      "home-garden",
      "stonewater-books",
      "leisure",
      "writing",
      "travel",
    ])
    .optional(),
});

export type DocumentKeyMigration = { from: string; to: string };

function isTrustedDocumentKeyMigration(
  from: string,
  to: string,
  prevKeys: Set<string>,
  nextKeys: Set<string>,
): boolean {
  if (!from || !to || from === to) return false;
  if (RESERVED_BOX_KEYS.has(from) || RESERVED_BOX_KEYS.has(to)) return false;
  if (!prevKeys.has(from) || nextKeys.has(from)) return false;
  if (!nextKeys.has(to)) return false;
  return true;
}

export async function saveDocumentConfig(
  documents: z.input<typeof DocumentConfig>[],
  keyMigrations?: DocumentKeyMigration[],
) {
  const { sb } = await requireUser();
  const vaultId = await currentVaultId();
  if (!vaultId) throw new Error("No vault");
  const prevDocs = await getDocuments();
  const prevKeys = new Set(prevDocs.map((d) => d.key));
  const parsed = documents.map((d) => {
    const row = DocumentConfig.parse(d);
    const folder = normalizeDocumentFolderKey(row.folder);
    return folder === row.folder ? row : { ...row, folder };
  });
  const nextKeys = new Set(parsed.map((d) => d.key));

  const { data: row } = await sb
    .from("settings")
    .select("*")
    .eq("vault_id", vaultId)
    .maybeSingle();
  const rowObj = row as Record<string, unknown> | null;
  const patch: Record<string, unknown> = { vault_id: vaultId };
  if (rowObj && "documents" in rowObj) {
    patch.documents = parsed;
  } else if (rowObj && "records" in rowObj) {
    patch.records = parsed;
  } else {
    patch.documents = parsed;
  }

  await sb.from("settings").upsert(patch);

  const seenFrom = new Set<string>();
  for (const m of keyMigrations ?? []) {
    if (!m || typeof m.from !== "string" || typeof m.to !== "string") continue;
    const from = m.from.trim();
    const to = m.to.trim();
    if (!isTrustedDocumentKeyMigration(from, to, prevKeys, nextKeys)) continue;
    if (seenFrom.has(from)) continue;
    seenFrom.add(from);

    const { error } = await sb
      .from("items")
      .update({ box: to })
      .eq("vault_id", vaultId)
      .eq("box", from)
      .is("deleted_at", null);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/", "layout");
  revalidatePath("/documents", "layout");
  revalidatePath("/settings/documents", "layout");
}

function deriveDocumentKeyFromLabel(label: string): string {
  return label
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_/-]/g, "")
    .slice(0, 40);
}

function nextUniqueDocumentKey(label: string, used: Set<string>): string {
  let base = deriveDocumentKeyFromLabel(label);
  if (!base || RESERVED_BOX_KEYS.has(base)) base = "DOCUMENT";
  let candidate = base;
  let n = 2;
  while (used.has(candidate)) {
    const tail = `_${n}`;
    candidate = (base.slice(0, Math.max(1, 40 - tail.length)) + tail).slice(
      0,
      40,
    );
    n++;
    if (n > 500) break;
  }
  return candidate;
}

const DOCUMENT_FOLDER_KEYS = new Set<string>(
  DOCUMENT_FOLDERS.map((f) => f.key),
);

/** Add one document category from the Documents hub (label + folder). */
export async function appendDocument(labelRaw: string, folderKey: string) {
  const label = labelRaw.trim();
  if (!label) throw new Error("Enter a name for the document.");
  if (!DOCUMENT_FOLDER_KEYS.has(folderKey)) {
    throw new Error("Choose a folder.");
  }

  const docs = await getDocuments();
  const used = new Set(docs.map((d) => d.key));
  const key = nextUniqueDocumentKey(label, used);

  const row: DocumentType = {
    key,
    label,
    meta: "reference",
    color: "#b5853a",
    folder: folderKey as DocumentType["folder"],
  };

  await saveDocumentConfig([...docs, row]);
}

// Capture token — generated, persisted on the settings row, surfaced in /settings.
export async function rotateCaptureToken() {
  const { sb } = await requireUser();
  const vaultId = await currentVaultId();
  if (!vaultId) throw new Error("No vault");
  const token =
    "vault_" +
    crypto.getRandomValues(new Uint8Array(24))
      .reduce((s, b) => s + b.toString(16).padStart(2, "0"), "");
  await sb
    .from("settings")
    .upsert({ vault_id: vaultId, capture_token: token });
  revalidatePath("/settings");
  return token;
}

// Sealed state — persisted on the settings row so the door stays shut on refresh.
export async function setSealed(sealed: boolean) {
  const { sb } = await requireUser();
  const vaultId = await currentVaultId();
  if (!vaultId) throw new Error("No vault");
  await sb.from("settings").upsert({ vault_id: vaultId, sealed });
  revalidatePath("/", "layout");
}

// ─── Capture (real session — used by /deposit Mail Slot) ───────────────────

export async function depositText(text: string, source: string = "mailslot") {
  const trimmed = text.trim();
  if (!trimmed) return;
  const { sb, user } = await requireUser();
  const vaultId = await currentVaultId();
  if (!vaultId) throw new Error("No vault");

  const { data: item, error: itemErr } = await sb
    .from("items")
    .insert({
      vault_id: vaultId,
      user_id: user.id,
      box: "DROP",
      title: trimmed.slice(0, 200),
      urgent: false,
      must: false,
      should: false,
      pinned: false,
    })
    .select("id")
    .single();

  if (itemErr) throw new Error(itemErr.message);
  if (!item?.id) throw new Error("Couldn't create item.");

  const { error: capErr } = await sb.from("captures").insert({
    vault_id: vaultId,
    user_id: user.id,
    raw: trimmed,
    source,
    item_id: item.id,
  });
  if (capErr) throw new Error(capErr.message);
  revalidatePath("/drop");
}

// ─── Settings ─────────────────────────────────────────────────────────────

const SettingsSchema = z.object({
  stressor_anchor_minutes: z.coerce.number().int().min(0).max(480),
  default_end_of_day: z.string(),
  default_hours: z.coerce.number().min(0).max(24),
});

export async function saveSettings(formData: FormData) {
  const { sb } = await requireUser();
  const vaultId = await currentVaultId();
  if (!vaultId) throw new Error("No vault");
  const raw = Object.fromEntries(formData);
  const parsed = SettingsSchema.parse(raw);
  await sb.from("settings").upsert({ ...parsed, vault_id: vaultId });
  revalidatePath("/settings");
}

// ─── Vault members (invite / role / remove) ────────────────────────────────

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["owner", "editor"]).default("editor"),
});

export async function inviteMember(formData: FormData) {
  const { user } = await requireUser();
  const vaultId = await currentVaultId();
  if (!vaultId) throw new Error("No vault");

  const parsed = InviteSchema.parse(Object.fromEntries(formData));
  const admin = supabaseAdmin();

  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list?.users.find(
    (u: any) => u.email?.toLowerCase() === parsed.email.toLowerCase(),
  );

  let invitedUserId: string | null = existing?.id ?? null;
  if (!invitedUserId) {
    const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(
      parsed.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002"}/auth/callback`,
      },
    );
    if (error) throw error;
    invitedUserId = invited.user.id;
  }

  await admin.from("vault_members").upsert({
    vault_id: vaultId,
    user_id: invitedUserId,
    role: parsed.role,
  });
  void user;
  revalidatePath("/settings/members");
}

export async function setMemberRole(
  memberUserId: string,
  role: "owner" | "editor",
) {
  const vaultId = await currentVaultId();
  if (!vaultId) throw new Error("No vault");
  const admin = supabaseAdmin();
  await admin
    .from("vault_members")
    .update({ role })
    .eq("vault_id", vaultId)
    .eq("user_id", memberUserId);
  revalidatePath("/settings/members");
}

export async function removeMember(memberUserId: string) {
  const vaultId = await currentVaultId();
  if (!vaultId) throw new Error("No vault");
  const admin = supabaseAdmin();
  await admin
    .from("vault_members")
    .delete()
    .eq("vault_id", vaultId)
    .eq("user_id", memberUserId);
  revalidatePath("/settings/members");
}

void redirect;
