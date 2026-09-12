"use client";
// One building's block within one day's row on the This Week page. Color-
// coded to that building throughout (left border, dot, labels use its
// settings.buildings color). If the building has projects under
// construction, a dropdown picks which one to feature that day — pick one
// and its PROJECT / TASKS card shows underneath (every task checked onto
// the Project Tasks page, not just the first one). If it has none, the
// building's open Maint Tasks show instead (Tracy's explicit fallback).
// Separately, on the first day of the week this building is scheduled at
// all, its Maint Tasks also show underneath the featured project, so open
// chores don't quietly wait behind a whole week of "under construction."

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveWeekDayProject } from "@/lib/plan-actions";
import type { DayKey } from "@/lib/week-days";

type ProjectTaskSummary = {
  id: string;
  text: string;
};

type UnderConstructionProject = {
  id: string;
  title: string;
  tasks: ProjectTaskSummary[];
};

type MaintTask = {
  id: string;
  title: string;
  minutes: number | null;
};

function MaintTaskList({ tasks }: { tasks: MaintTask[] }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {tasks.map((t) => (
        <li key={t.id} className="text-[15px] text-ink-dim">
          • {t.title}
          {t.minutes ? (
            <span className="ml-1.5 text-[13px] text-ink-mute">
              ({t.minutes}m)
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function WeekDayBuildingBlock({
  day,
  buildingKey,
  buildingLabel,
  buildingColor,
  underConstruction,
  maintTasks,
  initialProjectId,
  isFirstScheduledDay,
}: {
  day: DayKey;
  buildingKey: string;
  buildingLabel: string;
  buildingColor?: string;
  underConstruction: UnderConstructionProject[];
  maintTasks: MaintTask[];
  initialProjectId: string | null;
  /** True on the first day this week that this building is scheduled at
   * all — the one day its Maint Tasks show alongside a featured project. */
  isFirstScheduledDay?: boolean;
}) {
  const [projectId, setProjectId] = useState<string>(initialProjectId ?? "");
  const [pending, startTransition] = useTransition();

  function onChange(next: string) {
    const prev = projectId;
    setProjectId(next);
    startTransition(async () => {
      try {
        await saveWeekDayProject(day, buildingKey, next || null);
      } catch (e: any) {
        setProjectId(prev);
        toast.error(e?.message ?? "Couldn't save that.");
      }
    });
  }

  const color = buildingColor ?? "#b5853a";
  const chosen = underConstruction.find((p) => p.id === projectId) ?? null;
  const showMaintTasksToo =
    isFirstScheduledDay && underConstruction.length > 0 && maintTasks.length > 0;

  return (
    <div
      className="rounded-sm border-l-[5px] bg-paper-bg/20 px-4 py-3.5"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="h-3.5 w-3.5 shrink-0 rounded-full"
          style={{ background: color }}
          aria-hidden
        />
        <span
          className="text-[17px] font-semibold tracking-wide"
          style={{ color }}
        >
          {buildingLabel}
        </span>
      </div>

      {underConstruction.length > 0 ? (
        <>
          <select
            value={projectId}
            disabled={pending}
            onChange={(e) => onChange(e.target.value)}
            className="mt-3 w-full max-w-md rounded-sm border border-paper-line bg-paper-bg/60 px-3.5 py-2.5 text-[16px] text-ink outline-none transition focus:border-brass focus:bg-paper-bg/80 disabled:opacity-50"
          >
            <option value="">— choose a project —</option>
            {underConstruction.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          {chosen && (
            <div
              className="mt-3 rounded-sm border px-4 py-3"
              style={{ borderColor: color, background: `${color}14` }}
            >
              <div
                className="font-mono text-[13px] tracking-[0.14em]"
                style={{ color }}
              >
                PROJECT: <span className="text-ink text-[15px]">{chosen.title}</span>
              </div>
              <div className="mt-1.5 font-mono text-[13px] tracking-[0.14em] text-ink-mute">
                TASKS:
              </div>
              {chosen.tasks.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {chosen.tasks.map((t) => (
                    <li key={t.id} className="text-ink-dim text-[15px]">
                      • {t.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-ink-dim text-[15px]">
                  (nothing pulled onto Project Tasks yet)
                </p>
              )}
            </div>
          )}

          {showMaintTasksToo && (
            <div className="mt-3">
              <p
                className="font-mono text-[12px] uppercase tracking-[0.14em]"
                style={{ color }}
              >
                First day for {buildingLabel} this week — maint tasks too:
              </p>
              <MaintTaskList tasks={maintTasks} />
            </div>
          )}
        </>
      ) : (
        <div className="mt-3">
          {maintTasks.length > 0 ? (
            <>
              <p
                className="font-mono text-[12px] uppercase tracking-[0.14em]"
                style={{ color }}
              >
                Nothing under construction — maint tasks:
              </p>
              <MaintTaskList tasks={maintTasks} />
            </>
          ) : (
            <p className="mt-1 text-[15px] text-ink-mute">
              Nothing under construction, and no open maint tasks in{" "}
              {buildingLabel} right now.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
