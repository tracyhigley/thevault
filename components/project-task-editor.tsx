"use client";
// Per-project task checklist. Checking a task pulls it onto the Project
// Tasks page (grouped by building there). A task can also be marked done
// right here (same markProjectTaskDone action the Project Tasks page's DONE
// button uses) — it shows struck through either way, so finishing something
// is visible from both places. Deleting a task here is still how you clear
// it out for good.

import { useState, useTransition } from "react";
import { toast } from "sonner";
import clsx from "clsx";
import {
  addProjectTask,
  deleteProjectTask,
  markProjectTaskDone,
  reorderProjectTasks,
  setProjectTaskOnList,
  updateProjectTaskText,
} from "@/lib/plan-actions";
import type { ProjectTask } from "@/lib/project-phases";
import { SortableList, type SortableItem } from "@/components/sortable-list";

/** Inline-editable task text — same blend-in-until-focused pattern as
 * EditableText / EditableProjectTaskMinutes, but writes through
 * updateProjectTaskText (project.tasks jsonb) instead of an item field. */
function EditableTaskText({
  projectId,
  taskId,
  initial,
  className,
}: {
  projectId: string;
  taskId: string;
  initial: string;
  className?: string;
}) {
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();

  function commit() {
    const clean = value.trim();
    if (!clean) {
      setValue(initial);
      return;
    }
    if (clean === initial) {
      setValue(clean);
      return;
    }
    startTransition(async () => {
      try {
        await updateProjectTaskText(projectId, taskId, clean);
      } catch (e: any) {
        setValue(initial);
        toast.error(e?.message ?? "Couldn't update the task.");
      }
    });
  }

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setValue(initial);
      }}
      className={clsx(
        "bg-transparent outline-none focus:bg-paper-bg/40 focus:ring-brass/40 min-w-0 flex-1 rounded-sm px-1 focus:ring-1",
        pending && "opacity-50",
        className,
      )}
    />
  );
}

export function ProjectTaskEditor({
  projectId,
  initial,
}: {
  projectId: string;
  initial: ProjectTask[];
}) {
  const [tasks, setTasks] = useState<ProjectTask[]>(initial);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  function add() {
    const clean = text.trim();
    if (!clean) return;
    setText("");
    startTransition(async () => {
      try {
        const task = await addProjectTask(projectId, clean);
        setTasks((prev) => [...prev, task]);
      } catch (e: any) {
        setText(clean);
        toast.error(e?.message ?? "Couldn't add the task.");
      }
    });
  }

  function toggle(taskId: string, onTaskList: boolean) {
    const prev = tasks;
    setTasks((p) =>
      p.map((t) =>
        t.id === taskId
          ? { ...t, onTaskList, done: onTaskList ? false : t.done }
          : t,
      ),
    );
    startTransition(async () => {
      try {
        await setProjectTaskOnList(projectId, taskId, onTaskList);
      } catch (e: any) {
        setTasks(prev);
        toast.error(e?.message ?? "Couldn't update the task.");
      }
    });
  }

  function markDone(taskId: string) {
    const prev = tasks;
    setTasks((p) =>
      p.map((t) =>
        t.id === taskId ? { ...t, done: true, onTaskList: false } : t,
      ),
    );
    startTransition(async () => {
      try {
        await markProjectTaskDone(projectId, taskId);
      } catch (e: any) {
        setTasks(prev);
        toast.error(e?.message ?? "Couldn't mark the task done.");
      }
    });
  }

  function remove(taskId: string) {
    const prev = tasks;
    setTasks((p) => p.filter((t) => t.id !== taskId));
    startTransition(async () => {
      try {
        await deleteProjectTask(projectId, taskId);
      } catch (e: any) {
        setTasks(prev);
        toast.error(e?.message ?? "Couldn't remove the task.");
      }
    });
  }

  function reorder(next: SortableItem[]) {
    const nextIds = next.map((i) => i.id);
    const prev = tasks;
    setTasks((p) => {
      const byId = new Map(p.map((t) => [t.id, t]));
      return nextIds
        .map((id) => byId.get(id))
        .filter((t): t is ProjectTask => !!t);
    });
    startTransition(async () => {
      try {
        await reorderProjectTasks(projectId, nextIds);
      } catch (e: any) {
        setTasks(prev);
        toast.error(e?.message ?? "Couldn't reorder the tasks.");
      }
    });
  }

  const sortableItems: SortableItem[] = tasks.map((t) => ({
    id: t.id,
    content: (
      <div className="flex items-center gap-3 py-2 text-[13px]">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <input
            type="checkbox"
            checked={t.onTaskList}
            onChange={(e) => toggle(t.id, e.target.checked)}
            className="accent-brass shrink-0"
          />
          <EditableTaskText
            projectId={projectId}
            taskId={t.id}
            initial={t.text}
            className={
              t.done
                ? "text-ink-mute line-through"
                : t.onTaskList
                  ? "text-ink"
                  : "text-ink-dim"
            }
          />
        </div>
        {t.done ? (
          <span className="text-teal shrink-0 font-mono text-[9px] tracking-[0.14em]">
            ✓ DONE
          </span>
        ) : (
          <>
            {t.onTaskList && (
              <span className="text-brass shrink-0 font-mono text-[9px] tracking-[0.14em]">
                ON PROJECT TASKS
              </span>
            )}
            <button
              onClick={() => markDone(t.id)}
              disabled={pending}
              className="border-emerald-600/35 text-emerald-700 hover:bg-emerald-600/10 hover:text-emerald-800 shrink-0 rounded-sm border px-1.5 py-0.5 font-mono text-[9px] tracking-wider transition disabled:opacity-40"
            >
              DONE
            </button>
          </>
        )}
        <button
          onClick={() => remove(t.id)}
          aria-label="Remove task"
          className="text-ink-mute shrink-0 font-mono text-[11px] hover:text-red-400"
        >
          ✕
        </button>
      </div>
    ),
  }));

  return (
    <div>
      {tasks.length === 0 ? (
        <p className="text-ink-mute text-[13px]">
          No tasks yet. Add one, then check it to pull it onto Project Tasks.
        </p>
      ) : (
        <SortableList items={sortableItems} onReorder={reorder} />
      )}
      <div className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
          placeholder="Add a task…"
          className="border-paper-line bg-paper-bg/60 text-ink placeholder:text-ink-mute/60 focus:border-brass min-w-0 flex-1 rounded-sm border px-2 py-1.5 text-[13px] outline-none"
        />
        <button
          onClick={add}
          disabled={pending || !text.trim()}
          className="brass-button px-4 py-1.5 font-mono text-[10px] tracking-[0.2em] disabled:opacity-50"
        >
          ADD
        </button>
      </div>
    </div>
  );
}
