// Static, read-only building chip — sizing matches Maint Tasks' AreaPill.
// Used wherever a row's building is shown but not editable from that row
// (e.g. Project Tasks rows, where the building lives on the project, not
// the task).

export function BuildingTag({
  label,
  color,
}: {
  label: string;
  color?: string;
}) {
  return (
    <span
      title={label}
      className="border-brass/40 bg-paper-bg/20 text-ink-mute flex h-7 w-[9.25rem] shrink-0 items-center gap-1.5 rounded-sm border px-1.5 py-0.5 font-mono text-[9px] leading-tight tracking-wide uppercase"
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: color ?? "#b5853a" }}
        aria-hidden
      />
      <span className="truncate">{label}</span>
    </span>
  );
}
