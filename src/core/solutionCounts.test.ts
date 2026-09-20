import { describe, expect, it } from 'vitest';
import {
  COUNT_TABLE_SIZE,
  countIndex,
  monthSolutionCounts,
  solutionCountFor,
  summarise,
  tableIsPopulated,
} from './solutionCounts.ts';
import { SOLUTION_COUNTS } from './solutionCounts.generated.ts';
import { countSolutions } from './solver.ts';
import { daysInMonth, isoWeekday, puzzleDateFor, type PuzzleDate } from './date.ts';
import type { Month } from './board.ts';

describe('the precomputed table', () => {
  it('has one slot per month/day/weekday combination', () => {
    expect(COUNT_TABLE_SIZE).toBe(12 * 31 * 7);
    expect(SOLUTION_COUNTS).toHaveLength(COUNT_TABLE_SIZE);
  });

  it('is populated', () => {
    expect(tableIsPopulated()).toBe(true);
  });

  it('indexes month, day and weekday without collisions', () => {
    const seen = new Set<number>();
    for (let month = 1; month <= 12; month += 1) {
      for (let day = 1; day <= 31; day += 1) {
        for (let weekday = 1; weekday <= 7; weekday += 1) {
          const index = countIndex(month, day, weekday);
          expect(seen.has(index)).toBe(false);
          seen.add(index);
          expect(index).toBeGreaterThanOrEqual(0);
          expect(index).toBeLessThan(COUNT_TABLE_SIZE);
        }
      }
    }
    expect(seen.size).toBe(COUNT_TABLE_SIZE);
  });

  it('holds a positive count for every date the calendar can produce', () => {
    const empty: string[] = [];
    for (let month = 1 as Month; month <= 12; month = (month + 1) as Month) {
      // 2024 is a leap year, so this covers 29 February too.
      for (let day = 1; day <= daysInMonth(2024, month); day += 1) {
        for (let weekday = 1; weekday <= 7; weekday += 1) {
          const value = SOLUTION_COUNTS[countIndex(month, day, weekday)] ?? 0;
          if (value <= 0) empty.push(`${month}/${day}/${weekday}`);
        }
      }
    }
    expect(empty).toEqual([]);
  });

  it('holds 0 for dates the calendar never produces', () => {
    // 30 and 31 February, and the 31st of the thirty-day months.
    for (const weekday of [1, 4, 7]) {
      expect(SOLUTION_COUNTS[countIndex(2, 30, weekday)]).toBe(0);
      expect(SOLUTION_COUNTS[countIndex(2, 31, weekday)]).toBe(0);
      for (const month of [4, 6, 9, 11]) {
        expect(SOLUTION_COUNTS[countIndex(month, 31, weekday)]).toBe(0);
      }
    }
  });

  it('agrees with the live solver on a spread of dates', { timeout: 60_000 }, () => {
    const samples: readonly PuzzleDate[] = [
      puzzleDateFor(2026, 9, 20),
      puzzleDateFor(2024, 2, 29),
      puzzleDateFor(2025, 1, 1),
      puzzleDateFor(2025, 12, 31),
      puzzleDateFor(2026, 6, 15),
    ];
    for (const date of samples) {
      expect(solutionCountFor(date), JSON.stringify(date)).toBe(countSolutions(date));
    }
  });
});

describe('solutionCountFor', () => {
  it('reads the table by month, day and weekday', () => {
    const date = puzzleDateFor(2026, 9, 20);
    expect(date.weekday).toBe(7);
    expect(solutionCountFor(date)).toBe(SOLUTION_COUNTS[countIndex(9, 20, 7)]);
  });

  it('gives different answers for the same date in different years', () => {
    // 1 March falls on different weekdays, so the puzzle differs.
    const a = puzzleDateFor(2025, 3, 1);
    const b = puzzleDateFor(2026, 3, 1);
    expect(a.weekday).not.toBe(b.weekday);
    expect(solutionCountFor(a)).not.toBe(solutionCountFor(b));
  });
});

describe('monthSolutionCounts', () => {
  it('returns one entry per day, in order', () => {
    const counts = monthSolutionCounts(2026, 9);
    expect(counts).toHaveLength(30);
    expect(counts.map((entry) => entry.day)).toEqual(
      Array.from({ length: 30 }, (_unused, i) => i + 1),
    );
  });

  it('lengthens February in a leap year', () => {
    expect(monthSolutionCounts(2024, 2)).toHaveLength(29);
    expect(monthSolutionCounts(2025, 2)).toHaveLength(28);
  });

  it('carries the real weekday of each date', () => {
    for (const entry of monthSolutionCounts(2026, 9)) {
      expect(entry.weekday).toBe(isoWeekday(2026, 9, entry.day));
    }
  });

  it('is never empty for any month of a decade', () => {
    for (let year = 2020; year < 2030; year += 1) {
      for (let month = 1 as Month; month <= 12; month = (month + 1) as Month) {
        for (const entry of monthSolutionCounts(year, month)) {
          expect(entry.count, `${year}-${month}-${entry.day}`).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('summarise', () => {
  it('totals the month and finds its extremes', () => {
    const counts = monthSolutionCounts(2026, 9);
    const { total, min, max } = summarise(counts);
    expect(total).toBe(counts.reduce((sum, entry) => sum + entry.count, 0));
    expect(min?.count).toBe(Math.min(...counts.map((entry) => entry.count)));
    expect(max?.count).toBe(Math.max(...counts.map((entry) => entry.count)));
  });

  it('handles an empty month', () => {
    expect(summarise([])).toEqual({ total: 0, min: null, max: null });
  });
});
