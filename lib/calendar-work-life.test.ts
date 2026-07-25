import { describe, expect, it } from "vitest";
import type { Box } from "@/lib/categories";
import { calendarWorkLifeGroup } from "@/lib/calendar-work-life";

function box(label: string, key = label): Box {
  return { key, label };
}

describe("calendarWorkLifeGroup", () => {
  it("classifies work buildings by label and key", () => {
    expect(calendarWorkLifeGroup(box("The Press"))).toBe("work");
    expect(calendarWorkLifeGroup(box("The Press", "THE_PRESS"))).toBe("work");
    expect(calendarWorkLifeGroup(box("The Mercantile"))).toBe("work");
    expect(calendarWorkLifeGroup(box("The Mercantile", "THE_MERCANTILE"))).toBe(
      "work",
    );
    expect(calendarWorkLifeGroup(box("The Library"))).toBe("work");
    expect(calendarWorkLifeGroup(box("The Library", "THE_LIBRARY"))).toBe(
      "work",
    );
  });

  it("classifies other buildings by label and key", () => {
    expect(calendarWorkLifeGroup(box("The Port"))).toBe("other");
    expect(calendarWorkLifeGroup(box("The Port", "THE_PORT"))).toBe("other");
    expect(calendarWorkLifeGroup(box("The Family Lodge"))).toBe("other");
    expect(
      calendarWorkLifeGroup(box("The Family Lodge", "THE_FAMILY_LODGE")),
    ).toBe("other");
    expect(calendarWorkLifeGroup(box("The Grounds"))).toBe("other");
    expect(calendarWorkLifeGroup(box("The Grounds", "THE_GROUNDS"))).toBe(
      "other",
    );
    // Leisure had no direct building equivalent and was folded into The
    // Gymnasium, so it's grouped "other" here too.
    expect(calendarWorkLifeGroup(box("The Gymnasium"))).toBe("other");
    expect(calendarWorkLifeGroup(box("The Gymnasium", "THE_GYMNASIUM"))).toBe(
      "other",
    );
  });

  it("returns null for buildings outside work/life groups", () => {
    expect(calendarWorkLifeGroup(box("The Support Center"))).toBeNull();
  });
});
