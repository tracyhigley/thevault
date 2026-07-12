// Shared input primitives so every surface that takes input feels the
// same. Calm blueprint aesthetic — subtle borders at rest, brass on focus,
// monospace metadata, serif content.

import clsx from "clsx";

export function Field({
  label,
  hint,
  children,
  align = "row",
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  align?: "row" | "col";
}) {
  return (
    <label
      className={clsx(
        "flex gap-2",
        align === "col" ? "flex-col" : "items-center",
      )}
    >
      <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-mute">
        {label}
      </span>
      <span className={clsx(align === "col" && "block")}>{children}</span>
      {hint && (
        <span className="text-[11px] text-ink-mute/70">{hint}</span>
      )}
    </label>
  );
}

const inputBase =
  "rounded-sm border border-paper-line bg-paper-bg/60 px-2.5 py-1.5 text-ink outline-none transition focus:border-brass focus:bg-paper-bg/80";

export function TextInput({
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="text"
      className={clsx(inputBase, "text-[13px]", className)}
      {...rest}
    />
  );
}

export function NumberField({
  unit,
  width = "w-20",
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  unit?: string;
  width?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-baseline gap-1 rounded-sm border border-paper-line bg-paper-bg/60 px-2 py-1 transition focus-within:border-brass focus-within:bg-paper-bg/80",
        width,
        className,
      )}
    >
      <input
        type="number"
        className="min-w-0 flex-1 bg-transparent text-right font-mono text-[12px] text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
        {...rest}
      />
      {unit && (
        <span className="font-mono text-[10px] text-ink-mute/70">{unit}</span>
      )}
    </span>
  );
}

export function Select({
  className,
  children,
  tone = "brass",
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  tone?: "brass" | "rust" | "teal" | "ink";
}) {
  const toneClass =
    tone === "brass"
      ? "text-brass"
      : tone === "rust"
        ? "text-rust"
        : tone === "teal"
          ? "text-teal"
          : "text-ink";
  return (
    <select
      className={clsx(
        inputBase,
        "font-mono text-[11px] tracking-wider",
        toneClass,
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Card({
  className,
  children,
  accent,
}: {
  className?: string;
  children: React.ReactNode;
  accent?: "rust" | "teal" | "brass";
}) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-sm border bg-paper-panel/40 transition",
        accent === "rust" && "border-rust/30",
        accent === "teal" && "border-teal/30",
        accent === "brass" && "border-brass/30",
        !accent && "border-paper-line/60 hover:border-brass/30",
        className,
      )}
    >
      {accent && (
        <div
          className={clsx(
            "absolute left-0 top-0 bottom-0 w-[3px]",
            accent === "rust" && "bg-rust/70",
            accent === "teal" && "bg-teal/70",
            accent === "brass" && "bg-brass/70",
          )}
        />
      )}
      {children}
    </div>
  );
}

export function Pill({
  active,
  href,
  onClick,
  tone = "brass",
  children,
}: {
  active?: boolean;
  href?: string;
  onClick?: () => void;
  tone?: "brass" | "rust" | "teal" | "ink";
  children: React.ReactNode;
}) {
  const toneActive =
    tone === "brass"
      ? "border-brass bg-brass/10 text-brass"
      : tone === "rust"
        ? "border-rust bg-rust/10 text-rust"
        : tone === "teal"
          ? "border-teal bg-teal/10 text-teal"
          : "border-ink bg-ink/10 text-ink";
  const className = clsx(
    "rounded-sm border px-3 py-1 font-mono text-[10px] tracking-wider transition",
    active
      ? toneActive
      : "border-paper-line text-ink-mute hover:border-brass/40 hover:text-brass",
  );
  if (href) {
    // Caller passes a string href; the Drawer page already wraps these in <Link>.
    return (
      <a className={className} href={href}>
        {children}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={className} type="button">
      {children}
    </button>
  );
}
