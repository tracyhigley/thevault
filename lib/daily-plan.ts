// Daily plan: bucket items by flags, pick ATM candidates by energy
// match, and produce a timed schedule that fills the day from dayStart.
//
// Two related but separate concerns:
//   classify()         → bucket counter items by urgent/must combinations
//   pickAtmCandidates → energy-matched filter for ATM items
//   buildSchedule     → emit timed blocks, maint-first or ATM-first
//                        based on the stressor anchor threshold

import type { DayInputs, Item } from "./types";

export type Bucket = "STRESSOR" | "TIME_SENSITIVE" | "MUST_DO" | "OTHER_MAINT";

export type ClassifiedItem = Item & { bucket: Bucket };

export type Classified = {
  stressors: ClassifiedItem[];
  timeSensitive: ClassifiedItem[];
  mustDo: ClassifiedItem[];
  otherMaint: ClassifiedItem[];
  stressorsMinutes: number;
  timeSensitiveMinutes: number;
  mustDoMinutes: number;
};

// Bucket items into the four flag-based piles. Set `todayOnly: true` to
// also drop items that aren't on today's plan (today_order = null) — used
// when feeding buildSchedule. The wizard's "What's heavy" review wants to
// see every counter item so the user can opt in, so it passes false.
export function classify(items: Item[], todayOnly = true): Classified {
  const stressors: ClassifiedItem[] = [];
  const timeSensitive: ClassifiedItem[] = [];
  const mustDo: ClassifiedItem[] = [];
  const otherMaint: ClassifiedItem[] = [];

  for (const it of items) {
    if (it.deletedAt) continue;
    if (todayOnly && (it.todayOrder ?? null) === null) continue;
    const m = it.minutes ?? 0;
    if (it.urgent && it.must) {
      stressors.push({ ...it, bucket: "STRESSOR" });
    } else if (it.urgent) {
      timeSensitive.push({ ...it, bucket: "TIME_SENSITIVE" });
    } else if (it.must) {
      mustDo.push({ ...it, bucket: "MUST_DO" });
    } else {
      otherMaint.push({ ...it, bucket: "OTHER_MAINT" });
    }
    void m;
  }

  const sum = (xs: Item[]) =>
    xs.reduce((a, b) => a + (b.minutes ?? 0), 0);

  return {
    stressors,
    timeSensitive,
    mustDo,
    otherMaint,
    stressorsMinutes: sum(stressors),
    timeSensitiveMinutes: sum(timeSensitive),
    mustDoMinutes: sum(mustDo),
  };
}

/** ATM rows triaged to LEISURE or PEOPLE life areas (box keys on area/category). */
export function isLeisureOrPeopleArea(it: Item): boolean {
  const a = (it.area ?? "").trim().toUpperCase();
  const c = (it.category ?? "").trim().toUpperCase();
  return (
    a === "LEISURE" ||
    a === "PEOPLE" ||
    c === "LEISURE" ||
    c === "PEOPLE"
  );
}

// Pick ATM items whose energy matches today's mood. Creative-leaning
// days surface CREATIVE items, problem-solving days surface PROB-SOLV.
// When creative + prob-solv < 6, only LEISURE and PEOPLE *areas* surface
// (no creative/prob-solv pulls). TieBreak resolves even scores on normal days.
export function pickAtmCandidates(
  atmItems: Item[],
  inputs: DayInputs,
): Item[] {
  const availMinutes = inputs.hoursAvailable * 60;
  const sum = inputs.creative + inputs.probSolv;
  const lowEnergy = sum < 6;
  let needCreative = inputs.creative > inputs.probSolv;
  let needProb = inputs.creative < inputs.probSolv;
  if (inputs.creative === inputs.probSolv) {
    if (inputs.tieBreak === "CREATIVE") needCreative = true;
    else if (inputs.tieBreak === "PROB-SOLV") needProb = true;
  }

  return atmItems.filter((it) => {
    if (it.deletedAt) continue_safe();
    const m = it.minutes ?? 0;
    if (m <= 0 || m > availMinutes) return false;
    if (lowEnergy) {
      return isLeisureOrPeopleArea(it);
    }
    const energy = (it.energy ?? "").toUpperCase();
    if (needCreative && energy === "CREATIVE") return true;
    if (needProb && energy === "PROB-SOLV") return true;
    return false;
  });
}

// Tiny helper so the filter above reads cleanly without `continue`.
function continue_safe(): false {
  return false;
}

export type ScheduledBlock = {
  itemId: string;
  title: string;
  bucket: Bucket | "ATM_PICK" | "CUSTOM";
  minutes: number;
  start: string; // ISO
  end: string; // ISO
  pinned: boolean;
  area?: string | null;
  overflow?: boolean;
};

export type BuildScheduleArgs = {
  classified: Classified;
  atmPicks: Item[];
  inputs: DayInputs;
  stressorAnchorMinutes?: number;
  now?: Date;
};

const SCHEDULE_SLOT_MS = 5 * 60 * 1000;

/** Next 5-minute boundary at or after `d`, in the machine's local calendar (browser / Node TZ). */
export function ceilToNextFiveMinuteLocal(d: Date): Date {
  const z = new Date(d);
  const start = new Date(
    z.getFullYear(),
    z.getMonth(),
    z.getDate(),
    0,
    0,
    0,
    0,
  );
  const elapsed = z.getTime() - start.getTime();
  const up = Math.ceil(elapsed / SCHEDULE_SLOT_MS) * SCHEDULE_SLOT_MS;
  return new Date(start.getTime() + up);
}

/** Working window for the docket header and the first schedulable slot. */
export function dayScheduleWindow(
  inputs: DayInputs,
  now?: Date,
): { dayStart: Date; endOfDay: Date } {
  const endOfDay = parseTimeOnDate(inputs.endOfDay, inputs.date);
  const nowOnDate = now ?? new Date();
  const planDay = parseTimeOnDate("12:00", inputs.date);

  let dayStart: Date;
  if (sameLocalDate(nowOnDate, planDay)) {
    // Same calendar day as the plan — first block starts at the next 5-minute mark from now.
    dayStart = ceilToNextFiveMinuteLocal(nowOnDate);
  } else {
    // Building ahead (e.g. tonight for tomorrow) — anchor from configured window.
    const configuredStart = new Date(
      endOfDay.getTime() - inputs.hoursAvailable * 60 * 60_000,
    );
    dayStart = ceilToNextFiveMinuteLocal(configuredStart);
  }

  if (dayStart.getTime() > endOfDay.getTime()) {
    dayStart = endOfDay;
  }

  return { dayStart, endOfDay };
}

// End-of-day anchored schedule.
//
// Logic:
//   1. Compute end-of-day Date from inputs.endOfDay ("HH:MM" 24-hr or "4:30 PM").
//   2. If stressorsMinutes < threshold, the maint pile (stressors + time-sensitive
//      + must-do) is anchored so it FINISHES at end-of-day. Till picks fill earlier.
//   3. If stressorsMinutes >= threshold, maint runs FIRST starting at the
//      day-start (computed = endOfDay - hoursAvailable). Till picks come after.
//   4. Pinned items keep their scheduledStart; everything else flows around them.
export function buildSchedule({
  classified,
  atmPicks,
  inputs,
  stressorAnchorMinutes = 91,
  now,
}: BuildScheduleArgs): ScheduledBlock[] {
  const { dayStart, endOfDay } = dayScheduleWindow(inputs, now);
  const nowOnDate = now ?? new Date();

  // maintPile = every counter item on today's plan, in priority order.
  // otherMaint (neither urgent nor must) was being dropped from the
  // schedule — fixed: append at the tail so "neither" items also show up.
  const maintPile = [
    ...classified.stressors,
    ...classified.timeSensitive,
    ...classified.mustDo,
    ...classified.otherMaint,
  ];

  // Maint-first vs ATM-first ordering. Either way, the day starts at
  // dayStart — the old "anchor maint to end-of-day" mode produced weird
  // 5:45 PM start times when ATM picks were empty, since the morning
  // had nothing to fill it. Now both branches start at dayStart.
  const maintFirst =
    classified.stressorsMinutes >= stressorAnchorMinutes;

  let cursor: Date = new Date(dayStart);
  const blocks: ScheduledBlock[] = [];

  if (maintFirst) {
    cursor = appendBlocks(blocks, maintPile, cursor);
    cursor = appendBlocks(blocks, atmPicks, cursor, "ATM_PICK");
  } else {
    cursor = appendBlocks(blocks, atmPicks, cursor, "ATM_PICK");
    cursor = appendBlocks(blocks, maintPile, cursor);
  }
  void endOfDay;
  void nowOnDate;

  // Apply pins last — items with their own scheduledStart override.
  for (const block of blocks) {
    const source = [...maintPile, ...atmPicks].find(
      (i) => i.id === block.itemId,
    );
    if (source?.pinned && source.scheduledStart) {
      const s = new Date(source.scheduledStart);
      const e = new Date(s.getTime() + block.minutes * 60_000);
      block.start = s.toISOString();
      block.end = e.toISOString();
      block.pinned = true;
    }
  }
  void now;

  return blocks;
}

function sumMinutes(items: Item[]): number {
  return items.reduce((a, b) => a + (b.minutes ?? 0), 0);
}

function sameLocalDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function appendBlocks(
  out: ScheduledBlock[],
  items: Item[],
  cursor: Date,
  forceBucket?: ScheduledBlock["bucket"],
): Date {
  let c = ceilToNextFiveMinuteLocal(cursor);
  for (const it of items) {
    const minutes = it.minutes ?? 0;
    if (minutes <= 0) continue;
    const start = new Date(c);
    const end = new Date(c.getTime() + minutes * 60_000);
    out.push({
      itemId: it.id,
      title: it.title,
      bucket:
        forceBucket ??
        ((it as ClassifiedItem).bucket as Bucket) ??
        "OTHER_MAINT",
      minutes,
      start: start.toISOString(),
      end: end.toISOString(),
      pinned: it.pinned,
      area: it.area ?? it.category,
    });
    c = ceilToNextFiveMinuteLocal(end);
  }
  return c;
}

// Accepts "16:30", "4:30 PM", "4 PM" etc. and combines with an ISO date string.
export function parseTimeOnDate(time: string, isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  const t = time.trim().toUpperCase();
  let h = 0;
  let min = 0;
  const ampm = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/.exec(t);
  if (ampm) {
    h = Number(ampm[1]);
    min = Number(ampm[2] ?? "0");
    if (ampm[3] === "PM" && h !== 12) h += 12;
    if (ampm[3] === "AM" && h === 12) h = 0;
  } else {
    const m24 = /^(\d{1,2}):(\d{2})$/.exec(t);
    if (!m24) throw new Error(`Bad time: ${time}`);
    h = Number(m24[1]);
    min = Number(m24[2]);
  }
  return new Date(y, m - 1, d, h, min, 0, 0);
}

/** Canonical `h:mm AM/PM` for wizard/UI when day_inputs stores `HH:MM` or mixed formats. */
export function formatEndOfDay12h(time: string, isoDate: string): string {
  const d = parseTimeOnDate(time.trim(), isoDate);
  return formatHHMM12(d);
}

// Produces the threshold-callout message the Docket header needs.
export function thresholdCallout(
  classified: Classified,
  inputs: DayInputs,
  threshold = 91,
): string {
  if (classified.stressorsMinutes >= threshold) {
    return "Today's Maint tasks should be done first";
  }
  const endOfDay = parseTimeOnDate(inputs.endOfDay, inputs.date);
  const start = new Date(
    endOfDay.getTime() - classified.stressorsMinutes * 60_000,
  );
  return `Today's Maint tasks should be started at ${formatHHMM12(start)}`;
}

function formatHHMM12(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}
