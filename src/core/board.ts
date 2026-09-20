/**
 * Geometry and labelling of the wooden calendar board.
 *
 * The physical board is a 7 x 8 grid carved into a birch panel. Six cells are
 * covered by the walnut inlays (the hot-air balloon in the top-right corner and
 * the "НОВЫЙ ДЕНЬ. НОВЫЕ ВОЗМОЖНОСТИ!" motto along the bottom-left edge), which
 * leaves 50 playable cells:
 *
 *     ЯНВ ФЕВ МАР АПР МАЙ ИНЬ  ##
 *     ИЛЬ АВГ СЕН ОКТ НОЯ ДЕК  ##
 *       1   2   3   4   5   6   7
 *       8   9  10  11  12  13  14
 *      15  16  17  18  19  20  21
 *      22  23  24  25  26  27  28
 *      29  30  31  ПН  ВТ  СР  ЧТ
 *      ##  ##  ##  ##  ПТ  СБ  ВС
 *
 * Three of those 50 cells are left uncovered (the chosen month, day and
 * weekday); the remaining 47 are tiled by the ten wooden pieces.
 */

export const COLS = 7;
export const ROWS = 8;
export const CELL_COUNT = COLS * ROWS;

/** What a playable cell stands for. */
export type CellKind = 'month' | 'day' | 'weekday';

/** Month number, 1 = January … 12 = December. */
export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** ISO weekday number, 1 = Monday … 7 = Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface BoardCell {
  /** Row index, 0 at the top. */
  readonly row: number;
  /** Column index, 0 at the left. */
  readonly col: number;
  /** `row * COLS + col`. */
  readonly index: number;
  readonly kind: CellKind;
  /** Month 1–12, day 1–31 or ISO weekday 1–7, depending on `kind`. */
  readonly value: number;
  /** Text engraved on the board, exactly as on the physical panel. */
  readonly label: string;
}

/** Month abbreviations as burned into the panel (note ИНЬ = июнь, ИЛЬ = июль). */
export const MONTH_LABELS: readonly string[] = [
  'ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИНЬ',
  'ИЛЬ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК',
];

/** Full month names, used by the date controls. */
export const MONTH_NAMES: readonly string[] = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

/** Weekday abbreviations, Monday first. */
export const WEEKDAY_LABELS: readonly string[] = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

/** Full weekday names, Monday first. */
export const WEEKDAY_NAMES: readonly string[] = [
  'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье',
];

export const MOTTO_LINES: readonly string[] = ['НОВЫЙ ДЕНЬ.', 'НОВЫЕ ВОЗМОЖНОСТИ!'];

function labelAt(list: readonly string[], oneBased: number): string {
  const label = list[oneBased - 1];
  if (label === undefined) {
    throw new RangeError(`no label for index ${oneBased}`);
  }
  return label;
}

function buildCells(): readonly (BoardCell | null)[] {
  const cells: (BoardCell | null)[] = new Array<BoardCell | null>(CELL_COUNT).fill(null);

  const put = (row: number, col: number, kind: CellKind, value: number, label: string): void => {
    cells[row * COLS + col] = { row, col, index: row * COLS + col, kind, value, label };
  };

  // Rows 0–1: the twelve months, six per row. Column 6 is under the balloon inlay.
  for (let month = 1; month <= 12; month += 1) {
    const row = month <= 6 ? 0 : 1;
    const col = (month - 1) % 6;
    put(row, col, 'month', month, labelAt(MONTH_LABELS, month));
  }

  // Rows 2–6: days 1–31, seven per row.
  for (let day = 1; day <= 31; day += 1) {
    const row = 2 + Math.floor((day - 1) / COLS);
    const col = (day - 1) % COLS;
    put(row, col, 'day', day, String(day));
  }

  // Monday–Thursday finish row 6; Friday–Sunday sit at the right of row 7.
  for (let weekday = 1; weekday <= 7; weekday += 1) {
    const row = weekday <= 4 ? 6 : 7;
    const col = weekday <= 4 ? 2 + weekday : weekday - 1;
    put(row, col, 'weekday', weekday, labelAt(WEEKDAY_LABELS, weekday));
  }

  return cells;
}

/** All 56 grid slots; `null` marks a slot covered by a walnut inlay. */
export const CELLS: readonly (BoardCell | null)[] = buildCells();

/** The 50 playable cells, in reading order. */
export const PLAYABLE_CELLS: readonly BoardCell[] = CELLS.filter(
  (cell): cell is BoardCell => cell !== null,
);

/** Cell indices that no piece may ever cover. */
export const BLOCKED_INDICES: readonly number[] = CELLS.flatMap((cell, index) =>
  cell === null ? [index] : [],
);

export function cellAt(row: number, col: number): BoardCell | null {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return null;
  return CELLS[row * COLS + col] ?? null;
}

export function cellByIndex(index: number): BoardCell | null {
  return CELLS[index] ?? null;
}

function findCell(kind: CellKind, value: number): BoardCell {
  const cell = PLAYABLE_CELLS.find((c) => c.kind === kind && c.value === value);
  if (cell === undefined) {
    throw new RangeError(`no ${kind} cell for value ${value}`);
  }
  return cell;
}

export function monthCell(month: Month): BoardCell {
  return findCell('month', month);
}

export function dayCell(day: number): BoardCell {
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    throw new RangeError(`day out of range: ${day}`);
  }
  return findCell('day', day);
}

export function weekdayCell(weekday: Weekday): BoardCell {
  return findCell('weekday', weekday);
}
