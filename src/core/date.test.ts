import { describe, expect, it } from 'vitest';
import {
  clampDay,
  daysInMonth,
  isLeapYear,
  isMonth,
  isValidDate,
  isWeekday,
  isoWeekday,
  puzzleDateFor,
  puzzleDateFromDate,
} from './date.ts';

describe('isLeapYear', () => {
  it('follows the Gregorian rule', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2025)).toBe(false);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(2100)).toBe(false);
  });
});

describe('daysInMonth', () => {
  it('returns the usual lengths', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) =>
      isMonth(m) ? daysInMonth(2025, m) : 0,
    )).toEqual([31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]);
  });

  it('gives February 29 days in a leap year', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2025, 2)).toBe(28);
  });
});

describe('isoWeekday', () => {
  it('numbers Monday 1 through Sunday 7', () => {
    expect(isoWeekday(2026, 9, 20)).toBe(7); // Sunday
    expect(isoWeekday(2026, 9, 21)).toBe(1); // Monday
    expect(isoWeekday(2000, 1, 1)).toBe(6); // Saturday
    expect(isoWeekday(2024, 2, 29)).toBe(4); // Thursday
  });

  it('advances by one across a whole year', () => {
    let previous = isoWeekday(2025, 1, 1);
    const date = new Date(Date.UTC(2025, 0, 1));
    for (let i = 0; i < 364; i += 1) {
      date.setUTCDate(date.getUTCDate() + 1);
      const month = date.getUTCMonth() + 1;
      if (!isMonth(month)) throw new Error('bad month');
      const next = isoWeekday(2025, month, date.getUTCDate());
      expect(next).toBe((previous % 7) + 1);
      previous = next;
    }
  });
});

describe('guards', () => {
  it('validates month and weekday ranges', () => {
    expect(isMonth(1)).toBe(true);
    expect(isMonth(12)).toBe(true);
    expect(isMonth(0)).toBe(false);
    expect(isMonth(13)).toBe(false);
    expect(isMonth(1.5)).toBe(false);
    expect(isWeekday(7)).toBe(true);
    expect(isWeekday(8)).toBe(false);
  });

  it('validates whole dates', () => {
    expect(isValidDate(2025, 2, 28)).toBe(true);
    expect(isValidDate(2025, 2, 29)).toBe(false);
    expect(isValidDate(2024, 2, 29)).toBe(true);
    expect(isValidDate(2025, 4, 31)).toBe(false);
    expect(isValidDate(2025, 13, 1)).toBe(false);
    expect(isValidDate(2025, 1, 0)).toBe(false);
  });
});

describe('puzzleDateFor', () => {
  it('pairs the date with its weekday', () => {
    expect(puzzleDateFor(2026, 9, 20)).toEqual({ month: 9, day: 20, weekday: 7 });
  });

  it('rejects impossible dates instead of rolling them over', () => {
    expect(() => puzzleDateFor(2025, 2, 30)).toThrow(RangeError);
    expect(() => puzzleDateFor(2025, 11, 31)).toThrow(RangeError);
  });

  it('reads a JS Date in local time', () => {
    expect(puzzleDateFromDate(new Date(2026, 8, 20))).toEqual({ month: 9, day: 20, weekday: 7 });
  });
});

describe('clampDay', () => {
  it('keeps the day inside the month', () => {
    expect(clampDay(2025, 4, 31)).toBe(30);
    expect(clampDay(2025, 2, 31)).toBe(28);
    expect(clampDay(2024, 2, 31)).toBe(29);
    expect(clampDay(2025, 1, 31)).toBe(31);
    expect(clampDay(2025, 1, 0)).toBe(1);
  });
});
