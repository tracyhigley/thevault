"use client";
// Per-project task checklist. Checking a task pulls it onto the Project
// Tasks page (grouped by building there). A task can also be marked done
// right here (same markProjectTaskDone action the Project Tasks page's DONE
// button uses) — it shows struck through either way, so finishing something
// is visible from both places. Deleting a task here is still how you clear
// it out for good.

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addProjectTask,
  deleteProjectTask,
  markProjectTaskDone,
  reorderProjectTasks,
  setProjectTaskOnList,
} from "@/lib/plan-actions";
import type { ProjectTask } from "@/lib/project-phases";
import { SortableList, type SortableItem } from "@/components/sortable-list";

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
        <label className="flex flex-1 cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={t.onTaskList}
            onChange={(e) => toggle(t.id, e.target.checked)}
            className="accent-brass"
          />
          <span
            className={
              t.done
                ? "text-ink-mute line-through"
                : t.onTaskList
                  ? "text-ink"
                  : "text-ink-dim"
            }
          >
            {t.text}
          </span>
        </label>
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
