"use client";

import { useState } from "react";
import Link from "next/link";
import { BoxCard } from "@/components/box-card";
import { BoxStorageList } from "@/components/box-storage-list";
import type { BoxKey, Item } from "@/lib/types";

export type VaultBoxTile = {
  key: string;
  label: string;
  count: number;
  slug: string;
};

const GRID =
  "grid w-full grid-cols-2 gap-2 justify-items-stretch sm:grid-cols-4";

function findTile(
  key: string | null,
  rows: (VaultBoxTile | null)[][],
  orphans: VaultBoxTile[],
): VaultBoxTile | undefined {
  if (!key) return undefined;
  for (const row of rows) {
    for (const c of row) {
      if (c?.key === key) return c;
    }
  }
  return orphans.find((b) => b.key === key);
}

function EmptySlot() {
  return (
    <div
      className="min-h-[96px] rounded-sm border border-transparent sm:min-h-[100px]"
      aria-hidden
    />
  );
}

function NewBoxLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-[96px] w-full min-w-0 flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-vault-line px-2 py-2 text-center text-ink-mute transition hover:border-brass/40 hover:text-brass sm:min-h-[100px]"
    >
      <span className="serif-h text-[16px] leading-tight sm:text-[17px]">{label}</span>
    </Link>
  );
}

export function VaultBoxesSection({
  rows,
  orphanTiles,
  itemsByBox,
  newBox,
}: {
  rows: (VaultBoxTile | null)[][];
  orphanTiles: VaultBoxTile[];
  itemsByBox: Record<string, Item[]>;
  newBox: { href: string; label: string };
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const open = findTile(openKey, rows, orphanTiles);

  const row0 = rows[0] ?? [];
  const row0Filled = row0.filter(Boolean).length;
  /** Fewer than three real tiles in row 1 → tuck "+ New box" into that row. */
  const newInFirstRow = row0Filled < 3;
  const showOrphanRow = orphanTiles.length > 0 || !newInFirstRow;

  return (
    <div className="mt-4 space-y-6">
      <div className="space-y-2.5">
        {/* Row 1 — fixed slots + optional + New box */}
        <div className={GRID}>
          {row0.map((cell, ci) =>
            cell ? (
              <BoxCard
                key={cell.key}
                title={cell.label}
                count={cell.count}
                selected={openKey === cell.key}
                onPress={() =>
                  setOpenKey((k) => (k === cell.key ? null : cell.key))
                }
                size="compact"
              />
            ) : (
              <EmptySlot key={`r0-${ci}`} />
            ),
          )}
          {newInFirstRow && (
            <NewBoxLink href={newBox.href} label={newBox.label} />
          )}
        </div>

        {rows.slice(1).map((row, ri) => (
          <div key={ri + 1} className={GRID}>
            {row.map((cell, ci) =>
              cell ? (
                <BoxCard
                  key={cell.key}
                  title={cell.label}
                  count={cell.count}
                  selected={openKey === cell.key}
                  onPress={() =>
                    setOpenKey((k) => (k === cell.key ? null : cell.key))
                  }
                  size="compact"
                />
              ) : (
                <EmptySlot key={`r${ri + 1}-${ci}`} />
              ),
            )}
          </div>
        ))}

        {showOrphanRow && (
          <div className={GRID}>
            {orphanTiles.map((b) => (
              <BoxCard
                key={b.key}
                title={b.label}
                count={b.count}
                selected={openKey === b.key}
                onPress={() =>
                  setOpenKey((k) => (k === b.key ? null : b.key))
                }
                size="compact"
              />
            ))}
            {!newInFirstRow && (
              <NewBoxLink href={newBox.href} label={newBox.label} />
            )}
          </div>
        )}
      </div>

      {open && (
        <section
          id="vault-box-panel"
          aria-label={`Items in ${open.label}`}
          className="rounded-sm border border-vault-line/80 bg-vault-panel/30 p-4 md:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-vault-line/50 pb-4">
            <div>
              <div className="eyebrow text-ink-mute">— In this box —</div>
              <h2 className="serif-h mt-1 text-[26px] leading-tight text-ink md:text-[30px]">
                {open.label}
              </h2>
              <p className="mt-1 font-mono text-[10px] text-ink-mute">
                {(itemsByBox[open.key] ?? []).length} item
                {(itemsByBox[open.key] ?? []).length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/boxes/${open.slug}`}
                className="rounded-sm border border-vault-line px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-ink-mute transition hover:border-brass/40 hover:text-brass"
              >
                Open full page
              </Link>
              <button
                type="button"
                onClick={() => setOpenKey(null)}
                className="rounded-sm border border-vault-line px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-ink-mute transition hover:border-brass/40 hover:text-brass"
              >
                Close
              </button>
            </div>
          </div>
          <div className="mt-4">
            <BoxStorageList
              boxKey={open.key as BoxKey}
              title={open.label}
              items={itemsByBox[open.key] ?? []}
            />
          </div>
        </section>
      )}
    </div>
  );
}
