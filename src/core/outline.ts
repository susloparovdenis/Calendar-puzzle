/**
 * Turns a set of grid cells into SVG outlines.
 *
 * Used both for the wooden pieces and for the light birch panel of the board,
 * so that a piece is drawn as one silhouette with rounded corners rather than
 * as a cluster of squares.
 */

export type GridCell = readonly [row: number, col: number];
export type Point = readonly [x: number, y: number];

interface Edge {
  readonly from: Point;
  readonly to: Point;
}

const keyOfCell = ([row, col]: GridCell): string => `${row}:${col}`;
const keyOfPoint = ([x, y]: Point): string => `${x}:${y}`;

/**
 * Walks the boundary of a cell set and returns one closed ring per contour.
 *
 * Coordinates are in grid units with `x = col` and `y = row`, so a cell at
 * `[row, col]` spans the unit square from `[col, row]` to `[col + 1, row + 1]`.
 * Rings run clockwise on screen for outer contours.
 */
export function traceRings(cells: readonly GridCell[]): readonly (readonly Point[])[] {
  const filled = new Set(cells.map(keyOfCell));
  const has = (row: number, col: number): boolean => filled.has(`${row}:${col}`);

  const outgoing = new Map<string, Edge[]>();
  const addEdge = (from: Point, to: Point): void => {
    const list = outgoing.get(keyOfPoint(from));
    if (list === undefined) outgoing.set(keyOfPoint(from), [{ from, to }]);
    else list.push({ from, to });
  };

  for (const [row, col] of cells) {
    // Each boundary edge is oriented so the filled cell stays on its right.
    if (!has(row - 1, col)) addEdge([col, row], [col + 1, row]);
    if (!has(row, col + 1)) addEdge([col + 1, row], [col + 1, row + 1]);
    if (!has(row + 1, col)) addEdge([col + 1, row + 1], [col, row + 1]);
    if (!has(row, col - 1)) addEdge([col, row + 1], [col, row]);
  }

  const remaining = new Set<Edge>();
  for (const list of outgoing.values()) for (const edge of list) remaining.add(edge);

  const rings: (readonly Point[])[] = [];
  while (remaining.size > 0) {
    const first = remaining.values().next();
    if (first.done === true) break;
    const start: Edge = first.value;
    remaining.delete(start);
    const ring: Point[] = [start.from];
    let current = start;

    for (;;) {
      ring.push(current.to);
      if (keyOfPoint(current.to) === keyOfPoint(start.from)) break;
      const next = pickNext(outgoing.get(keyOfPoint(current.to)) ?? [], current, remaining);
      if (next === null) break;
      remaining.delete(next);
      current = next;
    }

    ring.pop(); // the ring is implicitly closed
    rings.push(dropCollinear(ring));
  }

  return rings;
}

/**
 * Chooses the continuation at a vertex. At a pinch point (two shapes touching
 * only diagonally) several edges leave the same vertex; taking the sharpest
 * clockwise turn keeps the walk on one contour.
 */
function pickNext(candidates: readonly Edge[], incoming: Edge, remaining: ReadonlySet<Edge>): Edge | null {
  const available = candidates.filter((edge) => remaining.has(edge));
  if (available.length === 0) return null;
  const [ix, iy] = direction(incoming);
  let best: Edge | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const edge of available) {
    const [ox, oy] = direction(edge);
    const cross = ix * oy - iy * ox; // > 0 is a clockwise turn on screen
    const dot = ix * ox + iy * oy;
    // Rank: hard right (1) > straight (0) > left (-1) > reverse (-2).
    const score = cross > 0 ? 1 : dot > 0 ? 0 : cross < 0 ? -1 : -2;
    if (score > bestScore) {
      bestScore = score;
      best = edge;
    }
  }
  return best;
}

function direction({ from, to }: Edge): Point {
  return [Math.sign(to[0] - from[0]), Math.sign(to[1] - from[1])];
}

/** Removes vertices that sit in the middle of a straight run. */
function dropCollinear(ring: readonly Point[]): readonly Point[] {
  const out: Point[] = [];
  const n = ring.length;
  for (let i = 0; i < n; i += 1) {
    const prev = ring[(i - 1 + n) % n];
    const curr = ring[i];
    const next = ring[(i + 1) % n];
    if (prev === undefined || curr === undefined || next === undefined) continue;
    const cross =
      (curr[0] - prev[0]) * (next[1] - curr[1]) - (curr[1] - prev[1]) * (next[0] - curr[0]);
    if (cross !== 0) out.push(curr);
  }
  return out;
}

/**
 * Renders rings as an SVG path, scaling grid units by `scale` and rounding every
 * corner with the given radius (in grid units). `inset` shrinks the silhouette
 * inwards, which leaves a hairline groove between neighbouring pieces.
 */
export function roundedPath(
  rings: readonly (readonly Point[])[],
  options: { readonly scale?: number; readonly radius?: number; readonly inset?: number } = {},
): string {
  const scale = options.scale ?? 1;
  const radius = options.radius ?? 0.18;
  const inset = options.inset ?? 0;
  const parts: string[] = [];

  for (const raw of rings) {
    const ring = inset === 0 ? raw : insetRing(raw, inset);
    const n = ring.length;
    if (n < 3) continue;

    const segments: string[] = [];
    for (let i = 0; i < n; i += 1) {
      const prev = ring[(i - 1 + n) % n];
      const curr = ring[i];
      const next = ring[(i + 1) % n];
      if (prev === undefined || curr === undefined || next === undefined) continue;

      const r = Math.min(radius, distance(prev, curr) / 2, distance(curr, next) / 2);
      const dIn = unit(prev, curr);
      const dOut = unit(curr, next);
      const start: Point = [curr[0] - dIn[0] * r, curr[1] - dIn[1] * r];
      const end: Point = [curr[0] + dOut[0] * r, curr[1] + dOut[1] * r];
      const sweep = dIn[0] * dOut[1] - dIn[1] * dOut[0] > 0 ? 1 : 0;

      segments.push(`${segments.length === 0 ? 'M' : 'L'}${fmt(start, scale)}`);
      if (r > 0) segments.push(`A${round(r * scale)} ${round(r * scale)} 0 0 ${sweep} ${fmt(end, scale)}`);
    }
    if (segments.length > 0) parts.push(`${segments.join(' ')} Z`);
  }

  return parts.join(' ');
}

/**
 * Moves every edge of a clockwise ring towards the interior by `amount` and
 * rebuilds the vertices from the shifted edges.
 */
export function insetRing(ring: readonly Point[], amount: number): readonly Point[] {
  const n = ring.length;
  if (n < 3 || amount === 0) return ring;

  const lines: { readonly point: Point; readonly dir: Point }[] = [];
  for (let i = 0; i < n; i += 1) {
    const from = ring[i];
    const to = ring[(i + 1) % n];
    if (from === undefined || to === undefined) return ring;
    const dir = unit(from, to);
    // Interior lies to the right of each directed edge, i.e. along (-dy, dx).
    const normal: Point = [-dir[1], dir[0]];
    lines.push({ point: [from[0] + normal[0] * amount, from[1] + normal[1] * amount], dir });
  }

  const out: Point[] = [];
  for (let i = 0; i < n; i += 1) {
    const incoming = lines[(i - 1 + n) % n];
    const outgoing = lines[i];
    const original = ring[i];
    if (incoming === undefined || outgoing === undefined || original === undefined) return ring;
    out.push(intersect(incoming, outgoing) ?? original);
  }
  return out;
}

function intersect(
  a: { readonly point: Point; readonly dir: Point },
  b: { readonly point: Point; readonly dir: Point },
): Point | null {
  const denominator = a.dir[0] * b.dir[1] - a.dir[1] * b.dir[0];
  if (Math.abs(denominator) < 1e-9) return null; // parallel edges
  const dx = b.point[0] - a.point[0];
  const dy = b.point[1] - a.point[1];
  const t = (dx * b.dir[1] - dy * b.dir[0]) / denominator;
  return [a.point[0] + a.dir[0] * t, a.point[1] + a.dir[1] * t];
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

function unit(a: Point, b: Point): Point {
  const length = distance(a, b) || 1;
  return [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
}

function fmt([x, y]: Point, scale: number): string {
  return `${round(x * scale)} ${round(y * scale)}`;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** Convenience wrapper: cells -> rounded SVG path. */
export function cellsToPath(
  cells: readonly GridCell[],
  options?: { readonly scale?: number; readonly radius?: number; readonly inset?: number },
): string {
  return roundedPath(traceRings(cells), options);
}
