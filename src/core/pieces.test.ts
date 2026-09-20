import { describe, expect, it } from 'vitest';
import {
  PIECES,
  TOTAL_PIECE_CELLS,
  normalise,
  orientationsOf,
  pieceById,
  reflect,
  rotate,
  type Offset,
} from './pieces.ts';
import { PLAYABLE_CELLS } from './board.ts';

const render = (cells: readonly Offset[]): readonly string[] => {
  const height = Math.max(...cells.map(([row]) => row)) + 1;
  const width = Math.max(...cells.map(([, col]) => col)) + 1;
  const grid = Array.from({ length: height }, () => Array.from({ length: width }, () => '.'));
  for (const [row, col] of cells) {
    const line = grid[row];
    if (line !== undefined) line[col] = '#';
  }
  return grid.map((line) => line.join(''));
};

const isConnected = (cells: readonly Offset[]): boolean => {
  const keys = new Set(cells.map(([r, c]) => `${r},${c}`));
  const first = cells[0];
  if (first === undefined) return true;
  const seen = new Set([`${first[0]},${first[1]}`]);
  const stack: Offset[] = [first];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) break;
    const [row, col] = current;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const key = `${row + dr},${col + dc}`;
      if (keys.has(key) && !seen.has(key)) {
        seen.add(key);
        stack.push([row + dr, col + dc]);
      }
    }
  }
  return seen.size === cells.length;
};

describe('piece set', () => {
  it('has the ten pieces from the photographed set', () => {
    expect(PIECES).toHaveLength(10);
    expect(new Set(PIECES.map((p) => p.id)).size).toBe(10);
  });

  it('covers exactly the playable cells minus the three answer cells', () => {
    expect(TOTAL_PIECE_CELLS).toBe(47);
    expect(TOTAL_PIECE_CELLS).toBe(PLAYABLE_CELLS.length - 3);
  });

  it('is made of seven pentominoes and three tetrominoes', () => {
    const sizes = PIECES.map((p) => p.shape.length).sort((a, b) => a - b);
    expect(sizes).toEqual([4, 4, 4, 5, 5, 5, 5, 5, 5, 5]);
  });

  it('matches the shapes read off the photograph', () => {
    expect(render(pieceById('v-pent').shape)).toEqual(['###', '..#', '..#']);
    expect(render(pieceById('l-pent').shape)).toEqual(['##', '.#', '.#', '.#']);
    expect(render(pieceById('u-pent').shape)).toEqual(['###', '#.#']);
    expect(render(pieceById('z-pent').shape)).toEqual(['#..', '###', '..#']);
    expect(render(pieceById('n-pent').shape)).toEqual(['##..', '.###']);
    expect(render(pieceById('p-pent').shape)).toEqual(['###', '##.']);
    expect(render(pieceById('t-pent').shape)).toEqual(['###', '.#.', '.#.']);
    expect(render(pieceById('j-tet').shape)).toEqual(['..#', '###']);
    expect(render(pieceById('s-tet').shape)).toEqual(['##.', '.##']);
    expect(render(pieceById('i-tet').shape)).toEqual(['#', '#', '#', '#']);
  });

  it('has connected, normalised shapes with no duplicate cells', () => {
    for (const piece of PIECES) {
      expect(isConnected(piece.shape), piece.id).toBe(true);
      expect(Math.min(...piece.shape.map(([r]) => r))).toBe(0);
      expect(Math.min(...piece.shape.map(([, c]) => c))).toBe(0);
      expect(new Set(piece.shape.map((cell) => cell.join(','))).size).toBe(piece.shape.length);
    }
  });

  it('throws for an unknown id', () => {
    // @ts-expect-error -- exercising the runtime guard with an invalid id
    expect(() => pieceById('nope')).toThrow(RangeError);
  });
});

describe('shape transforms', () => {
  it('normalises to the origin and sorts', () => {
    expect(normalise([[3, 5], [2, 5], [2, 6]])).toEqual([[0, 0], [0, 1], [1, 0]]);
  });

  it('rotates a quarter turn clockwise', () => {
    // ##.      .#
    // .#.  ->  ##
    //          #.
    expect(render(rotate(normalise([[0, 0], [0, 1], [1, 1]])))).toEqual(['.#', '##']);
  });

  it('returns to the start after four rotations', () => {
    for (const piece of PIECES) {
      let shape = piece.shape;
      for (let i = 0; i < 4; i += 1) shape = rotate(shape);
      expect(shape, piece.id).toEqual(normalise(piece.shape));
    }
  });

  it('is an involution when reflecting twice', () => {
    for (const piece of PIECES) {
      expect(reflect(reflect(piece.shape)), piece.id).toEqual(normalise(piece.shape));
    }
  });

  it('preserves cell count under every transform', () => {
    for (const piece of PIECES) {
      for (const orientation of orientationsOf(piece.shape)) {
        expect(orientation, piece.id).toHaveLength(piece.shape.length);
      }
    }
  });
});

describe('orientationsOf', () => {
  it('yields the expected number of distinct orientations per piece', () => {
    const counts = Object.fromEntries(
      PIECES.map((piece) => [piece.id, orientationsOf(piece.shape).length]),
    );
    expect(counts).toEqual({
      'v-pent': 4, //  4-fold symmetric arm shape
      'l-pent': 8,
      'u-pent': 4,
      'z-pent': 4,
      'n-pent': 8,
      'p-pent': 8,
      't-pent': 4,
      'j-tet': 8,
      's-tet': 4,
      'i-tet': 2,
    });
  });

  it('produces no duplicates', () => {
    for (const piece of PIECES) {
      const orientations = orientationsOf(piece.shape);
      const keys = orientations.map((cells) => cells.map((cell) => cell.join(',')).join(' '));
      expect(new Set(keys).size, piece.id).toBe(orientations.length);
    }
  });

  it('is closed under rotation and reflection', () => {
    for (const piece of PIECES) {
      const orientations = orientationsOf(piece.shape);
      const keys = new Set(orientations.map((cells) => JSON.stringify(cells)));
      for (const orientation of orientations) {
        expect(keys.has(JSON.stringify(rotate(orientation))), piece.id).toBe(true);
        expect(keys.has(JSON.stringify(reflect(orientation))), piece.id).toBe(true);
      }
    }
  });

  it('includes the original shape', () => {
    for (const piece of PIECES) {
      const keys = orientationsOf(piece.shape).map((cells) => JSON.stringify(cells));
      expect(keys, piece.id).toContain(JSON.stringify(normalise(piece.shape)));
    }
  });
});
