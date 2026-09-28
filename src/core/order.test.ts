import { describe, expect, it } from 'vitest';
import { MIN_PIECES_MOVED, diverseOrder, piecesMoved } from './order.ts';
import { solutions, type Solution } from './solver.ts';
import type { PuzzleDate } from './date.ts';

const date = (month: number, day: number, weekday: number): PuzzleDate =>
  ({ month, day, weekday }) as PuzzleDate;

const key = (solution: Solution): string =>
  JSON.stringify([...solution].sort((a, b) => a.pieceId.localeCompare(b.pieceId)));

function minNeighbourDistance(list: readonly Solution[]): number {
  let min = Number.POSITIVE_INFINITY;
  for (let i = 1; i < list.length; i += 1) {
    const previous = list[i - 1];
    const current = list[i];
    if (previous === undefined || current === undefined) throw new Error('hole in list');
    min = Math.min(min, piecesMoved(previous, current));
  }
  return min;
}

describe('piecesMoved', () => {
  it('is zero for a tiling against itself and counts differing pieces otherwise', () => {
    const [a, b] = [...solutions(date(9, 28, 1))];
    if (a === undefined || b === undefined) throw new Error('need two tilings');
    expect(piecesMoved(a, a)).toBe(0);
    const expected = a.filter(
      (piece) => b.find((other) => other.pieceId === piece.pieceId)?.cells.join() !== piece.cells.join(),
    ).length;
    expect(piecesMoved(a, b)).toBe(expected);
    expect(piecesMoved(a, b)).toBeGreaterThan(0);
  });
});

describe('diverseOrder', () => {
  // 28 Sep 2026 (Monday) — tilings 663–668 in solver order were near copies.
  const monday = [...solutions(date(9, 28, 1))];

  it('reproduces the problem: solver order has look-alike neighbours', () => {
    expect(piecesMoved(monday[662] as Solution, monday[663] as Solution)).toBeLessThan(
      MIN_PIECES_MOVED,
    );
    expect(minNeighbourDistance(monday)).toBeLessThanOrEqual(2);
  });

  it('is a permutation of the input and keeps the first tiling first', () => {
    const ordered = diverseOrder(monday);
    expect(ordered).toHaveLength(monday.length);
    expect(ordered[0]).toBe(monday[0]);
    expect(new Set(ordered.map(key))).toEqual(new Set(monday.map(key)));
  });

  it('is deterministic and does not touch its input', () => {
    const copy = [...monday];
    expect(diverseOrder(monday)).toEqual(diverseOrder(monday));
    expect(monday).toEqual(copy);
  });

  it.each([
    ['28 Sep, Monday', date(9, 28, 1)],
    ['6 Apr, Tuesday (fewest tilings)', date(4, 6, 2)],
    ['7 Jun, Wednesday (most tilings)', date(6, 7, 3)],
    ['29 Feb, Thursday', date(2, 29, 4)],
    // Here the stride leaves a look-alike pair a long way from any fix.
    ['6 Jul, Sunday', date(7, 6, 7)],
    ['31 (Sep cell), Monday', date(9, 31, 1)],
  ])('keeps neighbours clearly different: %s', (_label, target) => {
    const ordered = diverseOrder([...solutions(target)]);
    expect(minNeighbourDistance(ordered)).toBeGreaterThanOrEqual(MIN_PIECES_MOVED);
  });

  it('passes tiny lists through unchanged', () => {
    expect(diverseOrder([])).toEqual([]);
    expect(diverseOrder(monday.slice(0, 2))).toEqual(monday.slice(0, 2));
  });
});
