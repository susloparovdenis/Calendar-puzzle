import { describe, expect, it } from 'vitest';
import { cellsToPath, insetRing, roundedPath, traceRings, type GridCell, type Point } from './outline.ts';
import { PIECES, orientationsOf } from './pieces.ts';

const area = (ring: readonly Point[]): number => {
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    if (a === undefined || b === undefined) continue;
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
};

const round = (value: number): number => Math.round(value * 1e9) / 1e9;

const toOffsets = (shape: readonly (readonly [number, number])[]): readonly GridCell[] => shape;

describe('traceRings', () => {
  it('traces a single square', () => {
    const rings = traceRings([[0, 0]]);
    expect(rings).toHaveLength(1);
    expect(rings[0]).toEqual([[0, 0], [1, 0], [1, 1], [0, 1]]);
  });

  it('merges adjacent cells into one rectangle with four corners', () => {
    const rings = traceRings([[0, 0], [0, 1], [0, 2]]);
    expect(rings).toHaveLength(1);
    expect(rings[0]).toEqual([[0, 0], [3, 0], [3, 1], [0, 1]]);
  });

  it('keeps the concave corners of an L', () => {
    const rings = traceRings([[0, 0], [1, 0], [1, 1]]);
    expect(rings[0]).toEqual([[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [0, 2]]);
  });

  it('traces the notch of the U pentomino as part of the outer ring', () => {
    const rings = traceRings([[0, 0], [0, 1], [0, 2], [1, 0], [1, 2]]);
    expect(rings).toHaveLength(1);
    expect(rings[0]).toHaveLength(8);
  });

  it('finds an inner ring for a shape with a hole', () => {
    const ringCells: GridCell[] = [];
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        if (row !== 1 || col !== 1) ringCells.push([row, col]);
      }
    }
    const rings = traceRings(ringCells);
    expect(rings).toHaveLength(2);
    // Outer contour runs clockwise (positive shoelace with y pointing down),
    // the hole runs the other way.
    const areas = rings.map(area).sort((a, b) => a - b);
    expect(areas[0]).toBeLessThan(0);
    expect(areas[1]).toBeGreaterThan(0);
    expect(Math.abs(areas[0] ?? 0)).toBe(1);
    expect(areas[1]).toBe(9);
  });

  it('returns one contour per disconnected group', () => {
    expect(traceRings([[0, 0], [0, 5]])).toHaveLength(2);
  });

  it('returns nothing for an empty cell set', () => {
    expect(traceRings([])).toEqual([]);
  });

  it('gives every real piece a single contour whose area equals its cell count', () => {
    for (const piece of PIECES) {
      for (const orientation of orientationsOf(piece.shape)) {
        const rings = traceRings(toOffsets(orientation));
        expect(rings, piece.id).toHaveLength(1);
        expect(area(rings[0] ?? []), piece.id).toBe(piece.shape.length);
      }
    }
  });

  it('drops vertices in the middle of a straight run', () => {
    // A 1x4 bar is a rectangle: four corners, not ten.
    expect(traceRings([[0, 0], [1, 0], [2, 0], [3, 0]])[0]).toHaveLength(4);
  });
});

describe('insetRing', () => {
  it('shrinks a square towards its centre', () => {
    const square = traceRings([[0, 0]])[0] ?? [];
    const inset = insetRing(square, 0.1).map(([x, y]) => [round(x), round(y)]);
    expect(inset).toEqual([[0.1, 0.1], [0.9, 0.1], [0.9, 0.9], [0.1, 0.9]]);
  });

  it('pushes concave corners outwards so the outline stays parallel', () => {
    const l = traceRings([[0, 0], [1, 0], [1, 1]])[0] ?? [];
    const inset = insetRing(l, 0.1);
    expect(inset).toHaveLength(l.length);
    expect(Math.abs(area(inset))).toBeLessThan(Math.abs(area(l)));
  });

  it('is a no-op for zero amount or degenerate rings', () => {
    const square = traceRings([[0, 0]])[0] ?? [];
    expect(insetRing(square, 0)).toBe(square);
    expect(insetRing([[0, 0], [1, 1]], 0.1)).toEqual([[0, 0], [1, 1]]);
  });
});

describe('roundedPath', () => {
  it('emits a closed path with an arc at each corner', () => {
    const path = cellsToPath([[0, 0]], { scale: 100, radius: 0.2 });
    expect(path.startsWith('M')).toBe(true);
    expect(path.trimEnd().endsWith('Z')).toBe(true);
    expect(path.match(/A/g)).toHaveLength(4);
  });

  it('scales grid units into pixels', () => {
    const path = cellsToPath([[0, 0]], { scale: 10, radius: 0 });
    expect(path).toBe('M0 0 L10 0 L10 10 L0 10 Z');
  });

  it('clamps the radius so arcs never overlap on short edges', () => {
    const path = cellsToPath([[0, 0]], { scale: 100, radius: 5 });
    const radii = [...path.matchAll(/A([\d.]+) /g)].map((m) => Number(m[1]));
    expect(radii.every((r) => r <= 50)).toBe(true);
  });

  it('turns clockwise at convex corners and anticlockwise at concave ones', () => {
    const path = cellsToPath([[0, 0], [1, 0], [1, 1]], { scale: 100, radius: 0.2 });
    const sweeps = [...path.matchAll(/A[\d.]+ [\d.]+ 0 0 ([01]) /g)].map((m) => m[1]);
    // Five convex corners (sweep 1) and one concave corner (sweep 0).
    expect(sweeps.filter((s) => s === '1')).toHaveLength(5);
    expect(sweeps.filter((s) => s === '0')).toHaveLength(1);
  });

  it('emits one subpath per contour', () => {
    const path = cellsToPath([[0, 0], [0, 5]], { scale: 10 });
    expect(path.match(/M/g)).toHaveLength(2);
    expect(path.match(/Z/g)).toHaveLength(2);
  });

  it('returns an empty string when there is nothing to draw', () => {
    expect(roundedPath([])).toBe('');
    expect(cellsToPath([])).toBe('');
  });

  it('draws every piece without producing NaN', () => {
    for (const piece of PIECES) {
      for (const orientation of orientationsOf(piece.shape)) {
        const path = cellsToPath(toOffsets(orientation), { scale: 100, radius: 0.16, inset: 0.03 });
        expect(path, piece.id).not.toContain('NaN');
        expect(path.length, piece.id).toBeGreaterThan(0);
      }
    }
  });
});
