// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/preact';
import { HowToSolve } from './HowToSolve.tsx';
import { PIECES } from '../core/pieces.ts';
import { PLACEMENT_COUNT } from '../core/solver.ts';
import { RU } from '../i18n/ru.ts';

afterEach(cleanup);

describe('HowToSolve', () => {
  it('quotes the placement count from the solver, not a hardcoded number', () => {
    const { container } = render(<HowToSolve />);
    // Grouped the way the language writes it: "1 466", not "1466".
    expect(container.querySelector('.howto-head p')?.textContent).toContain(
      PLACEMENT_COUNT.toLocaleString(RU.locale),
    );
  });

  it('lays out the steps in order', () => {
    const { container } = render(<HowToSolve />);
    const numbers = [...container.querySelectorAll('.howto-num')].map((n) => n.textContent);
    expect(numbers).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(container.querySelectorAll('.howto-steps h3')).toHaveLength(6);
  });

  it('marks exactly the region sizes the piece set cannot tile', () => {
    // Pieces are 4 and 5 cells, so 1, 2, 3, 6, 7 and 11 are dead ends.
    const { container } = render(<HowToSolve />);
    const dead = [...container.querySelectorAll('.howto-sizes .dead')].map((n) =>
      Number(n.textContent),
    );
    const ok = [...container.querySelectorAll('.howto-sizes .ok')].map((n) => Number(n.textContent));
    expect(dead).toEqual([1, 2, 3, 6, 7, 11]);
    expect(ok).toEqual([4, 5, 8, 9, 10, 12, 13]);
  });

  it('agrees with the real piece sizes', () => {
    const sizes = new Set(PIECES.map((piece) => piece.shape.length));
    expect([...sizes].sort()).toEqual([4, 5]);
    const { container } = render(<HowToSolve />);
    const ok = [...container.querySelectorAll('.howto-sizes .ok')].map((n) => Number(n.textContent));
    // Every "possible" size must be expressible as 4a + 5b.
    for (const size of ok) {
      const reachable = Array.from({ length: 4 }, (_u, a) =>
        Array.from({ length: 4 }, (_v, b) => a * 4 + b * 5),
      )
        .flat()
        .includes(size);
      expect(reachable, String(size)).toBe(true);
    }
  });

  it('illustrates the named pieces with their real shapes', () => {
    const { container } = render(<HowToSolve />);
    const thumbs = container.querySelectorAll('.howto-thumb path');
    expect(thumbs).toHaveLength(4);
    for (const thumb of thumbs) {
      expect(thumb.getAttribute('d') ?? '').not.toContain('NaN');
    }
    for (const name of ['Брус', 'Скоба', 'Молот', 'Плита']) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it('uses only piece names that exist in the set', () => {
    const { container } = render(<HowToSolve />);
    const names = new Set(PIECES.map((piece) => piece.name));
    for (const node of container.querySelectorAll('.howto-pieces strong')) {
      expect(names.has(node.textContent ?? '')).toBe(true);
    }
  });
});
