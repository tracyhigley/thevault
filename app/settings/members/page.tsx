import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";
import { inviteMember, renameVault } from "@/lib/actions";
import { getCurrentVault } from "@/lib/data";
import { RoleControl } from "@/components/role-control";
import { RemoveMemberButton } from "@/components/remove-member-button";
import { SettingsSubnav } from "@/components/settings-subnav";

export default async function MembersPage() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  // Find current vault.
  const { data: membership } = await sb
    .from("vault_members")
    .select("vault_id, role")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const vaultId = membership?.vault_id as string | undefined;
  const myRole = (membership?.role ?? "editor") as "owner" | "editor";

  // Pull all members (with auth lookup via admin client to get emails).
  let rows: { user_id: string; email: string; role: "owner" | "editor" }[] = [];
  if (vaultId) {
    const { data: members } = await sb
      .from("vault_members")
      .select("user_id, role")
      .eq("vault_id", vaultId);
    if (members?.length) {
      const admin = supabaseAdmin();
      const { data: list } = await admin.auth.admin.listUsers();
      const emailById = new Map<string, string>(
        (list?.users ?? []).map((u: any) => [u.id, u.email ?? "—"]),
      );
      rows = members.map((m: any) => ({
        user_id: m.user_id as string,
        email: emailById.get(m.user_id) ?? "—",
        role: m.role as "owner" | "editor",
      }));
    }
  }

  const vault = await getCurrentVault();

  return (
    <div className="mx-auto max-w-[800px] px-6 py-8 md:px-10">
      <div className="eyebrow">— Members —</div>
      <h1 className="serif-h mt-2 text-[36px] leading-tight md:text-[40px]">
        Who can open this vault.
      </h1>

      <div className="mt-3">
        <SettingsSubnav />
      </div>

      {vault && myRole === "owner" && (
        <form
          action={async (fd) => {
            "use server";
            await renameVault((fd.get("name") as string) ?? vault.name);
          }}
          className="mt-6 flex flex-wrap items-center gap-3 rounded-sm border border-vault-line bg-vault-panel/40 px-4 py-3"
        >
          <span className="eyebrow">Vault name</span>
          <input
            name="name"
            defaultValue={vault.name}
            className="flex-1 min-w-[200px] rounded-sm border border-vault-line bg-vault-bg/60 px-3 py-1.5 text-ink outline-none focus:border-brass"
          />
          <button
            type="submit"
            className="rounded-sm border border-brass/40 px-3 py-1.5 font-mono text-[10px] tracking-wider text-brass hover:bg-brass/10"
          >
            RENAME
          </button>
        </form>
      )}

      <div className="mt-8 divide-y divide-vault-line rounded-sm border border-vault-line bg-vault-panel/40">
        {rows.map((m) => (
          <div
            key={m.user_id}
            className="flex items-center justify-between gap-6 px-4 py-3"
          >
            <div>
              <div className="text-ink">{m.email}</div>
              <div className="font-mono text-[10px] text-ink-mute">
                {m.user_id.slice(0, 8)}…
              </div>
            </div>
            <div className="flex items-center gap-3">
              {myRole === "owner" && m.user_id !== user?.id ? (
                <RoleControl userId={m.user_id} role={m.role} />
              ) : (
                <span className="font-mono text-[10px] tracking-wider text-brass">
                  {m.role.toUpperCase()}
                </span>
              )}
              {myRole === "owner" && m.user_id !== user?.id && (
                <RemoveMemberButton userId={m.user_id} email={m.email} />
              )}
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="px-4 py-6 text-center text-ink-mute">
            No members yet.
          </div>
        )}
      </div>

      {myRole === "owner" && (
        <section className="mt-10">
          <h2 className="eyebrow">— Invite —</h2>
          <form action={inviteMember} className="mt-3 flex gap-2">
            <input
              type="email"
              name="email"
              required
              placeholder="email@example.com"
              className="flex-1 rounded-sm border border-vault-line bg-vault-panel/60 px-3 py-2 outline-none focus:border-brass"
            />
            <select
              name="role"
              defaultValue="editor"
              className="rounded-sm border border-vault-line bg-vault-panel/60 px-3 py-2"
            >
              <option className="bg-vault-bg" value="editor">
                Editor
              </option>
              <option className="bg-vault-bg" value="owner">
                Owner
              </option>
            </select>
            <button
              type="submit"
              className="brass-button px-4 py-2 font-mono text-[10px] tracking-[0.24em]"
            >
              SEND INVITE
            </button>
          </form>
          <p className="mt-2 text-[11px] text-ink-mute">
            They&rsquo;ll get a magic-link email and land on the Docket once they sign in.
          </p>
        </section>
      )}
    </div>
  );
}

