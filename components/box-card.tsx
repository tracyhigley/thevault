import Link from "next/link";
import clsx from "clsx";

export type BoxCardProps = {
  title: string;
  meta?: string;
  count?: number | string;
  accent?: "brass" | "rust" | "teal";
  href?: string;
  /** When set, the card is a button (e.g. expand in place on the boxes hub). */
  onPress?: () => void;
  selected?: boolean;
  /** Tighter tile for the Boxes hub grid. */
  size?: "default" | "compact";
};

const ACCENT: Record<NonNullable<BoxCardProps["accent"]>, string> = {
  brass: "before:bg-brass/70",
  rust: "before:bg-rust/70",
  teal: "before:bg-teal/70",
};

// Calmer card: title + a small dim "X items" line (count always when provided).
export function BoxCard(p: BoxCardProps) {
  const compact = p.size === "compact";
  const shell = clsx(
    "group relative flex w-full flex-col justify-end rounded-sm border border-paper-line/60 bg-paper-panel/40 transition hover:border-brass/40 hover:bg-paper-panel/60",
    compact
      ? "min-h-[96px] min-w-0 p-3 sm:min-h-[100px]"
      : "h-[140px] p-4 sm:w-[240px]",
    compact
      ? "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[1.5px]"
      : "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[2px]",
    ACCENT[p.accent ?? "brass"],
    p.selected &&
      "border-brass/50 bg-paper-panel/70 ring-1 ring-brass/25 hover:border-brass/60",
  );

  const inner = (
    <>
      <h3
        className={clsx(
          "serif-h leading-tight text-ink",
          compact ? "min-w-0 truncate text-[17px] sm:text-[18px]" : "text-[22px]",
        )}
      >
        {p.title}
      </h3>
      <div
        className={clsx(
          "mt-1.5 flex items-baseline font-mono tracking-wider text-ink-mute",
          compact ? "text-[10px] sm:text-[11px]" : "mt-2 text-[10px]",
          p.meta ? "justify-between" : "justify-end",
        )}
      >
        {p.meta && <span>{p.meta.toLowerCase()}</span>}
        {p.count !== undefined && (
          <span>
            {p.count} item{Number(p.count) === 1 ? "" : "s"}
          </span>
        )}
      </div>
    </>
  );

  if (p.onPress) {
    return (
      <button
        type="button"
        onClick={p.onPress}
        aria-expanded={p.selected}
        className={clsx(shell, "cursor-pointer text-left")}
      >
        {inner}
      </button>
    );
  }

  const href = p.href;
  if (!href) {
    throw new Error("BoxCard requires `href` unless `onPress` is provided.");
  }

  return (
    <Link href={href} className={shell}>
      {inner}
    </Link>
  );
}
