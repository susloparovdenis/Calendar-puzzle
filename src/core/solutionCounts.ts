/**
 * Lookup over the precomputed table of solution counts.
 *
 * Counting every tiling for one date takes about a second, far too long to do
 * in the browser for a whole month at once, so the numbers are worked out ahead
 * of time by `scripts/build-solution-counts.ts` and read from here.
 */

import { isoWeekday, daysInMonth, type PuzzleDate } from './date.ts';
import type { Month, Weekday } from './board.ts';
import { SOLUTION_COUNTS } from './solutionCounts.generated.ts';

const DAYS = 31;
const WEEKDAYS = 7;

export const COUNT_TABLE_SIZE = 12 * DAYS * WEEKDAYS;

/** Position of one month/day/weekday combination in the flat table. */
export function countIndex(month: number, day: number, weekday: number): number {
  return ((month - 1) * DAYS + (day - 1)) * WEEKDAYS + (weekday - 1);
}

/**
 * How many distinct tilings leave exactly this date open.
 *
 * Returns 0 for combinations the calendar never produces, such as 31 February.
 */
export function solutionCountFor(date: PuzzleDate): number {
  return SOLUTION_COUNTS[countIndex(date.month, date.day, date.weekday)] ?? 0;
}

export interface DayCount {
  readonly day: number;
  readonly weekday: Weekday;
  readonly count: number;
}

/** One entry per real day of the given month, in calendar order. */
export function monthSolutionCounts(year: number, month: Month): readonly DayCount[] {
  const out: DayCount[] = [];
  for (let day = 1; day <= daysInMonth(year, month); day += 1) {
    const weekday = isoWeekday(year, month, day);
    out.push({ day, weekday, count: solutionCountFor({ month, day, weekday }) });
  }
  return out;
}

export interface CountSummary {
  readonly total: number;
  readonly min: DayCount | null;
  readonly max: DayCount | null;
}

/** Total, easiest and hardest day of a month. */
export function summarise(counts: readonly DayCount[]): CountSummary {
  let total = 0;
  let min: DayCount | null = null;
  let max: DayCount | null = null;
  for (const entry of counts) {
    total += entry.count;
    if (min === null || entry.count < min.count) min = entry;
    if (max === null || entry.count > max.count) max = entry;
  }
  return { total, min, max };
}

/** Whether the shipped table actually holds data, rather than being all zeroes. */
export function tableIsPopulated(): boolean {
  return SOLUTION_COUNTS.some((value) => value > 0);
}
