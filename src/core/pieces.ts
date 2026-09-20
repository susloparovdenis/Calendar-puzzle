/**
 * The ten wooden pieces, transcribed from the photograph of the set.
 *
 * Their cells add up to 5+5+5+5+5+5+5+4+4+4 = 47, which is exactly the number of
 * playable board cells (50) minus the three that stay open for the answer.
 *
 * The pieces are stained on both faces, so they may be flipped as well as
 * rotated; every distinct rotation/reflection is generated below.
 */

export type PieceId =
  | 'v-pent'
  | 'l-pent'
  | 'u-pent'
  | 'z-pent'
  | 'n-pent'
  | 'p-pent'
  | 't-pent'
  | 'j-tet'
  | 's-tet'
  | 'i-tet';

/** A cell offset inside a piece, `[row, col]`. */
export type Offset = readonly [row: number, col: number];

export interface Piece {
  readonly id: PieceId;
  /** Russian display name. */
  readonly name: string;
  /** Fill colour for the rendered piece (a wood tone). */
  readonly color: string;
  /** Darker edge tone, used for the bevel. */
  readonly edge: string;
  /** Base shape, normalised so the top-left of the bounding box is `[0, 0]`. */
  readonly shape: readonly Offset[];
}

function parse(rows: readonly string[]): readonly Offset[] {
  const cells: Offset[] = [];
  rows.forEach((line, row) => {
    for (let col = 0; col < line.length; col += 1) {
      if (line[col] === '#') cells.push([row, col]);
    }
  });
  return normalise(cells);
}

/** Shifts a shape so its bounding box starts at `[0, 0]`, then sorts it. */
export function normalise(cells: readonly Offset[]): readonly Offset[] {
  if (cells.length === 0) return [];
  let minRow = Number.POSITIVE_INFINITY;
  let minCol = Number.POSITIVE_INFINITY;
  for (const [row, col] of cells) {
    if (row < minRow) minRow = row;
    if (col < minCol) minCol = col;
  }
  return cells
    .map(([row, col]): Offset => [row - minRow, col - minCol])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

/** Rotates a shape 90° clockwise: `[r, c] -> [c, maxRow - r]`. */
export function rotate(cells: readonly Offset[]): readonly Offset[] {
  return normalise(cells.map(([row, col]): Offset => [col, -row]));
}

/** Mirrors a shape across its vertical axis. */
export function reflect(cells: readonly Offset[]): readonly Offset[] {
  return normalise(cells.map(([row, col]): Offset => [row, -col]));
}

function key(cells: readonly Offset[]): string {
  return cells.map(([row, col]) => `${row},${col}`).join(' ');
}

/** All distinct rotations and reflections of a shape, in a stable order. */
export function orientationsOf(shape: readonly Offset[]): readonly (readonly Offset[])[] {
  const seen = new Map<string, readonly Offset[]>();
  let current = normalise(shape);
  for (let flip = 0; flip < 2; flip += 1) {
    for (let turn = 0; turn < 4; turn += 1) {
      const k = key(current);
      if (!seen.has(k)) seen.set(k, current);
      current = rotate(current);
    }
    current = reflect(current);
  }
  return [...seen.values()];
}

export const PIECES: readonly Piece[] = [
  {
    id: 'v-pent',
    name: 'Угол',
    color: '#c9873f',
    edge: '#8d5622',
    shape: parse(['###', '..#', '..#']),
  },
  {
    id: 'l-pent',
    name: 'Клюшка',
    color: '#b7702f',
    edge: '#7d4618',
    shape: parse(['##', '.#', '.#', '.#']),
  },
  {
    id: 'u-pent',
    name: 'Скоба',
    color: '#d99a52',
    edge: '#9c6529',
    shape: parse(['###', '#.#']),
  },
  {
    id: 'z-pent',
    name: 'Зигзаг',
    color: '#a85f2b',
    edge: '#6f3c15',
    shape: parse(['#..', '###', '..#']),
  },
  {
    id: 'n-pent',
    name: 'Ступень',
    color: '#c47a42',
    edge: '#864b21',
    shape: parse(['##..', '.###']),
  },
  {
    id: 'p-pent',
    name: 'Плита',
    color: '#96552a',
    edge: '#653413',
    shape: parse(['###', '##.']),
  },
  {
    id: 't-pent',
    name: 'Молот',
    color: '#b8823c',
    edge: '#7e5320',
    shape: parse(['###', '.#.', '.#.']),
  },
  {
    id: 'j-tet',
    name: 'Уступ',
    color: '#e0a962',
    edge: '#a4722f',
    shape: parse(['..#', '###']),
  },
  {
    id: 's-tet',
    name: 'Змейка',
    color: '#8e6a3a',
    edge: '#5e441f',
    shape: parse(['##.', '.##']),
  },
  {
    id: 'i-tet',
    name: 'Брус',
    color: '#cf9350',
    edge: '#8f5f27',
    shape: parse(['#', '#', '#', '#']),
  },
];

export const PIECES_BY_ID: ReadonlyMap<PieceId, Piece> = new Map(
  PIECES.map((piece) => [piece.id, piece] as const),
);

export function pieceById(id: PieceId): Piece {
  const piece = PIECES_BY_ID.get(id);
  if (piece === undefined) throw new RangeError(`unknown piece: ${id}`);
  return piece;
}

/** Total number of cells across all ten pieces. */
export const TOTAL_PIECE_CELLS: number = PIECES.reduce((sum, piece) => sum + piece.shape.length, 0);
