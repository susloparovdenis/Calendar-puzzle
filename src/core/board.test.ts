import { describe, expect, it } from 'vitest';
import {
  BLOCKED_INDICES,
  CELLS,
  CELL_COUNT,
  COLS,
  MONTH_LABELS,
  PLAYABLE_CELLS,
  ROWS,
  WEEKDAY_LABELS,
  cellAt,
  cellByIndex,
  dayCell,
  monthCell,
  weekdayCell,
} from './board.ts';

describe('board geometry', () => {
  it('is a 7x8 grid', () => {
    expect(COLS).toBe(7);
    expect(ROWS).toBe(8);
    expect(CELL_COUNT).toBe(56);
    expect(CELLS).toHaveLength(56);
  });

  it('leaves exactly the six inlay cells blocked', () => {
    // Balloon inlay: column 6 of the two month rows. Motto inlay: first four
    // columns of the bottom row.
    expect([...BLOCKED_INDICES]).toEqual([6, 13, 49, 50, 51, 52]);
    expect(BLOCKED_INDICES.map((i) => [Math.floor(i / COLS), i % COLS])).toEqual([
      [0, 6],
      [1, 6],
      [7, 0],
      [7, 1],
      [7, 2],
      [7, 3],
    ]);
  });

  it('has 50 playable cells: 12 months, 31 days, 7 weekdays', () => {
    expect(PLAYABLE_CELLS).toHaveLength(50);
    const byKind = (kind: string): number =>
      PLAYABLE_CELLS.filter((cell) => cell.kind === kind).length;
    expect(byKind('month')).toBe(12);
    expect(byKind('day')).toBe(31);
    expect(byKind('weekday')).toBe(7);
  });

  it('gives every playable cell a unique index matching its row and column', () => {
    const indices = new Set(PLAYABLE_CELLS.map((cell) => cell.index));
    expect(indices.size).toBe(50);
    for (const cell of PLAYABLE_CELLS) {
      expect(cell.index).toBe(cell.row * COLS + cell.col);
      expect(cellByIndex(cell.index)).toBe(cell);
      expect(cellAt(cell.row, cell.col)).toBe(cell);
    }
  });

  it('lays the months out six per row, as engraved', () => {
    expect(monthCell(1)).toMatchObject({ row: 0, col: 0, label: 'ЯНВ' });
    expect(monthCell(6)).toMatchObject({ row: 0, col: 5, label: 'ИНЬ' });
    expect(monthCell(7)).toMatchObject({ row: 1, col: 0, label: 'ИЛЬ' });
    expect(monthCell(12)).toMatchObject({ row: 1, col: 5, label: 'ДЕК' });
    expect(MONTH_LABELS).toHaveLength(12);
  });

  it('lays the days out seven per row starting on row 2', () => {
    expect(dayCell(1)).toMatchObject({ row: 2, col: 0 });
    expect(dayCell(7)).toMatchObject({ row: 2, col: 6 });
    expect(dayCell(8)).toMatchObject({ row: 3, col: 0 });
    expect(dayCell(28)).toMatchObject({ row: 5, col: 6 });
    expect(dayCell(29)).toMatchObject({ row: 6, col: 0 });
    expect(dayCell(31)).toMatchObject({ row: 6, col: 2 });
  });

  it('puts Mon–Thu after day 31 and Fri–Sun on the last row', () => {
    expect(weekdayCell(1)).toMatchObject({ row: 6, col: 3, label: 'ПН' });
    expect(weekdayCell(4)).toMatchObject({ row: 6, col: 6, label: 'ЧТ' });
    expect(weekdayCell(5)).toMatchObject({ row: 7, col: 4, label: 'ПТ' });
    expect(weekdayCell(7)).toMatchObject({ row: 7, col: 6, label: 'ВС' });
    expect(WEEKDAY_LABELS).toEqual(['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']);
  });

  it('returns null outside the grid', () => {
    expect(cellAt(-1, 0)).toBeNull();
    expect(cellAt(0, COLS)).toBeNull();
    expect(cellAt(ROWS, 0)).toBeNull();
    expect(cellByIndex(999)).toBeNull();
  });

  it('rejects days outside 1..31', () => {
    expect(() => dayCell(0)).toThrow(RangeError);
    expect(() => dayCell(32)).toThrow(RangeError);
    expect(() => dayCell(1.5)).toThrow(RangeError);
  });
});
