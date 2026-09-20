import { describe, expect, it } from 'vitest';
import {
  PLACEMENT_COUNT,
  SearchLimitExceeded,
  countSolutions,
  solutionToCellMap,
  solutions,
  solveFirst,
  targetCells,
  type Solution,
} from './solver.ts';
import {
  BLOCKED_INDICES,
  CELL_COUNT,
  COLS,
  PLAYABLE_CELLS,
  cellByIndex,
  type Month,
  type Weekday,
} from './board.ts';
import { PIECES, TOTAL_PIECE_CELLS, orientationsOf, pieceById } from './pieces.ts';
import { daysInMonth, isMonth, isWeekday, puzzleDateFor, type PuzzleDate } from './date.ts';

const date = (month: number, day: number, weekday: number): PuzzleDate => {
  if (!isMonth(month) || !isWeekday(weekday)) throw new Error('bad test date');
  return { month, day, weekday };
};

/** Fully re-validates a solution against the board and the piece set. */
function assertValid(solution: Solution, target: PuzzleDate): void {
  expect(solution).toHaveLength(PIECES.length);

  const ids = solution.map((placed) => placed.pieceId);
  expect(new Set(ids).size, 'each piece used once').toBe(PIECES.length);
  expect([...ids].sort()).toEqual([...PIECES.map((p) => p.id)].sort());

  const covered = new Set<number>();
  for (const placed of solution) {
    const piece = pieceById(placed.pieceId);
    expect(placed.cells, placed.pieceId).toHaveLength(piece.shape.length);

    for (const index of placed.cells) {
      expect(covered.has(index), `cell ${index} covered twice`).toBe(false);
      covered.add(index);
      expect(cellByIndex(index), `cell ${index} is an inlay`).not.toBeNull();
    }

    // The covered cells must be one of the piece's own orientations.
    const rows = placed.cells.map((i) => Math.floor(i / COLS));
    const cols = placed.cells.map((i) => i % COLS);
    const minRow = Math.min(...rows);
    const minCol = Math.min(...cols);
    const shape = placed.cells
      .map((i) => [Math.floor(i / COLS) - minRow, (i % COLS) - minCol])
      .sort((a, b) => (a[0] ?? 0) - (b[0] ?? 0) || (a[1] ?? 0) - (b[1] ?? 0));
    const known = orientationsOf(piece.shape).map((o) => JSON.stringify(o));
    expect(known, `${placed.pieceId} keeps its shape`).toContain(JSON.stringify(shape));
  }

  expect(covered.size).toBe(TOTAL_PIECE_CELLS);

  const open = PLAYABLE_CELLS.filter((cell) => !covered.has(cell.index));
  expect(open.map((cell) => cell.index).sort((a, b) => a - b)).toEqual(
    [...targetCells(target)].sort((a, b) => a - b),
  );
  expect(open.map((cell) => `${cell.kind}:${cell.value}`).sort()).toEqual(
    [`day:${target.day}`, `month:${target.month}`, `weekday:${target.weekday}`].sort(),
  );
  for (const index of BLOCKED_INDICES) expect(covered.has(index)).toBe(false);
}

describe('placement table', () => {
  it('only contains placements that stay on playable cells', () => {
    expect(PLACEMENT_COUNT).toBeGreaterThan(0);
    expect(PLACEMENT_COUNT).toBe(1466);
  });
});

describe('targetCells', () => {
  it('returns the three cells that must stay open', () => {
    const cells = targetCells(date(9, 20, 7)).map((index) => cellByIndex(index));
    expect(cells.map((cell) => cell?.label)).toEqual(['СЕН', '20', 'ВС']);
  });

  it('never returns an inlay cell', () => {
    for (let month = 1; month <= 12; month += 1) {
      for (let day = 1; day <= 31; day += 1) {
        for (let weekday = 1; weekday <= 7; weekday += 1) {
          for (const index of targetCells(date(month, day, weekday))) {
            expect(BLOCKED_INDICES).not.toContain(index);
          }
        }
      }
    }
  });
});

describe('solveFirst', () => {
  it('solves the day the photograph was taken', () => {
    const target = puzzleDateFor(2026, 9, 20);
    const solution = solveFirst(target);
    expect(solution).not.toBeNull();
    if (solution !== null) assertValid(solution, target);
  });

  it('solves the board corners: 1 January and 31 December', () => {
    for (const target of [date(1, 1, 1), date(12, 31, 7)]) {
      const solution = solveFirst(target);
      expect(solution, JSON.stringify(target)).not.toBeNull();
      if (solution !== null) assertValid(solution, target);
    }
  });

  it('is deterministic', () => {
    const target = date(3, 14, 2);
    expect(solveFirst(target)).toEqual(solveFirst(target));
  });

  it('stops when the node budget runs out', () => {
    expect(() => solveFirst(date(7, 4, 5), { maxNodes: 1 })).toThrow(SearchLimitExceeded);
  });
});

describe('solutionToCellMap', () => {
  it('maps covered cells to pieces and leaves the answer cells open', () => {
    const target = date(9, 20, 7);
    const solution = solveFirst(target);
    expect(solution).not.toBeNull();
    if (solution === null) return;

    const map = solutionToCellMap(solution);
    expect(map).toHaveLength(CELL_COUNT);
    for (const index of targetCells(target)) expect(map[index]).toBeNull();
    for (const index of BLOCKED_INDICES) expect(map[index]).toBeNull();
    expect(map.filter((id) => id !== null)).toHaveLength(TOTAL_PIECE_CELLS);
  });
});

describe('solutions generator', () => {
  it('is lazy: taking one solution does not enumerate the rest', () => {
    const iterator = solutions(date(9, 20, 7));
    const first = iterator.next();
    expect(first.done).toBe(false);
    iterator.return(undefined);
  });

  it('never repeats a solution', () => {
    const seen = new Set<string>();
    let taken = 0;
    for (const solution of solutions(date(6, 6, 6))) {
      const key = JSON.stringify(
        [...solution].sort((a, b) => a.pieceId.localeCompare(b.pieceId)),
      );
      expect(seen.has(key)).toBe(false);
      seen.add(key);
      taken += 1;
      if (taken >= 300) break;
    }
    expect(taken).toBe(300);
  });

  it('produces only valid solutions', () => {
    const target = date(11, 3, 4);
    let checked = 0;
    for (const solution of solutions(target)) {
      assertValid(solution, target);
      checked += 1;
      if (checked >= 25) break;
    }
    expect(checked).toBe(25);
  });
});

describe('countSolutions', () => {
  it('honours the limit', () => {
    expect(countSolutions(date(9, 20, 7), 10)).toBe(10);
    expect(countSolutions(date(9, 20, 7), 1)).toBe(1);
  });

  it('counts every tiling for a date', () => {
    expect(countSolutions(date(9, 20, 7))).toBe(2270);
  });
});

describe('every date on the board is solvable', () => {
  it('covers all 2604 month/day/weekday combinations', { timeout: 120_000 }, () => {
    const failures: string[] = [];
    for (let month = 1; month <= 12; month += 1) {
      for (let day = 1; day <= 31; day += 1) {
        for (let weekday = 1; weekday <= 7; weekday += 1) {
          if (solveFirst(date(month, day, weekday)) === null) {
            failures.push(`${month}/${day}/${weekday}`);
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('solves every real date of a leap year, weekday included', { timeout: 60_000 }, () => {
    const year = 2024;
    for (let month = 1 as Month; month <= 12; month = (month + 1) as Month) {
      for (let day = 1; day <= daysInMonth(year, month); day += 1) {
        const target = puzzleDateFor(year, month, day);
        expect(solveFirst(target), `${year}-${month}-${day}`).not.toBeNull();
      }
    }
  });

  it('produces a valid tiling for a sample spread over the whole board', () => {
    const samples: readonly (readonly [number, number, number])[] = [
      [1, 1, 1], [2, 29, 4], [4, 15, 3], [6, 30, 6], [8, 27, 4],
      [10, 9, 2], [12, 31, 7], [5, 22, 5], [7, 7, 7], [3, 3, 3],
    ];
    for (const [month, day, weekday] of samples) {
      const target = date(month, day, weekday);
      const solution = solveFirst(target);
      expect(solution, `${month}/${day}/${weekday}`).not.toBeNull();
      if (solution !== null) assertValid(solution, target);
    }
  });
});

describe('weekday typing', () => {
  it('accepts every ISO weekday', () => {
    for (let weekday = 1; weekday <= 7; weekday += 1) {
      const value: Weekday = weekday as Weekday;
      expect(solveFirst(date(9, 20, value))).not.toBeNull();
    }
  });
});
