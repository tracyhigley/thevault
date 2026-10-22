import { describe, it, expect } from "vitest";
import {
  ROUTINE_ITEMS,
  ROUTINE_GROUPS,
  scoreDay,
  averageScores,
  addDaysYmd,
} from "./routine";

describe("routine checklist", () => {
  it("each group's points add up to exactly 100", () => {
    for (const g of ROUTINE_GROUPS) {
      const sum = ROUTINE_ITEMS.filter((i) => i.group === g.key).reduce(
        (s, i) => s + i.points,
        0,
      );
      expect(sum, g.label).toBe(100);
    }
  });

  it("item keys are unique", () => {
    const keys = ROUTINE_ITEMS.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("scores the day as points checked off so far", () => {
    expect(
      scoreDay([
        "food.morning.protein",
        "food.morning.fiber",
        "water.morning.30oz",
      ]),
    ).toEqual({ food: 30, water: 30, movement: 0, restore: 0 });
  });

  it("a perfect day is 100 everywhere", () => {
    expect(scoreDay(ROUTINE_ITEMS.map((i) => i.key))).toEqual({
      food: 100,
      water: 100,
      movement: 100,
      restore: 100,
    });
  });

  it("ignores unknown or repeated keys", () => {
    expect(
      scoreDay(["nope", "water.evening.64oz", "water.evening.64oz"]),
    ).toEqual({
      food: 0,
      water: 40,
      movement: 0,
      restore: 0,
    });
  });

  it("averages only the days that were logged", () => {
    const r = averageScores([["water.evening.64oz"], ["water.morning.30oz"]]);
    expect(r.days).toBe(2);
    expect(r.scores?.water).toBe(35);
    expect(averageScores([]).scores).toBeNull();
  });

  it("shifts dates across month boundaries", () => {
    expect(addDaysYmd("2026-10-01", -1)).toBe("2026-09-30");
    expect(addDaysYmd("2026-12-31", 1)).toBe("2027-01-01");
  });
});
