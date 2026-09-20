import type { Month, Weekday } from './board.ts';

/** The three cells the board must leave open. */
export interface PuzzleDate {
  readonly month: Month;
  readonly day: number;
  readonly weekday: Weekday;
}

const DAYS_IN_MONTH: readonly number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: Month): number {
  if (month === 2 && isLeapYear(year)) return 29;
  const days = DAYS_IN_MONTH[month - 1];
  if (days === undefined) throw new RangeError(`bad month: ${month}`);
  return days;
}

export function isMonth(value: number): value is Month {
  return Number.isInteger(value) && value >= 1 && value <= 12;
}

export function isWeekday(value: number): value is Weekday {
  return Number.isInteger(value) && value >= 1 && value <= 7;
}

/** ISO weekday of a calendar date: 1 = Monday … 7 = Sunday. */
export function isoWeekday(year: number, month: Month, day: number): Weekday {
  const jsDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const iso = jsDay === 0 ? 7 : jsDay;
  if (!isWeekday(iso)) throw new Error(`unreachable weekday: ${iso}`);
  return iso;
}

export function isValidDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !isMonth(month)) return false;
  return Number.isInteger(day) && day >= 1 && day <= daysInMonth(year, month);
}

/** Builds the puzzle target for a real calendar date. */
export function puzzleDateFor(year: number, month: Month, day: number): PuzzleDate {
  if (!isValidDate(year, month, day)) {
    throw new RangeError(`invalid date: ${year}-${month}-${day}`);
  }
  return { month, day, weekday: isoWeekday(year, month, day) };
}

export function puzzleDateFromDate(date: Date): PuzzleDate {
  const month = date.getMonth() + 1;
  if (!isMonth(month)) throw new RangeError(`bad month in date: ${String(date)}`);
  return puzzleDateFor(date.getFullYear(), month, date.getDate());
}

/** Clamps a day to the length of the given month, e.g. 31 March -> 30 April. */
export function clampDay(year: number, month: Month, day: number): number {
  return Math.min(Math.max(day, 1), daysInMonth(year, month));
}
