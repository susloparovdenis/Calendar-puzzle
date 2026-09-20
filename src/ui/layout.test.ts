import { describe, expect, it } from 'vitest';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  CELL,
  FRAME,
  PANEL_PATH,
  centerX,
  centerY,
  pathForCells,
  pathForShape,
  shapeExtent,
  x,
  y,
} from './layout.ts';
import { COLS, PLAYABLE_CELLS, ROWS, dayCell, monthCell } from '../core/board.ts';
import { PIECES } from '../core/pieces.ts';

describe('board metrics', () => {
  it('sizes the SVG from the grid plus the frame', () => {
    expect(BOARD_WIDTH).toBe(COLS * CELL + FRAME * 2);
    expect(BOARD_HEIGHT).toBe(ROWS * CELL + FRAME * 2);
  });

  it('maps cells to pixels', () => {
    expect(x(0)).toBe(0);
    expect(y(3)).toBe(300);
    expect(centerX(2)).toBe(250);
    expect(centerY(0)).toBe(50);
  });
});

describe('PANEL_PATH', () => {
  it('is a single closed contour around the playable cells', () => {
    expect(PANEL_PATH.startsWith('M')).toBe(true);
    expect(PANEL_PATH.match(/M/g)).toHaveLength(1);
    expect(PANEL_PATH.match(/Z/g)).toHaveLength(1);
    expect(PANEL_PATH).not.toContain('NaN');
  });

  it('stays inside the grid', () => {
    const numbers = [...PANEL_PATH.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)];
    expect(numbers.length).toBeGreaterThan(0);
    for (const [, px, py] of numbers) {
      expect(Number(px)).toBeGreaterThanOrEqual(0);
      expect(Number(px)).toBeLessThanOrEqual(COLS * CELL);
      expect(Number(py)).toBeGreaterThanOrEqual(0);
      expect(Number(py)).toBeLessThanOrEqual(ROWS * CELL);
    }
  });
});

describe('pathForCells', () => {
  it('draws a silhouette for a placed piece', () => {
    const path = pathForCells([monthCell(1).index, monthCell(2).index]);
    expect(path).not.toContain('NaN');
    expect(path.match(/Z/g)).toHaveLength(1);
  });

  it('draws separate contours for cells that do not touch', () => {
    const path = pathForCells([monthCell(1).index, dayCell(20).index]);
    expect(path.match(/M/g)).toHaveLength(2);
  });

  it('handles every playable cell without failing', () => {
    for (const cell of PLAYABLE_CELLS) {
      expect(pathForCells([cell.index]), cell.label).not.toContain('NaN');
    }
  });
});

describe('shapeExtent and pathForShape', () => {
  it('measures the bounding box in cells', () => {
    expect(shapeExtent([[0, 0], [0, 1], [1, 0]])).toEqual({ rows: 2, cols: 2 });
    expect(shapeExtent([[0, 0], [3, 0]])).toEqual({ rows: 4, cols: 1 });
    expect(shapeExtent([])).toEqual({ rows: 0, cols: 0 });
  });

  it('draws each piece thumbnail inside its own bounding box', () => {
    for (const piece of PIECES) {
      const { rows, cols } = shapeExtent(piece.shape);
      const path = pathForShape(piece.shape, 10);
      expect(path, piece.id).not.toContain('NaN');
      for (const [, px, py] of path.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)) {
        expect(Number(px)).toBeGreaterThanOrEqual(0);
        expect(Number(px)).toBeLessThanOrEqual(cols * 10);
        expect(Number(py)).toBeGreaterThanOrEqual(0);
        expect(Number(py)).toBeLessThanOrEqual(rows * 10);
      }
    }
  });
});
