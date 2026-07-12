import { supabaseServer } from "./supabase/server";

export type BlueprintMembership = {
  vaultId: string;
  name: string;
  role: "owner" | "editor";
};

export async function getCurrentBlueprintId(): Promise<string | null> {
  const sb = await supabaseServer();
  const { data } = await sb
    .from("vault_members")
    .select("vault_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.vault_id ?? null;
}

export async function getMyBlueprints(): Promise<BlueprintMembership[]> {
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("vault_members")
    .select("role, vault:vaults(id, name)")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data
    .filter((r: any) => r.vault)
    .map((r: any) => ({
      vaultId: r.vault.id,
      name: r.vault.name,
      role: r.role,
    }));
}
