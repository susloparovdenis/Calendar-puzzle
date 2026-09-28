/**
 * Display order for the tilings of one date.
 *
 * The solver walks the board depth-first, so neighbouring solutions share
 * almost every placement: consecutive tilings often differ only by two or
 * three pieces reshuffled in one corner, and paging through them looks like
 * the same picture over and over. This module spreads them out: it walks the
 * list with a golden-ratio stride (which lands far from where it just was in
 * the search tree), then patches any remaining look-alike pair — first by
 * pulling a more different tiling forward, and for the few stragglers at the
 * very end by moving them into an earlier gap where they fit.
 *
 * The order is deterministic and keeps the first tiling first.
 */

import type { Solution } from './solver.ts';

/** Consecutive tilings should move at least this many of the ten pieces. */
export const MIN_PIECES_MOVED = 6;

type Signature = ReadonlyMap<string, string>;

function signature(solution: Solution): Signature {
  const out = new Map<string, string>();
  for (const placed of solution) out.set(placed.pieceId, placed.cells.join(','));
  return out;
}

function moved(a: Signature, b: Signature): number {
  let count = 0;
  for (const [pieceId, cells] of a) if (b.get(pieceId) !== cells) count += 1;
  return count;
}

/** How many pieces sit in a different place in `b` than in `a`. */
export function piecesMoved(a: Solution, b: Solution): number {
  return moved(signature(a), signature(b));
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** A step coprime with `length`, close to `length / φ`. */
function goldenStep(length: number): number {
  let step = Math.max(1, Math.round((length * (Math.sqrt(5) - 1)) / 2));
  while (gcd(step, length) !== 1) step += 1;
  return step;
}

/**
 * Reorders tilings so that neighbours in the result look clearly different.
 * Returns a permutation of the input; the input is left untouched.
 */
export function diverseOrder(list: readonly Solution[]): Solution[] {
  const length = list.length;
  if (length < 3) return [...list];

  const signatures = list.map(signature);
  const distance = (a: number | undefined, b: number | undefined): number => {
    const left = signatures[a ?? -1];
    const right = signatures[b ?? -1];
    if (left === undefined || right === undefined) throw new RangeError('no such tiling');
    return moved(left, right);
  };
  const apart = (a: number | undefined, b: number | undefined): boolean =>
    distance(a, b) >= MIN_PIECES_MOVED;

  const step = goldenStep(length);
  const order = Array.from({ length }, (_unused, i) => (i * step) % length);

  // Greedy pass: whenever the next tiling looks too much like the previous one,
  // pull the most different one forward from further down the list. A clearly
  // different tiling is usually a step or two away.
  for (let i = 1; i < length; i += 1) {
    let best = i;
    let bestMoved = distance(order[i - 1], order[i]);
    for (let j = i + 1; j < length && bestMoved < MIN_PIECES_MOVED; j += 1) {
      const candidate = distance(order[i - 1], order[j]);
      if (candidate > bestMoved) {
        best = j;
        bestMoved = candidate;
      }
    }
    if (best !== i) [order[i], order[best]] = [order[best] ?? 0, order[i] ?? 0];
  }

  // Near the end the tail can run out of good partners. Move each leftover
  // look-alike into an earlier gap where it sits well between both neighbours.
  for (let i = 1; i < order.length; i += 1) {
    if (apart(order[i - 1], order[i])) continue;
    const stranded = order[i];
    const closes = i + 1 >= order.length || apart(order[i - 1], order[i + 1]);
    if (!closes) continue;
    for (let k = 1; k < order.length; k += 1) {
      if (k === i || k === i + 1) continue;
      if (apart(order[k - 1], stranded) && apart(stranded, order[k])) {
        order.splice(i, 1);
        order.splice(k < i ? k : k - 1, 0, stranded ?? 0);
        break;
      }
    }
  }

  return order.map((index) => {
    const solution = list[index];
    if (solution === undefined) throw new RangeError(`no tiling at ${index}`);
    return solution;
  });
}
