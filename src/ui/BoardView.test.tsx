// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach } from 'vitest';
import { BoardView } from './BoardView.tsx';
import { PLAYABLE_CELLS } from '../core/board.ts';
import { PIECES } from '../core/pieces.ts';
import { solveFirst, targetCells } from '../core/solver.ts';
import { puzzleDateFor } from '../core/date.ts';

afterEach(cleanup);

const date = puzzleDateFor(2026, 9, 20);
const solution = solveFirst(date);

function renderBoard(overrides: Partial<Parameters<typeof BoardView>[0]> = {}) {
  const onPickMonth = vi.fn();
  const onPickDay = vi.fn();
  const utils = render(
    <BoardView
      solution={solution}
      answerCells={targetCells(date)}
      month={9}
      day={20}
      maxDay={30}
      showPieces
      showLabels
      animationKey={0}
      onPickMonth={onPickMonth}
      onPickDay={onPickDay}
      {...overrides}
    />,
  );
  return { ...utils, onPickMonth, onPickDay };
}

describe('BoardView', () => {
  it('engraves every playable cell', () => {
    const { container } = renderBoard({ showPieces: false });
    const labels = [...container.querySelectorAll('.engraving:not(.engraving-ghost) text')];
    expect(labels).toHaveLength(PLAYABLE_CELLS.length);
    expect(labels.map((node) => node.textContent)).toContain('ЯНВ');
    expect(labels.map((node) => node.textContent)).toContain('31');
    expect(labels.map((node) => node.textContent)).toContain('ВС');
  });

  it('draws the motto of the bottom-left inlay', () => {
    const { container } = renderBoard();
    const motto = [...container.querySelectorAll('.motto text')].map((n) => n.textContent);
    expect(motto).toEqual(['НОВЫЙ ДЕНЬ.', 'НОВЫЕ ВОЗМОЖНОСТИ!']);
  });

  it('renders one silhouette per piece', () => {
    const { container } = renderBoard();
    expect(container.querySelectorAll('.piece')).toHaveLength(PIECES.length);
  });

  it('hides the pieces when asked', () => {
    const { container } = renderBoard({ showPieces: false });
    expect(container.querySelectorAll('.piece')).toHaveLength(0);
  });

  it('highlights exactly the three answer cells', () => {
    const { container } = renderBoard();
    expect(container.querySelectorAll('.answers rect')).toHaveLength(3);
  });

  it('shows the engraving through the pieces only when enabled', () => {
    const withLabels = renderBoard();
    expect(withLabels.container.querySelectorAll('.engraving-ghost text').length).toBeGreaterThan(0);
    cleanup();
    const without = renderBoard({ showLabels: false });
    expect(without.container.querySelectorAll('.engraving-ghost')).toHaveLength(0);
  });

  it('never draws ghost labels over the open answer cells', () => {
    const { container } = renderBoard();
    const ghosts = [...container.querySelectorAll('.engraving-ghost text')].map(
      (node) => node.textContent,
    );
    expect(ghosts).not.toContain('СЕН');
    expect(ghosts).not.toContain('20');
    expect(ghosts).not.toContain('ВС');
    expect(ghosts).toContain('ЯНВ');
  });

  it('reports the picked month and day', () => {
    const { onPickMonth, onPickDay } = renderBoard();
    fireEvent.click(screen.getByLabelText('Месяц МАР'));
    expect(onPickMonth).toHaveBeenCalledWith(3);
    fireEvent.click(screen.getByLabelText('Число 14'));
    expect(onPickDay).toHaveBeenCalledWith(14);
  });

  it('picks with the keyboard too', () => {
    const { onPickMonth } = renderBoard();
    fireEvent.keyDown(screen.getByLabelText('Месяц ДЕК'), { key: 'Enter' });
    expect(onPickMonth).toHaveBeenCalledWith(12);
    fireEvent.keyDown(screen.getByLabelText('Месяц ДЕК'), { key: ' ' });
    expect(onPickMonth).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(screen.getByLabelText('Месяц ДЕК'), { key: 'Escape' });
    expect(onPickMonth).toHaveBeenCalledTimes(2);
  });

  it('offers no hit area for the weekday cells, which the date decides', () => {
    renderBoard();
    expect(screen.queryByLabelText('Месяц ПН')).toBeNull();
    // 12 months + the 30 days September has; the 31 cell is not selectable.
    expect(screen.getAllByRole('button')).toHaveLength(42);
    expect(screen.queryByLabelText('Число 31')).toBeNull();
    expect(screen.getByLabelText('Число 30')).toBeInTheDocument();
  });

  it('disables the day cells the month does not reach', () => {
    const { container } = renderBoard({ month: 2, day: 1, maxDay: 28 });
    const disabled = [...container.querySelectorAll('.hit-disabled')];
    // 7 weekdays plus 29, 30 and 31.
    expect(disabled).toHaveLength(10);
    expect(disabled.every((node) => node.getAttribute('role') === null)).toBe(true);
  });

  it('marks the selected month and day', () => {
    const { container } = renderBoard();
    const selected = [...container.querySelectorAll('.hit-selected')];
    expect(selected).toHaveLength(2);
    expect(selected.map((node) => node.getAttribute('aria-label')).sort()).toEqual([
      'Месяц СЕН',
      'Число 20',
    ]);
  });

  it('draws nothing but the board when there is no solution', () => {
    const { container } = renderBoard({ solution: null });
    expect(container.querySelectorAll('.piece')).toHaveLength(0);
    expect(container.querySelectorAll('.engraving-ghost')).toHaveLength(0);
  });
});
