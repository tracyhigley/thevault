"use client";
// One project's worth of Project Tasks rows, grouped under a single title
// header — replaces repeating the project title on every row when a
// project has more than one task pulled onto this page. Header carries the
// project title + building tag once; each task underneath is a slim row
// with just its own controls (minutes, today toggle, done, delete).

import { useState } from "react";
import { EditableProjectTaskMinutes } from "./editable-project-task-minutes";
import { ProjectTaskTodayToggle } from "./project-task-today-toggle";
import { ProjectTaskDeleteButton } from "./project-task-delete-button";
import { ProjectTaskDoneButton } from "./project-task-done-button";

type GroupTask = {
  taskId: string;
  text: string;
  minutes: number | null;
  onToday: boolean;
};

/** Static building tag — sizing matches Maint Tasks' AreaPill chip. */
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

function GroupTaskRow({
  projectId,
  task,
  onHide,
}: {
  projectId: string;
  task: GroupTask;
  onHide: () => void;
}) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  return (
    <div className="flex min-w-0 items-center gap-3 px-4 py-2">
      <span className="text-ink-dim min-w-0 flex-1 text-[13px] leading-snug">
        {task.text}
      </span>
      <span className="text-ink-mute flex shrink-0 items-baseline justify-end gap-1 font-mono text-[11px] whitespace-nowrap tabular-nums">
        <EditableProjectTaskMinutes
          projectId={projectId}
          taskId={task.taskId}
          initial={task.minutes}
        />
        <span>min</span>
      </span>
      <ProjectTaskTodayToggle
        projectId={projectId}
        taskId={task.taskId}
        text={task.text}
        minutes={task.minutes}
        on={task.onToday}
        size="sm"
      />
      <ProjectTaskDoneButton
        projectId={projectId}
        taskId={task.taskId}
        onHide={() => {
          setHidden(true);
          onHide();
        }}
        onFail={() => setHidden(false)}
      />
      <ProjectTaskDeleteButton
        projectId={projectId}
        taskId={task.taskId}
        onHide={() => {
          setHidden(true);
          onHide();
        }}
        onFail={() => setHidden(false)}
      />
    </div>
  );
}

export function ProjectTaskGroupCard({
  projectId,
  projectTitle,
  buildingLabel,
  buildingColor,
  tasks,
}: {
  projectId: string;
  projectTitle: string;
  buildingLabel: string;
  buildingColor?: string;
  tasks: GroupTask[];
}) {
  const [remainingIds, setRemainingIds] = useState(
    () => new Set(tasks.map((t) => t.taskId)),
  );

  if (remainingIds.size === 0) return null;

  return (
    <div className="border-paper-line/60 bg-paper-panel/40 overflow-hidden rounded-sm border">
      <div className="border-paper-line/60 flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
        <span className="paper-task-title text-ink">{projectTitle}</span>
        <BuildingTag label={buildingLabel} color={buildingColor} />
      </div>
      <div className="divide-paper-line/40 divide-y">
        {tasks.map((t) =>
          remainingIds.has(t.taskId) ? (
            <GroupTaskRow
              key={t.taskId}
              projectId={projectId}
              task={t}
              onHide={() =>
                setRemainingIds((prev) => {
                  const next = new Set(prev);
                  next.delete(t.taskId);
                  return next;
                })
              }
            />
          ) : null,
        )}
      </div>
    </div>
  );
}
