// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/preact';
import { PieceLegend } from './PieceLegend.tsx';
import { PIECES } from '../core/pieces.ts';

afterEach(cleanup);

describe('PieceLegend', () => {
  it('shows all ten pieces with their names and sizes', () => {
    const { container } = render(<PieceLegend />);
    expect(container.querySelectorAll('li')).toHaveLength(PIECES.length);
    for (const piece of PIECES) {
      expect(screen.getByText(piece.name)).toBeInTheDocument();
    }
    expect(container.querySelectorAll('.legend-shape path')).toHaveLength(PIECES.length);
  });

  it('draws thumbnails at a shared cell size, so the pieces stay in proportion', () => {
    const { container } = render(<PieceLegend />);
    const bars = [...container.querySelectorAll('.legend-shape')];
    // The 1x4 bar is four cells tall and one wide; the 3x2 U is the other way round.
    const heights = bars.map((svg) => Number(svg.getAttribute('height')));
    const widths = bars.map((svg) => Number(svg.getAttribute('width')));
    expect(Math.max(...heights)).toBeGreaterThan(Math.min(...heights));
    expect(Math.max(...widths)).toBeGreaterThan(Math.min(...widths));
  });
});
