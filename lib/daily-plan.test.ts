import { describe, it, expect } from "vitest";
import {
  classify,
  pickAtmCandidates,
  buildSchedule,
  ceilToNextFiveMinuteLocal,
  formatEndOfDay12h,
  parseTimeOnDate,
  thresholdCallout,
} from "./daily-plan";
import type { Item, DayInputs } from "./types";

// Counter items now require an explicit today_order to be scheduled
// (opt-in for today). Tests default to todayOrder=1 so they continue
// exercising the schedule logic; cases that need "not on today" can
// override.
const baseItem = (over: Partial<Item>): Item => ({
  id: crypto.randomUUID(),
  box: "MAINT",
  title: "x",
  urgent: false,
  must: false,
  should: false,
  pinned: false,
  todayOrder: 1,
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
  ...over,
});

const inputs: DayInputs = {
  date: "2026-05-01",
  hoursAvailable: 7,
  creative: 3,
  probSolv: 4,
  tieBreak: "PROB-SOLV",
  endOfDay: "16:30",
};

describe("classify", () => {
  it("buckets urgent+must as stressors", () => {
    const items = [
      baseItem({ title: "tax", urgent: true, must: true, minutes: 60 }),
      baseItem({ title: "call", urgent: true, must: false, minutes: 15 }),
      baseItem({ title: "ron", urgent: false, must: true, minutes: 30 }),
      baseItem({ title: "blog", urgent: false, must: false, minutes: 45 }),
    ];
    const r = classify(items);
    expect(r.stressors).toHaveLength(1);
    expect(r.timeSensitive).toHaveLength(1);
    expect(r.mustDo).toHaveLength(1);
    expect(r.otherMaint).toHaveLength(1);
    expect(r.stressorsMinutes).toBe(60);
    expect(r.timeSensitiveMinutes).toBe(15);
    expect(r.mustDoMinutes).toBe(30);
  });

  it("ignores soft-deleted rows", () => {
    const items = [
      baseItem({
        urgent: true,
        must: true,
        minutes: 60,
        deletedAt: new Date().toISOString(),
      }),
    ];
    const r = classify(items);
    expect(r.stressors).toHaveLength(0);
  });

  it("excludes items without today_order (not on today's plan)", () => {
    const items = [
      baseItem({ urgent: true, must: true, minutes: 30, todayOrder: null }),
      baseItem({ urgent: true, must: true, minutes: 30, todayOrder: 2 }),
    ];
    const r = classify(items);
    expect(r.stressors).toHaveLength(1);
  });
});

describe("pickAtmCandidates", () => {
  it("includes creative when creative > prob-solv", () => {
    const items = [
      baseItem({ box: "ATM", energy: "CREATIVE", minutes: 30, title: "a" }),
      baseItem({ box: "ATM", energy: "PROB-SOLV", minutes: 30, title: "b" }),
    ];
    const r = pickAtmCandidates(items, { ...inputs, creative: 4, probSolv: 2 });
    expect(r.map((x) => x.title)).toEqual(["a"]);
  });

  it("filters out items longer than available hours", () => {
    const items = [
      baseItem({
        box: "ATM",
        energy: "PROB-SOLV",
        minutes: 9999,
        title: "huge",
      }),
    ];
    const r = pickAtmCandidates(items, inputs);
    expect(r).toEqual([]);
  });

  it("low total energy only surfaces LEISURE/PEOPLE areas", () => {
    const items = [
      baseItem({
        box: "ATM",
        energy: "LEISURE",
        category: "LEISURE",
        minutes: 30,
        title: "rest",
      }),
      baseItem({
        box: "ATM",
        energy: "CREATIVE",
        category: "ECO",
        minutes: 20,
        title: "deep work",
      }),
    ];
    const r = pickAtmCandidates(items, {
      ...inputs,
      creative: 2,
      probSolv: 2,
    });
    expect(r.map((x) => x.title)).toEqual(["rest"]);
  });

  it("low total energy excludes creative even when creative > prob-solv", () => {
    const items = [
      baseItem({
        box: "ATM",
        energy: "CREATIVE",
        category: "ECO",
        minutes: 30,
        title: "work",
      }),
      baseItem({
        box: "ATM",
        energy: "LEISURE",
        area: "PEOPLE",
        minutes: 15,
        title: "call a friend",
      }),
    ];
    const r = pickAtmCandidates(items, {
      ...inputs,
      creative: 4,
      probSolv: 1,
    });
    expect(r.map((x) => x.title)).toEqual(["call a friend"]);
  });
});

describe("buildSchedule", () => {
  it("always starts at dayStart regardless of maint size", () => {
    // Below threshold (small maint pile, no ATM picks). The old behavior
    // anchored maint to end-of-day, producing a late "first block start"
    // when nothing filled the morning. New behavior: maint starts at
    // dayStart (= endOfDay − hoursAvailable = 9:30 AM).
    const classified = classify([
      baseItem({ urgent: true, must: true, minutes: 30, title: "S1" }),
      baseItem({ urgent: false, must: true, minutes: 60, title: "M1" }),
    ]);
    const blocks = buildSchedule({ classified, atmPicks: [], inputs });
    const first = blocks[0];
    expect(new Date(first.start).getHours()).toBe(9);
    expect(new Date(first.start).getMinutes()).toBe(30);
  });

  it("runs maint first when stressors >= threshold", () => {
    const stressors = Array.from({ length: 5 }, () =>
      baseItem({ urgent: true, must: true, minutes: 25, title: "s" }),
    );
    const classified = classify(stressors);
    const blocks = buildSchedule({ classified, atmPicks: [], inputs });
    const first = blocks[0];
    expect(new Date(first.start).getHours()).toBe(9);
    expect(new Date(first.start).getMinutes()).toBe(30);
  });

  it("schedules otherMaint (neither urgent nor must) too", () => {
    const classified = classify([
      baseItem({ urgent: false, must: false, minutes: 20, title: "Q1" }),
    ]);
    const blocks = buildSchedule({ classified, atmPicks: [], inputs });
    expect(blocks).toHaveLength(1);
    expect(blocks[0].title).toBe("Q1");
  });

  it("when rebuilding mid-day, first block aligns to now if now is already on a 5-minute mark", () => {
    const classified = classify([
      baseItem({ urgent: false, must: true, minutes: 30, title: "M1" }),
    ]);
    // Configured dayStart is 9:30 AM (16:30 − 7h); pretend it's 11:00.
    const now = new Date(2026, 4, 1, 11, 0, 0);
    const blocks = buildSchedule({ classified, atmPicks: [], inputs, now });
    expect(new Date(blocks[0].start).getHours()).toBe(11);
    expect(new Date(blocks[0].start).getMinutes()).toBe(0);
  });

  it("when rebuilding mid-day, first block starts at the next 5-minute mark after now", () => {
    const classified = classify([
      baseItem({ urgent: false, must: true, minutes: 30, title: "M1" }),
    ]);
    const now = new Date(2026, 4, 1, 11, 18, 0);
    const blocks = buildSchedule({ classified, atmPicks: [], inputs, now });
    expect(new Date(blocks[0].start).getHours()).toBe(11);
    expect(new Date(blocks[0].start).getMinutes()).toBe(20);
  });

  it("when starting the plan day before the configured window, first block uses next 5-minute mark from now", () => {
    const classified = classify([
      baseItem({ urgent: false, must: true, minutes: 30, title: "Early" }),
    ]);
    const now = new Date(2026, 4, 1, 8, 7, 0);
    const blocks = buildSchedule({ classified, atmPicks: [], inputs, now });
    expect(new Date(blocks[0].start).getHours()).toBe(8);
    expect(new Date(blocks[0].start).getMinutes()).toBe(10);
  });

  it("each following block starts on a 5-minute boundary", () => {
    const classified = classify([
      baseItem({ urgent: false, must: true, minutes: 25, title: "A" }),
      baseItem({ urgent: false, must: true, minutes: 20, title: "B", todayOrder: 2 }),
    ]);
    const now = new Date(2026, 4, 1, 10, 0, 0);
    const blocks = buildSchedule({ classified, atmPicks: [], inputs, now });
    expect(blocks).toHaveLength(2);
    const bStart = new Date(blocks[1].start);
    expect(bStart.getHours()).toBe(10);
    expect(bStart.getMinutes()).toBe(25);
    expect(bStart.getMinutes() % 5).toBe(0);
  });

  it("ignores `now` when it's a different day (e.g. building tonight for tomorrow)", () => {
    const classified = classify([
      baseItem({ urgent: false, must: true, minutes: 30, title: "M1" }),
    ]);
    const now = new Date(2026, 3, 30, 22, 0, 0); // Apr 30 10 PM
    const blocks = buildSchedule({ classified, atmPicks: [], inputs, now });
    expect(new Date(blocks[0].start).getHours()).toBe(9);
    expect(new Date(blocks[0].start).getMinutes()).toBe(30);
  });

  it("respects pinned scheduledStart", () => {
    const pinned = baseItem({
      urgent: false,
      must: true,
      minutes: 30,
      title: "P",
      pinned: true,
      scheduledStart: "2026-05-01T15:00:00.000Z",
    });
    const classified = classify([pinned]);
    const blocks = buildSchedule({ classified, atmPicks: [], inputs });
    expect(blocks[0].start).toBe("2026-05-01T15:00:00.000Z");
  });
});

describe("formatEndOfDay12h", () => {
  it("formats stored 24h times as 12h", () => {
    expect(formatEndOfDay12h("16:30", "2026-05-01")).toBe("4:30 PM");
    expect(formatEndOfDay12h("09:15", "2026-05-01")).toBe("9:15 AM");
  });

  it("normalizes existing 12h strings", () => {
    expect(formatEndOfDay12h("4:30 PM", "2026-05-01")).toBe("4:30 PM");
  });
});

describe("ceilToNextFiveMinuteLocal", () => {
  it("keeps exact 5-minute boundaries", () => {
    const d = new Date(2026, 4, 1, 14, 30, 0);
    const out = ceilToNextFiveMinuteLocal(d);
    expect(out.getHours()).toBe(14);
    expect(out.getMinutes()).toBe(30);
  });

  it("rounds up between 5-minute marks (e.g. 2:18 → 2:20)", () => {
    const d = new Date(2026, 4, 1, 14, 18, 0);
    const out = ceilToNextFiveMinuteLocal(d);
    expect(out.getHours()).toBe(14);
    expect(out.getMinutes()).toBe(20);
  });
});

describe("thresholdCallout", () => {
  it("speaks plain English under threshold", () => {
    const c = classify([
      baseItem({ urgent: true, must: true, minutes: 30, title: "S" }),
    ]);
    expect(thresholdCallout(c, inputs)).toMatch(/Today's Maint/);
  });
});
