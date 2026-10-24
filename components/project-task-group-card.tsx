"use client";
// One project's worth of Project Tasks rows, grouped under a single title
// header — replaces repeating the project title on every row when a
// project has more than one task pulled onto this page. Header carries the
// project title once; each task underneath is a slim row with just its own
// controls (minutes, done, delete). Checking a task on its Project Plan is
// what puts it on Today now, so there is no separate Today toggle here. The building itself is
// shown once, on the section heading these cards sit under (see
// ProjectTaskBuildingGroups) — not repeated per card.

import { useState } from "react";
import { EditableProjectTaskMinutes } from "./editable-project-task-minutes";
import { ProjectTaskDeleteButton } from "./project-task-delete-button";
import { ProjectTaskDoneButton } from "./project-task-done-button";
import { ProjectTaskUrgentFlag } from "./project-task-urgent-flag";
import clsx from "clsx";

type GroupTask = {
  taskId: string;
  text: string;
  minutes: number | null;
  urgent: boolean;
  onToday: boolean;
};

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
  const [urgent, setUrgent] = useState(task.urgent);
  if (hidden) return null;

  return (
    <div
      className={clsx(
        "flex min-w-0 items-center gap-3 py-2 pr-4",
        urgent ? "bg-amber-500/5 pl-3" : "pl-4",
      )}
    >
      {urgent ? (
        <div
          className="w-1 shrink-0 self-stretch rounded-sm bg-amber-500"
          aria-hidden
        />
      ) : null}
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
      <ProjectTaskUrgentFlag
        projectId={projectId}
        taskId={task.taskId}
        initial={task.urgent}
        onChange={setUrgent}
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
  tasks,
}: {
  projectId: string;
  projectTitle: string;
  tasks: GroupTask[];
}) {
  const [remainingIds, setRemainingIds] = useState(
    () => new Set(tasks.map((t) => t.taskId)),
  );

  if (remainingIds.size === 0) return null;

  return (
    <div className="border-paper-line/60 bg-paper-panel/40 overflow-hidden rounded-sm border">
      <div className="border-paper-line/60 border-b px-4 py-2">
        <span className="paper-task-title text-ink">{projectTitle}</span>
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
