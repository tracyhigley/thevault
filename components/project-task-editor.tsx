"use client";
// Per-project task checklist. Checking a task pulls it onto the Project
// Tasks page (grouped by building there). Marking a task done happens over
// there (the DONE button) — it shows up here as struck through, so
// finishing something is visible from the project too. Deleting a task
// here is still how you clear it out for good.

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addProjectTask,
  deleteProjectTask,
  setProjectTaskOnList,
} from "@/lib/plan-actions";
import type { ProjectTask } from "@/lib/project-phases";

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

  return (
    <div>
      {tasks.length === 0 ? (
        <p className="text-ink-mute text-[13px]">
          No tasks yet. Add one, then check it to pull it onto Project Tasks.
        </p>
      ) : (
        <div className="divide-paper-line/50 divide-y">
          {tasks.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 py-2 text-[13px]"
            >
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
                t.onTaskList && (
                  <span className="text-brass shrink-0 font-mono text-[9px] tracking-[0.14em]">
                    ON PROJECT TASKS
                  </span>
                )
              )}
              <button
                onClick={() => remove(t.id)}
                aria-label="Remove task"
                className="text-ink-mute shrink-0 font-mono text-[11px] hover:text-red-400"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
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
