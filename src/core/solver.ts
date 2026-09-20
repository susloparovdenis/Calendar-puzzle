/**
 * Exact-cover solver for the calendar board.
 *
 * The search is plain backtracking over "the first cell that is still open":
 * every candidate placement must cover that cell, which keeps the branching
 * factor tiny. Two things make it fast enough to run synchronously in the UI:
 *
 *  - placements are precomputed once and bucketed by their lowest cell index,
 *    so the candidate list for a given open cell is a direct array lookup;
 *  - after each placement the remaining empty area is flood-filled and every
 *    connected region is checked against the sizes the unused pieces can still
 *    add up to (a region of 3, 6, 7 … cells can never be filled by 4- and
 *    5-cell pieces, so the branch is abandoned immediately).
 *
 * `Search` holds the mutable state. Two walkers drive it: a generator, for the
 * UI, which can be paused between solutions, and a callback walker, which never
 * materialises a solution it is not asked for and so counts several times
 * faster. Their agreement is covered by tests.
 */

import { CELL_COUNT, COLS, ROWS, cellAt, dayCell, monthCell, weekdayCell } from './board.ts';
import { PIECES, TOTAL_PIECE_CELLS, orientationsOf, type PieceId } from './pieces.ts';
import type { PuzzleDate } from './date.ts';

export interface PlacedPiece {
  readonly pieceId: PieceId;
  /** Board cell indices covered by this piece, ascending. */
  readonly cells: readonly number[];
}

export type Solution = readonly PlacedPiece[];

export interface SolveOptions {
  /** Stop after visiting this many search nodes. Guards against pathological input. */
  readonly maxNodes?: number;
}

const DEFAULT_MAX_NODES = 20_000_000;

interface Placement {
  readonly pieceIndex: number;
  readonly cells: readonly number[];
  readonly min: number;
}

/** Every legal placement of every piece on the empty board, bucketed by lowest cell. */
function buildPlacements(): readonly (readonly Placement[])[] {
  const buckets: Placement[][] = Array.from({ length: CELL_COUNT }, () => []);

  PIECES.forEach((piece, pieceIndex) => {
    for (const orientation of orientationsOf(piece.shape)) {
      let height = 0;
      let width = 0;
      for (const [row, col] of orientation) {
        if (row + 1 > height) height = row + 1;
        if (col + 1 > width) width = col + 1;
      }
      for (let top = 0; top + height <= ROWS; top += 1) {
        for (let left = 0; left + width <= COLS; left += 1) {
          const cells: number[] = [];
          let fits = true;
          for (const [row, col] of orientation) {
            const cell = cellAt(top + row, left + col);
            if (cell === null) {
              fits = false;
              break;
            }
            cells.push(cell.index);
          }
          if (!fits) continue;
          cells.sort((a, b) => a - b);
          const min = cells[0];
          if (min === undefined) continue;
          buckets[min]?.push({ pieceIndex, cells, min });
        }
      }
    }
  });

  return buckets;
}

const PLACEMENTS_BY_MIN_CELL = buildPlacements();

/** Number of legal placements on the board, summed over all pieces and orientations. */
export const PLACEMENT_COUNT: number = PLACEMENTS_BY_MIN_CELL.reduce(
  (sum, bucket) => sum + bucket.length,
  0,
);

const PIECE_SIZES: readonly number[] = PIECES.map((piece) => piece.shape.length);
const TETROMINO_COUNT = PIECE_SIZES.filter((size) => size === 4).length;
const PENTOMINO_COUNT = PIECE_SIZES.filter((size) => size === 5).length;

/**
 * `REACHABLE[fours][fives]` marks every area that `fours` 4-cell pieces and
 * `fives` 5-cell pieces can tile between them, ignoring shape.
 */
const REACHABLE: readonly (readonly Uint8Array[])[] = Array.from(
  { length: TETROMINO_COUNT + 1 },
  (_unused, fours) =>
    Array.from({ length: PENTOMINO_COUNT + 1 }, (_alsoUnused, fives) => {
      const table = new Uint8Array(TOTAL_PIECE_CELLS + 1);
      for (let i = 0; i <= fours; i += 1) {
        for (let j = 0; j <= fives; j += 1) {
          table[i * 4 + j * 5] = 1;
        }
      }
      return table;
    }),
);

function isReachable(area: number, fours: number, fives: number): boolean {
  return REACHABLE[fours]?.[fives]?.[area] === 1;
}

/** The three cells that must stay uncovered for a given date. */
export function targetCells(date: PuzzleDate): readonly number[] {
  return [
    monthCell(date.month).index,
    dayCell(date.day).index,
    weekdayCell(date.weekday).index,
  ];
}

/** Neighbour lists over playable cells, used by the flood fill. */
const NEIGHBOURS: readonly (readonly number[])[] = Array.from(
  { length: CELL_COUNT },
  (_unused, index) => {
    const row = Math.floor(index / COLS);
    const col = index % COLS;
    const out: number[] = [];
    for (const [dr, dc] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as const) {
      const neighbour = cellAt(row + dr, col + dc);
      if (neighbour !== null) out.push(neighbour.index);
    }
    return out;
  },
);

export class SearchLimitExceeded extends Error {
  constructor(public readonly nodes: number) {
    super(`search stopped after ${nodes} nodes`);
    this.name = 'SearchLimitExceeded';
  }
}

/** Mutable state of one run of the search over one date. */
class Search {
  /** 1 = unavailable (inlay, chosen date cell, or already covered), 0 = still open. */
  private readonly occupied = new Uint8Array(CELL_COUNT).fill(1);
  private readonly used = new Uint8Array(PIECES.length);
  private readonly stack: Placement[] = [];
  private readonly visited = new Int32Array(CELL_COUNT);
  private readonly queue = new Int32Array(CELL_COUNT);
  private stamp = 0;
  private nodes = 0;
  private remainingFours = TETROMINO_COUNT;
  private remainingFives = PENTOMINO_COUNT;

  constructor(
    date: PuzzleDate,
    private readonly maxNodes: number,
  ) {
    for (let index = 0; index < CELL_COUNT; index += 1) {
      if (cellAt(Math.floor(index / COLS), index % COLS) !== null) this.occupied[index] = 0;
    }
    for (const index of targetCells(date)) this.occupied[index] = 1;
  }

  /** Counts a visited node and enforces the search budget. */
  tick(): void {
    this.nodes += 1;
    if (this.nodes > this.maxNodes) throw new SearchLimitExceeded(this.nodes);
  }

  /** Lowest still-open cell at or after `from`, or `CELL_COUNT` when the board is full. */
  firstOpen(from: number): number {
    let cell = from;
    while (cell < CELL_COUNT && this.occupied[cell] === 1) cell += 1;
    return cell;
  }

  candidates(cell: number): readonly Placement[] {
    return PLACEMENTS_BY_MIN_CELL[cell] ?? [];
  }

  fits(placement: Placement): boolean {
    if (this.used[placement.pieceIndex] === 1) return false;
    for (const index of placement.cells) {
      if (this.occupied[index] === 1) return false;
    }
    return true;
  }

  place(placement: Placement): void {
    for (const index of placement.cells) this.occupied[index] = 1;
    this.used[placement.pieceIndex] = 1;
    this.stack.push(placement);
    if (placement.cells.length === 4) this.remainingFours -= 1;
    else this.remainingFives -= 1;
  }

  undo(placement: Placement): void {
    if (placement.cells.length === 4) this.remainingFours += 1;
    else this.remainingFives += 1;
    this.stack.pop();
    this.used[placement.pieceIndex] = 0;
    for (const index of placement.cells) this.occupied[index] = 0;
  }

  /**
   * True when every connected empty region has a size the unused pieces can
   * tile. Cells below `from` are known to be covered, so the scan starts there.
   */
  regionsAreFillable(from: number): boolean {
    this.stamp += 1;
    for (let start = from; start < CELL_COUNT; start += 1) {
      if (this.occupied[start] === 1 || this.visited[start] === this.stamp) continue;
      let head = 0;
      let tail = 0;
      this.queue[tail] = start;
      tail += 1;
      this.visited[start] = this.stamp;
      let area = 0;
      while (head < tail) {
        const cell = this.queue[head];
        head += 1;
        if (cell === undefined) continue;
        area += 1;
        for (const neighbour of NEIGHBOURS[cell] ?? []) {
          if (this.occupied[neighbour] === 0 && this.visited[neighbour] !== this.stamp) {
            this.visited[neighbour] = this.stamp;
            this.queue[tail] = neighbour;
            tail += 1;
          }
        }
      }
      if (!isReachable(area, this.remainingFours, this.remainingFives)) return false;
    }
    return true;
  }

  /** Copies the pieces placed so far into a plain, immutable solution. */
  snapshot(): Solution {
    return this.stack.map((placement) => ({
      pieceId: pieceIdAt(placement.pieceIndex),
      cells: [...placement.cells],
    }));
  }
}

function pieceIdAt(index: number): PieceId {
  const piece = PIECES[index];
  if (piece === undefined) throw new RangeError(`no piece at index ${index}`);
  return piece.id;
}

/**
 * Lazily enumerates every tiling for a date. Solutions are produced in a stable
 * order, so the same date always yields the same sequence.
 */
export function* solutions(date: PuzzleDate, options: SolveOptions = {}): Generator<Solution> {
  yield* walk(new Search(date, options.maxNodes ?? DEFAULT_MAX_NODES), 0);
}

function* walk(search: Search, from: number): Generator<Solution> {
  search.tick();

  const cell = search.firstOpen(from);
  if (cell === CELL_COUNT) {
    yield search.snapshot();
    return;
  }

  for (const placement of search.candidates(cell)) {
    if (!search.fits(placement)) continue;
    search.place(placement);
    if (search.regionsAreFillable(cell)) yield* walk(search, cell + 1);
    search.undo(placement);
  }
}

/**
 * Walks every tiling for a date, calling `visit` for each one. `visit` receives
 * a thunk rather than a solution, so a caller that only counts never pays for
 * building one; returning `false` stops the walk.
 *
 * This is the fast path — it avoids the generator machinery entirely.
 */
export function forEachSolution(
  date: PuzzleDate,
  visit: (snapshot: () => Solution) => boolean,
  options: SolveOptions = {},
): void {
  const search = new Search(date, options.maxNodes ?? DEFAULT_MAX_NODES);
  descend(search, 0, visit);
}

function descend(
  search: Search,
  from: number,
  visit: (snapshot: () => Solution) => boolean,
): boolean {
  search.tick();

  const cell = search.firstOpen(from);
  if (cell === CELL_COUNT) return visit(() => search.snapshot());

  for (const placement of search.candidates(cell)) {
    if (!search.fits(placement)) continue;
    search.place(placement);
    const keepGoing = search.regionsAreFillable(cell) ? descend(search, cell + 1, visit) : true;
    search.undo(placement);
    if (!keepGoing) return false;
  }
  return true;
}

/** The first solution for a date, or `null` if there is none. */
export function solveFirst(date: PuzzleDate, options: SolveOptions = {}): Solution | null {
  let found: Solution | null = null;
  forEachSolution(
    date,
    (snapshot) => {
      found = snapshot();
      return false;
    },
    options,
  );
  return found;
}

/** Counts solutions, stopping once `limit` have been found. */
export function countSolutions(
  date: PuzzleDate,
  limit = Number.POSITIVE_INFINITY,
  options: SolveOptions = {},
): number {
  if (limit <= 0) return 0;
  let count = 0;
  forEachSolution(
    date,
    () => {
      count += 1;
      return count < limit;
    },
    options,
  );
  return count;
}

/** Maps every covered cell to the piece covering it; open cells stay `null`. */
export function solutionToCellMap(solution: Solution): readonly (PieceId | null)[] {
  const map: (PieceId | null)[] = new Array<PieceId | null>(CELL_COUNT).fill(null);
  for (const placed of solution) {
    for (const index of placed.cells) map[index] = placed.pieceId;
  }
  return map;
}
