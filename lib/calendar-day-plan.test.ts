import { describe, expect, it } from "vitest";
import {
  isEmptyDayPlan,
  normalizeDayPlan,
  projectsForBuilding,
  type CalendarProjectOption,
} from "@/lib/calendar-day-plan";

const p = (
  id: string,
  building: string,
  phase: CalendarProjectOption["phase"],
  title = id,
): CalendarProjectOption => ({ id, title, building, phase });

describe("normalizeDayPlan", () => {
  it("keeps a building with an optional project", () => {
    expect(
      normalizeDayPlan({ boxKey: "LIB", projectId: "p1", note: null }),
    ).toEqual({ boxKey: "LIB", projectId: "p1", note: null });
    expect(
      normalizeDayPlan({ boxKey: "LIB", projectId: null, note: null }),
    ).toEqual({ boxKey: "LIB", projectId: null, note: null });
  });

  it("lets typed text replace the project", () => {
    expect(
      normalizeDayPlan({
        boxKey: "WELL",
        projectId: "p1",
        note: "  Dr B 3 pm ",
      }),
    ).toEqual({ boxKey: "WELL", projectId: null, note: "Dr B 3 pm" });
  });

  it("treats a blank note as no note, so the project survives", () => {
    expect(
      normalizeDayPlan({ boxKey: "LIB", projectId: "p1", note: "   " }),
    ).toEqual({ boxKey: "LIB", projectId: "p1", note: null });
  });

  it("drops a project when there is no building", () => {
    expect(
      normalizeDayPlan({ boxKey: null, projectId: "p1", note: null }),
    ).toEqual({ boxKey: null, projectId: null, note: null });
    expect(
      normalizeDayPlan({ boxKey: "", projectId: "p1", note: null }).boxKey,
    ).toBeNull();
  });
});

describe("isEmptyDayPlan", () => {
  it("is true only when nothing is set", () => {
    expect(isEmptyDayPlan({ boxKey: null, projectId: null, note: null })).toBe(
      true,
    );
    expect(isEmptyDayPlan({ boxKey: null, projectId: "p1", note: " " })).toBe(
      true,
    );
    expect(isEmptyDayPlan({ boxKey: "LIB", projectId: null, note: null })).toBe(
      false,
    );
    expect(isEmptyDayPlan({ boxKey: null, projectId: null, note: "x" })).toBe(
      false,
    );
  });
});

describe("projectsForBuilding", () => {
  const all = [
    p("a", "LIB", "planning", "Alpha"),
    p("b", "LIB", "building", "Beta"),
    p("c", "LIB", "idea", "Gamma"),
    p("d", "LIB", "complete", "Delta"),
    p("e", "PRESS", "building", "Epsilon"),
  ];

  it("offers only that building's planning and under-construction projects", () => {
    expect(projectsForBuilding(all, "LIB", null).map((x) => x.id)).toEqual([
      "b",
      "a",
    ]);
  });

  it("lists under construction before planning, then by title", () => {
    const more = [
      ...all,
      p("f", "LIB", "building", "Aardvark"),
      p("g", "LIB", "planning", "Aaa"),
    ];
    expect(projectsForBuilding(more, "LIB", null).map((x) => x.id)).toEqual([
      "f",
      "b",
      "g",
      "a",
    ]);
  });

  it("keeps a project the day already points at, even if it is complete", () => {
    expect(projectsForBuilding(all, "LIB", "d").map((x) => x.id)).toContain(
      "d",
    );
  });

  it("returns nothing without a building", () => {
    expect(projectsForBuilding(all, null, null)).toEqual([]);
  });
});
