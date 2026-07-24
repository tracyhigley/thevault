"use client";
// One task row on the Project Tasks page. Deliberately styled to match the
// Admin Tasks row (CounterRow): bordered card, same title treatment, same
// button language — just swapped in a building tag (since this page mixes
// tasks from every building) in place of Admin's editable area pill, and
// Project-Tasks-specific actions underneath.

import { useState } from "react";
import { EditableProjectTaskMinutes } from "./editable-project-task-minutes";
import { ProjectTaskTodayToggle } from "./project-task-today-toggle";
import { ProjectTaskDeleteButton } from "./project-task-delete-button";
import { ProjectTaskDoneButton } from "./project-task-done-button";

/** Static building tag — sizing matches Admin Tasks' AreaPill chip. */
function BuildingTag({ label, color }: { label: string; color?: string }) {
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

export function ProjectTaskRollupItem({
  projectId,
  taskId,
  text,
  minutes,
  buildingLabel,
  buildingColor,
  onToday,
}: {
  projectId: string;
  taskId: string;
  text: string;
  minutes: number | null;
  buildingLabel: string;
  buildingColor?: string;
  onToday: boolean;
}) {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  return (
    <div className="border-paper-line/60 bg-paper-panel/40 flex min-w-0 items-center gap-3 rounded-sm border px-3 py-2 transition">
      <BuildingTag label={buildingLabel} color={buildingColor} />
      <span className="paper-task-title text-ink min-w-0 flex-1 truncate">
        {text}
      </span>
      <span className="text-ink-mute flex shrink-0 items-baseline justify-end gap-1 font-mono text-[11px] whitespace-nowrap tabular-nums">
        <EditableProjectTaskMinutes
          projectId={projectId}
          taskId={taskId}
          initial={minutes}
        />
        <span>min</span>
      </span>
      <ProjectTaskTodayToggle
        projectId={projectId}
        taskId={taskId}
        text={text}
        minutes={minutes}
        on={onToday}
        size="sm"
      />
      <ProjectTaskDoneButton
        projectId={projectId}
        taskId={taskId}
        onHide={() => setHidden(true)}
        onFail={() => setHidden(false)}
      />
      <ProjectTaskDeleteButton
        projectId={projectId}
        taskId={taskId}
        onHide={() => setHidden(true)}
        onFail={() => setHidden(false)}
      />
    </div>
  );
}
