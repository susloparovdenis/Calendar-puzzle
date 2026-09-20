import { COLS, ROWS, PLAYABLE_CELLS } from '../core/board.ts';
import { cellsToPath, type GridCell } from '../core/outline.ts';

/** Side of one board cell, in SVG user units. */
export const CELL = 100;
/** Width of the walnut frame around the engraved panel. */
export const FRAME = 62;

export const BOARD_WIDTH = COLS * CELL + FRAME * 2;
export const BOARD_HEIGHT = ROWS * CELL + FRAME * 2;

/** Outer corner radius of the whole board. */
export const BOARD_RADIUS = 46;

export const PIECE_RADIUS = 0.13;
export const PIECE_INSET = 0.028;

export const x = (col: number): number => col * CELL;
export const y = (row: number): number => row * CELL;
export const centerX = (col: number): number => col * CELL + CELL / 2;
export const centerY = (row: number): number => row * CELL + CELL / 2;

const playableGridCells: readonly GridCell[] = PLAYABLE_CELLS.map(
  (cell): GridCell => [cell.row, cell.col],
);

/** Silhouette of the light birch panel: the playable cells, minus the inlays. */
export const PANEL_PATH: string = cellsToPath(playableGridCells, {
  scale: CELL,
  radius: 0.1,
});

/** Turns board cell indices into a rounded silhouette path. */
export function pathForCells(indices: readonly number[]): string {
  const cells: GridCell[] = indices.map((index) => [Math.floor(index / COLS), index % COLS]);
  return cellsToPath(cells, { scale: CELL, radius: PIECE_RADIUS, inset: PIECE_INSET });
}

/** Rounded silhouette for a free-standing shape, e.g. the legend thumbnails. */
export function pathForShape(
  shape: readonly (readonly [number, number])[],
  scale: number,
): string {
  return cellsToPath(shape, { scale, radius: PIECE_RADIUS, inset: PIECE_INSET });
}

/** Bounding box of a shape in cells. */
export function shapeExtent(
  shape: readonly (readonly [number, number])[],
): { readonly rows: number; readonly cols: number } {
  let rows = 0;
  let cols = 0;
  for (const [row, col] of shape) {
    if (row + 1 > rows) rows = row + 1;
    if (col + 1 > cols) cols = col + 1;
  }
  return { rows, cols };
}

export const ROWS_TOTAL = ROWS;
export const COLS_TOTAL = COLS;
