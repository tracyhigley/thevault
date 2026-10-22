"use server";

// Saves a day's routine check-offs. The client sends the full list of
// checked keys for the day; an empty list removes the day's row so it
// counts as "not logged" and stays out of the averages.

import { revalidatePath } from "next/cache";
import { supabaseServer } from "./supabase/server";
import { ROUTINE_ITEMS } from "./routine";

const VALID_KEYS = new Set(ROUTINE_ITEMS.map((i) => i.key));

export async function saveRoutineDay(date: string, checked: string[]) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Bad date");
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: member } = await sb
    .from("vault_members")
    .select("vault_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const vaultId = member?.vault_id as string | undefined;
  if (!vaultId) throw new Error("No vault");

  const clean = Array.from(new Set(checked.filter((k) => VALID_KEYS.has(k))));

  if (clean.length === 0) {
    const { error } = await sb
      .from("routine_days")
      .delete()
      .eq("vault_id", vaultId)
      .eq("date", date);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await sb.from("routine_days").upsert(
      {
        vault_id: vaultId,
        date,
        checked: clean,
        modified_at: new Date().toISOString(),
      },
      { onConflict: "vault_id,date" },
    );
    if (error) throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/routine");
}
